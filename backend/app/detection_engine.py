
import networkx as nx
import numpy as np
from typing import List, Dict
from app.rules import current_rules

def detect_cycles(G: nx.DiGraph) -> List[List[str]]:
    """
    Detects circular money flows of length 3-5 with CHRONOLOGICAL constraints.
    Rule: T(A->B) < T(B->C) < ... < T(Z->A)
    """
    cycles = []
    min_len = current_rules.min_cycle_length
    max_len = current_rules.max_cycle_length
    
    def temporal_dfs(path: List[str], current_time: float, visited_edges: set):
        curr = path[-1]
        
        # Prune depth
        if len(path) > max_len:
            return

        # Check for cycle closure
        if len(path) >= min_len:
            # Check edge back to start
            start_node = path[0]
            if G.has_edge(curr, start_node):
                # Check timestamp constraint for closing edge
                edge_data = G[curr][start_node]
                # Get earliest timestamp greater than current_time
                valid_closing = False
                for ts in edge_data.get('timestamps', []):
                    if ts.timestamp() > current_time:
                        valid_closing = True
                        break
                
                if valid_closing:
                    cycles.append(path + [start_node])
        
        # Explore neighbors
        for neighbor in G.successors(curr):
            if neighbor in path: continue # internal loop, not simple cycle
            
            # Check edge time constraint
            edge_data = G[curr][neighbor]
            valid_timestamps = [t.timestamp() for t in edge_data.get('timestamps', []) if t.timestamp() > current_time]
            
            if valid_timestamps:
                # Continue DFS with the earliest valid next timestamp
                next_time = min(valid_timestamps)
                # Avoid re-traversing same edge in same DFS branch? 
                # For simplified detection, we just proceed.
                temporal_dfs(path + [neighbor], next_time, visited_edges)

    # Start DFS from each node
    # Optimization: Sort edges by time and only start from valid sequences?
    # For now, iterate all nodes.
    import pandas as pd
    for node in G.nodes():
        # Start with an initial time of 0 (or very old)
        # Actually, we need to pick an OUTGOING edge to start the chain.
        for neighbor in G.successors(node):
            edge_data = G[node][neighbor]
            for ts in edge_data.get('timestamps', []):
                temporal_dfs([node, neighbor], ts.timestamp(), set())
                
    # Deduplicate cycles (A-B-C-A is same as B-C-A-B)
    unique_cycles = []
    seen = set()
    for c in cycles:
        # Standardize cycle representation
        # Rotate so smallest node is first
        min_idx = c.index(min(c[:-1]))
        standard = tuple(c[min_idx:-1] + c[:min_idx] + [c[min_idx]]) # Keep it strictly as node sequence
        standard_path = tuple(sorted(set(c))) # Just set of nodes for uniqueness? No, direction matters.
        # Let's stringify the sorted tuple for dedupe
        cycle_id = str(standard)
        if cycle_id not in seen:
            seen.add(cycle_id)
            unique_cycles.append(c)
            
    return unique_cycles

def detect_commission(G: nx.DiGraph, cycles: List[List[str]]) -> List[str]:
    """
    Checks if cycles exhibit 1-5% value loss (Commission Retention) at each hop.
    Returns list of Cycle IDs or Nodes involved in commission cycles.
    """
    commission_suspects = set()
    
    for cycle in cycles:
        # Check flow consistency
        is_commission_pattern = True
        
        for i in range(len(cycle) - 1):
            u, v = cycle[i], cycle[i+1]
            
            # This is complex because we have multiple edges/timestamps.
            # Simplified: Look at total amounts or average amounts?
            # User wants "Amount reduces by 1%-5% at each hop".
            # We need to trace the SPECIFIC transaction path found in DFS.
            
            # Since DFS just returns nodes, we re-verify totals for now.
            try:
                amt_u_v = G[u][v]['total_amount']
                # Look at next hop
                if i < len(cycle) - 2:
                    next_u, next_v = cycle[i+1], cycle[i+2]
                    amt_next = G[next_u][next_v]['total_amount']
                    
                    # Retention Check
                    # retained = amt_u_v - amt_next
                    # percent = retained / amt_u_v
                    if amt_u_v > 0:
                        retention = (amt_u_v - amt_next) / amt_u_v
                        if not (0.01 <= retention <= 0.05):
                            is_commission_pattern = False
                            break
            except KeyError:
                is_commission_pattern = False
                break
                
        if is_commission_pattern:
            for node in cycle:
                commission_suspects.add(node)
                
    return list(commission_suspects)

