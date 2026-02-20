from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.validation import validate_csv
from app.graph_builder import build_graph
from app.detection_engine import detect_cycles, detect_fan_out, detect_fan_in, detect_layered_shells, detect_commission
from app.scoring_engine import calculate_node_score, aggregate_rings
from app.schemas import DetectionResult, NodeScore, Ring
from datetime import datetime
import uuid
import shutil
import os
from pathlib import Path
import networkx as nx

app = FastAPI()

# CORS — allow frontend origins (local dev + deployed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000", 
        "https://rift-frontend-production.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow()}

@app.get("/export/json")
def export_json():
    """
    Download the most recent analysis batch as a JSON file, 
    formatted strictly according to the SRS requirements.
    """
    BUCKET_DIR = Path(__file__).parent.parent / "bucket"
    if not BUCKET_DIR.exists():
        raise HTTPException(status_code=404, detail="No data available")
        
    files = sorted(BUCKET_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)
    if not files:
        raise HTTPException(status_code=404, detail="No data available")
        
    latest_file = files[0]
    
    import json
    try:
        with open(latest_file, 'r') as f:
            raw_data = json.load(f)
            
        # Transform to SRS Format
        
        # 0. Build Node -> Ring Mapping
        # Rings are sorted by risk_score DESC, so we take the first (highest risk) assignment
        node_to_ring = {}
        for ring in raw_data.get("rings", []):
            r_id = ring["ring_id"]
            for node_id in ring["nodes"]:
                if node_id not in node_to_ring:
                    node_to_ring[node_id] = r_id

        # 1. Suspicious Accounts
        suspicious_accounts = []
        for node in raw_data.get("suspicious_nodes", []):
            patterns = []
            details = node.get("details", {})
            if details.get("cycles") == 1: patterns.append("cycle_involved")
            if details.get("smurfing") == 1: patterns.append("high_velocity_smurfing")
            if details.get("shells") == 1: patterns.append("layered_shell")
            if details.get("role") == "Mule": patterns.append("mule_account")
            
            # Resolve Ring ID
            # If not in a ring, label as Individual or specific role
            assigned_ring = node_to_ring.get(node["id"], "INDIVIDUAL_SUSPECT")
            
            suspicious_accounts.append({
                "account_id": node["id"],
                "suspicion_score": node["risk_score"],
                "detected_patterns": patterns,
                "ring_id": assigned_ring
            })

        # 2. Fraud Rings
        fraud_rings = []
        for ring in raw_data.get("rings", []):
            fraud_rings.append({
                "ring_id": ring["ring_id"],
                "member_accounts": ring["nodes"],
                "pattern_type": ring["pattern_type"],
                "risk_score": ring["risk_score"]
            })
            
        # 3. Summary
        raw_summary = raw_data.get("summary", {})
        summary = {
            "total_accounts_analyzed": raw_summary.get("total_transactions", 0) * 2, # Approx unique accounts? Or just pass txs
            "suspicious_accounts_flagged": len(suspicious_accounts),
            "fraud_rings_detected": len(fraud_rings),
            "processing_time_seconds": 2.3 # Placeholder, requires instrumentation in analyze
        }

        export_data = {
            "suspicious_accounts": suspicious_accounts,
            "fraud_rings": fraud_rings,
            "summary": summary
        }
        
        # Save temp export file
        export_file = BUCKET_DIR / f"export_{latest_file.name}"
        with open(export_file, 'w') as f:
            json.dump(export_data, f, indent=2)
            
        return FileResponse(
            path=export_file, 
            filename="forensic_analysis_export.json",
            media_type='application/json'
        )
    except Exception as e:
        print(f"Export transformation failed: {e}")
        raise HTTPException(status_code=500, detail="Export failed")


