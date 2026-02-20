
import networkx as nx
import pandas as pd

def build_graph(df: pd.DataFrame) -> nx.DiGraph:
    G = nx.DiGraph()

    for _, row in df.iterrows():
        src, dst = row['sender_id'], row['receiver_id']
        amount = float(row['amount'])
        timestamp = pd.to_datetime(row['timestamp'])
        tx_id = str(row['transaction_id'])
        
        # FR-11: Ignore self-loops
        if src == dst:
            continue

        # Add or Update Edge
        if G.has_edge(src, dst):
            # Append to existing data
            G[src][dst]['amounts'].append(amount)
            G[src][dst]['timestamps'].append(timestamp)
            G[src][dst]['tx_ids'].append(tx_id)
            G[src][dst]['total_amount'] += amount
            G[src][dst]['count'] += 1
        else:
            # Create new edge
            G.add_edge(src, dst, 
                       amounts=[amount], 
                       timestamps=[timestamp],
                       tx_ids=[tx_id],
                       total_amount=amount,
                       count=1)
    return G


def get_component_graph(G: nx.DiGraph, node_id: str, max_nodes: int = 50) -> dict:
    """
    Returns the Weakly Connected Component (cluster) containing the node.
    Limits to max_nodes using BFS if the component is too large.
    """
    if node_id not in G:
        return {"nodes": [], "links": []}
        
    # 1. Get Weakly Connected Component
    # This includes all nodes reachable from node_id or that can reach node_id in undirected sense
    undirected_G = G.to_undirected()
    if node_id not in undirected_G:
         return {"nodes": [], "links": []}

    component_nodes = set(nx.node_connected_component(undirected_G, node_id))
    
    # 2. Prune if too large (Prioritize closer nodes via BFS)
    if len(component_nodes) > max_nodes:
        # Perform BFS from node_id to keep the 'closest' max_nodes
        bfs_tree = nx.bfs_tree(undirected_G, source=node_id, depth_limit=None)
        # Take first max_nodes from BFS
        truncated_nodes = list(bfs_tree.nodes())[:max_nodes]
        component_nodes = set(truncated_nodes)
        
    # 3. Extract Subgraph
    subgraph = G.subgraph(component_nodes)
    
    # 4. Format for D3
    # Calculate degree for sizing
    degrees = dict(subgraph.degree())
    
    nodes = []
    for n in subgraph.nodes():
        # Determine group/style
        # Ideally we'd pass in the 'suspects' list to color them, 
        # but for now we default to 'related' and let frontend handle specific ID highlighting
        nodes.append({
            "id": n, 
            "r": 5 + (degrees.get(n, 0) * 0.5), # Dynamic size based on local degree
            "group": "related" 
        })
        
    links = [{"source": u, "target": v} for u, v in subgraph.edges()]
    
    return {"nodes": nodes, "links": links}