def _calculate_dynamic_threshold(degrees: List[int], absolute_min: int, sigma: float) -> float:
    """
    Calculates a threshold based on statistical distribution (Mean + Sigma*StdDev).
    Ensures it never falls below the absolute_min.
    """
    if not degrees:
        return absolute_min
    
    mean = np.mean(degrees)
    std = np.std(degrees)
    statistical_limit = mean + (std * sigma)
    
    return max(absolute_min, statistical_limit)

def _count_in_time_window(timestamps: List, window_hours: int) -> int:
    """
    Returns max number of timestamps occurring within any `window_hours` sliding window.
    """
    if not timestamps:
        return 0
    
    timestamps.sort()
    max_count = 0
    window_delta = np.timedelta64(window_hours, 'h')
    
    # Sliding window
    left = 0
    for right in range(len(timestamps)):
        while timestamps[right] - timestamps[left] > window_delta:
            left += 1
        max_count = max(max_count, right - left + 1)
        
    return max_count

def _extract_timestamps(G: nx.DiGraph, u: str, v: str) -> List:
    return G[u][v].get('timestamps', [])

def detect_fan_out(G: nx.DiGraph) -> Dict[str, dict]:
    """
    Detects high fan-out (1 -> Many) with TEMPORAL concentration using functional patterns.
    """
    # 1. Calculate Threshold
    all_out_degrees = [d for _, d in G.out_degree()]
    threshold = _calculate_dynamic_threshold(
        all_out_degrees, 
        current_rules.fan_out_threshold, 
        current_rules.degree_outlier_sigma
    )

    # 2. Functional Detection
    def analyze_node(node):
        out_edges = list(G.out_edges(node))
        # Flatten timestamps from all out-edges
        all_timestamps = [t for u, v in out_edges for t in _extract_timestamps(G, u, v)]
        count = _count_in_time_window(all_timestamps, current_rules.temporal_window_hours)
        return (node, count, out_edges)

    # Filter candidates exceeding threshold
    candidates = map(analyze_node, G.nodes())
    suspects = {
        node: {
            "fan_out_count": count,
            "threshold_used": float(round(threshold, 2)),
            "targets": [v for _, v in edges]
        }
        for node, count, edges in candidates if count >= threshold
    }
    
    return suspects

def detect_fan_in(G: nx.DiGraph) -> Dict[str, dict]:
    """
    Detects high fan-in (Many -> 1) with TEMPORAL concentration using functional patterns.
    """
    all_in_degrees = [d for _, d in G.in_degree()]
    threshold = _calculate_dynamic_threshold(
        all_in_degrees, 
        current_rules.fan_in_threshold, 
        current_rules.degree_outlier_sigma
    )

    def analyze_node(node):
        in_edges = list(G.in_edges(node))
        all_timestamps = [t for u, v in in_edges for t in _extract_timestamps(G, u, v)]
        count = _count_in_time_window(all_timestamps, current_rules.temporal_window_hours)
        return (node, count, in_edges)

    candidates = map(analyze_node, G.nodes())
    suspects = {
        node: {
            "fan_in_count": count,
            "threshold_used": float(round(threshold, 2)),
            "sources": [u for u, _ in edges]
        }
        for node, count, edges in candidates if count >= threshold
    }
    
    return suspects

def detect_layered_shells(G: nx.DiGraph) -> List[List[str]]:
    """
    Detects chains of 3+ hops where intermediate nodes have low activity.
    Uses functional filtering for candidate selection.
    """
    min_hops = current_rules.shell_min_hops
    max_tx = current_rules.shell_max_intermediate_tx
    
    # 1. Identify "Shell Candidates" via filter
    # Node is candidate if total degree <= max_tx
    shell_candidates = [n for n in G.nodes() if G.degree(n) <= max_tx]
            
    if not shell_candidates:
        return []

    # 2. Build Subgraph & Find Compontents
    H = G.subgraph(shell_candidates)
    
    try:
        # Get weakly connected components
        components = nx.weakly_connected_components(H)
        
        # Helper to extract longest path from component
        def extract_path(comp):
            if len(comp) < (min_hops - 1): return None
            sub = H.subgraph(comp)
            try:
                path = nx.dag_longest_path(sub)
                return path if len(path) >= (min_hops - 1) else None
            except nx.NetworkXUnfeasible:
                return None

        # Map and Filter results
        return [p for p in map(extract_path, components) if p]
        
    except Exception:
        return []