@app.post("/analyze", response_model=DetectionResult)
async def analyze_transaction_data(file: UploadFile = File(...)):
    print(f"Received upload request: {file.filename}")
    # 1. Save temp file
    temp_filename = f"temp_{uuid.uuid4()}.csv"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    print(f"Saved temp file: {temp_filename}")

    try:
        # 2. Validate
        df = validate_csv(temp_filename)
        
        # 3. Build Graph
        G = build_graph(df)
        
        # 4. Detect Patterns
        cycles = detect_cycles(G)
        fan_out = detect_fan_out(G)
        fan_in = detect_fan_in(G)
        shells = detect_layered_shells(G)
        commissions = detect_commission(G, cycles)
        
        # 4a. Legacy Clustering (Run early to inform scoring)
        from app.clustering import analyze_clusters
        clusters = analyze_clusters(df)
        cluster_mule_ids = {m["id"] for m in clusters["mule_accounts"]}

        # 4b. Enrich Clusters with Detection Flags & Graph Metrics
        commission_set = set(commissions)
        for category in ["mule_accounts", "suspected_distribution", "websites"]:
            for node_obj in clusters.get(category, []):
                nid = node_obj["id"]
                node_obj["is_commission"] = nid in commission_set
                
                # Calculate Fan-in/Fan-out Ratio
                if G.has_node(nid):
                    in_deg = G.in_degree(nid)
                    out_deg = G.out_degree(nid)
                    # Ratio: High In / Low Out = High Ratio (Mule-like)
                    # Avoid division by zero
                    node_obj["fan_in_out_ratio"] = in_deg / (out_deg if out_deg > 0 else 0.1)
                else:
                    node_obj["fan_in_out_ratio"] = 0


        # 5. Score Nodes
        # Pre-calculate Cluster Sizes (Weakly Connected Components)
        undirected_G = G.to_undirected()
        node_to_cluster_size = {}
        for component in nx.connected_components(undirected_G):
            size = len(component)
            for n in component:
                node_to_cluster_size[n] = size

        node_scores = []
        for node in G.nodes():
            score = calculate_node_score(node, cycles, fan_out, fan_in, shells, commissions)
            
            # Force inclusion if flagged by clustering (Mule)
            is_cluster_mule = node in cluster_mule_ids
            if is_cluster_mule and score == 0:
                score = 50.0 # Assign a base risk score for heuristic mules
            
            if score > 0:
                is_mule = (node in fan_in) or is_cluster_mule
                is_originator = node in fan_out
                
                details = {
                    "cycles": 1 if any(node in c for c in cycles) else 0,
                    "smurfing": 1 if (is_originator or is_mule) else 0,
                    "shells": 1 if any(node in s for s in shells) else 0,
                    "role": "Mule" if is_mule else ("Originator" if is_originator else "Participant"),
                    "degree": int(G.degree(node)),
                    "cluster_size": node_to_cluster_size.get(node, 0)
                }
                # print(f"DEBUG NODE {node}: Score={score}, IsMule={is_mule}, IsOrig={is_originator}, FanInCount={len(fan_in)}")
                node_scores.append(NodeScore(
                    id=str(node), 
                    risk_score=score, 
                    details=details
                ))
        
        node_scores.sort(key=lambda x: x.risk_score, reverse=True)

        # 6. Aggregate Rings
        rings = aggregate_rings(cycles, G)
        
        summary = {
            "total_transactions": len(df),
            "mule_count": len(clusters["mule_accounts"]),
            "suspected_count": len(clusters["suspected_distribution"]),
            "flagged_amount": sum(m.get("totalAmount", 0) for m in clusters["mule_accounts"]),
        }

        
        # 8. Persist Result
        result = DetectionResult(
            batch_id=str(uuid.uuid4()),
            processed_at=datetime.utcnow(),
            total_transactions=len(df),
            suspicious_nodes=node_scores[:50], # Top 50
            rings=rings,
            clusters=clusters,
            summary=summary
        )
        
        # Save to bucket
        BUCKET_DIR = Path(__file__).parent.parent / "bucket"
        BUCKET_DIR.mkdir(exist_ok=True)
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        bucket_file = BUCKET_DIR / f"batch_{timestamp_str}_{result.batch_id}.json"
        
        with open(bucket_file, "w") as f:
            f.write(result.json())

        # Also save CSV for graph reconstruction
        csv_file = BUCKET_DIR / f"batch_{timestamp_str}_{result.batch_id}.csv"
        shutil.copy(temp_filename, csv_file)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.get("/data")
def get_latest_data():
    """Return the most recent stored batch."""
    BUCKET_DIR = Path(__file__).parent.parent / "bucket"
    if not BUCKET_DIR.exists():
        return {"clusters": {}}
        
    files = sorted(BUCKET_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)
    if not files:
        return {"clusters": {}}

    with open(files[0]) as f:
        import json
        return json.load(f)

@app.get("/investigation/network/{node_id}")
def get_network_graph(node_id: str):
    BUCKET_DIR = Path(__file__).parent.parent / "bucket"
    if not BUCKET_DIR.exists():
        return {"nodes": [], "links": []}
    
    # Find latest CSV
    files = sorted(BUCKET_DIR.glob("*.csv"), key=os.path.getmtime, reverse=True)
    if not files:
        return {"nodes": [], "links": []}
        
    # Rebuild Graph
    try:
        df = validate_csv(files[0])
        G = build_graph(df)
        
        from app.graph_builder import get_component_graph
        # Use component graph (Cluster) instead of Ego graph
        graph_data = get_component_graph(G, node_id, max_nodes=100)
        
        # Enrich nodes with basic metadata (placeholder for now)
        for node in graph_data["nodes"]:
            node["group"] = "suspected" if node["id"] == node_id else "related"
            node["r"] = 30 if node["id"] == node_id else 15
            
        return graph_data
    except Exception as e:
        print(f"Error building graph: {e}")
        return {"nodes": [], "links": []}

# Investigation Endpoints
@app.get("/investigation/suspects")
def get_suspects():
    """
    Returns the top suspicious nodes from the latest analysis batch.
    """
    BUCKET_DIR = Path(__file__).parent.parent / "bucket"
    if not BUCKET_DIR.exists():
        return []
    
    files = sorted(BUCKET_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)
    if not files:
        return []

    try:
        with open(files[0]) as f:
            import json
            data = json.load(f)
            
            # Map the stored suspicious_nodes to the frontend format if needed
            # Frontend expects: { id, score, ... }
            # Backend stores: { id, risk_score, details }
            suspects = []
            for node in data.get("suspicious_nodes", [])[:10]: # Top 10
                # Extract patterns
                patterns = []
                details = node.get("details", {})
                if details.get("cycles") == 1:
                    patterns.append("Circular")
                if details.get("smurfing") == 1:
                    patterns.append("Smurfing")

                suspects.append({
                    "id": node["id"],
                    "score": node["risk_score"],
                    "cluster": "High Risk", # Placeholder or derive from details
                    "nodes": node["details"].get("cluster_size", node["details"].get("degree", 0)), 
                    "status": "Active",
                    "patterns": patterns
                })
            return suspects
    except Exception as e:
        print(f"Error fetching suspects: {e}")
        return []
