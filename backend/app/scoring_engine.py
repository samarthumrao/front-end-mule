from typing import List, Dict
from app.rules import current_rules

def calculate_node_score(node_id: str, cycles: List[List[str]], fan_out: Dict, fan_in: Dict, shells: List[List[str]], commission_nodes: List[str]) -> float:
    """
    Computes 0-100 suspicion score based on weighted rules using arithmetic logic.
    """
    # Boolean logic masks (convert to 1.0 or 0.0)
    in_cycle = float(any(node_id in cycle for cycle in cycles))
    in_commission = float(node_id in commission_nodes)
    is_smurfing = float((node_id in fan_out) or (node_id in fan_in))
    in_shell = float(any(node_id in shell for shell in shells))

    # Merchant Heuristic: High Fan-In + Zero Fan-Out + No Cycle = Likely Merchant
    # Logic: is_merchant = (fan_in > 0) * (fan_out == 0) * (not in_cycle)
    has_fan_in = float(node_id in fan_in)
    has_fan_out = float(node_id in fan_out)
    is_merchant = has_fan_in * (1.0 - has_fan_out) * (1.0 - in_cycle)

    # Weighted Sum Calculation
    raw_score = (
        (in_cycle * current_rules.score_cycle_detected * current_rules.weight_cycle) +
        (in_commission * current_rules.score_commission_retention * current_rules.weight_commission) +
        (is_smurfing * current_rules.score_smurf_detected * current_rules.weight_smurfing) +
        (in_shell * current_rules.score_shell_detected * current_rules.weight_shell)
    )

    # Apply Deductions
    final_score = raw_score - (is_merchant * current_rules.merchant_deduction)
    
    # Clamp result [0, 100]
    return max(0.0, min(100.0, final_score))

def aggregate_rings(cycles: List[List[str]], G) -> List[Dict]:
    """
    Aggregates detected cycles into "Rings" with a composite risk score (FR-28).
    Calculates total volume flowing through the ring.
    """
    rings = []
    import datetime
    current_year = datetime.datetime.now().year
    
    for idx, cycle in enumerate(cycles):
        ring_score = 0
        # Simple scoring: Base 50 + 10 per node
        risk_score = min(100, 50 + (len(cycle) * 10))
        
        # Calculate Volume
        total_volume = 0
        # Sum weights of edges IN the cycle
        # A cycle A->B->C->A implies edges (A,B), (B,C), (C,A)
        for i in range(len(cycle)):
            u = cycle[i]
            v = cycle[(i + 1) % len(cycle)]
            if G.has_edge(u, v):
                # Edge data might have 'weight' or 'amount'. 
                # Our build_graph uses weight=amount
                edge_data = G.get_edge_data(u, v)
                total_volume += edge_data.get('total_amount', 0)

        rings.append({
            "ring_id": f"R-{current_year}-{100+idx}",
            "nodes": cycle,
            "risk_score": risk_score,
            "pattern_type": "Circular" if len(cycle) < 5 else "Chain",
            "total_volume": total_volume
        })
    
    return sorted(rings, key=lambda x: x['risk_score'], reverse=True)
