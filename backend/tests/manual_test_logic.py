
import sys
import os
import pandas as pd
import networkx as nx
from datetime import datetime, timedelta
import numpy as np

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.graph_builder import build_graph
from app.detection_engine import detect_cycles, detect_commission, detect_fan_out, detect_fan_in, detect_layered_shells
from app.scoring_engine import calculate_node_score
from app.rules import current_rules

def log(msg):
    with open("tests/test_results.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

def test_chronological_cycle():
    log("\n--- TEST 1: Chronological Cycle with Commission ---")
    base_time = datetime.now()
    data = [
        {"sender_id": "A", "receiver_id": "B", "amount": 1000, "timestamp": base_time, "transaction_id": "tx1"},
        {"sender_id": "B", "receiver_id": "C", "amount": 980, "timestamp": base_time + timedelta(hours=1), "transaction_id": "tx2"},
        {"sender_id": "C", "receiver_id": "A", "amount": 960.4, "timestamp": base_time + timedelta(hours=2), "transaction_id": "tx3"},
    ]
    df = pd.DataFrame(data)
    G = build_graph(df)
    
    cycles = detect_cycles(G)
    log(f"Cycles Detected: {cycles}")
    
    commissions = detect_commission(G, cycles)
    log(f"Commission Nodes: {commissions}")
    
    if cycles and set(commissions) == {'A', 'B', 'C'}:
        log("✅ TEST 1 PASSED")
    else:
        log("❌ TEST 1 FAILED")

def test_temporal_smurfing():
    log("\n--- TEST 2: Temporal Smurfing (Fan-In) ---")
    base_time = datetime.now()
    data = []
    receiver = "Mule1"
    for i in range(12):
        sender = f"Smurf_{i}"
        data.append({
            "sender_id": sender, 
            "receiver_id": receiver, 
            "amount": 100, 
            "timestamp": base_time + timedelta(minutes=i*5), 
            "transaction_id": f"s_tx_{i}"
        })
        
    df = pd.DataFrame(data)
    G = build_graph(df)
    
    fan_in = detect_fan_in(G)
    log(f"Fan-In Detected: {list(fan_in.keys())}")
    
    if "Mule1" in fan_in:
        log("✅ TEST 2 PASSED")
    else:
        log("❌ TEST 2 FAILED")

def test_layered_shells():
    log("\n--- TEST 3: Layered Shell Networks ---")
    base_time = datetime.now()
    data = [
        {"sender_id": "Origin", "receiver_id": "S1", "amount": 5000, "timestamp": base_time, "transaction_id": "sh1"},
        {"sender_id": "S1", "receiver_id": "S2", "amount": 5000, "timestamp": base_time + timedelta(minutes=10), "transaction_id": "sh2"},
        {"sender_id": "S2", "receiver_id": "S3", "amount": 5000, "timestamp": base_time + timedelta(minutes=20), "transaction_id": "sh3"},
        {"sender_id": "S3", "receiver_id": "Dest", "amount": 5000, "timestamp": base_time + timedelta(minutes=30), "transaction_id": "sh4"},
    ]
    df = pd.DataFrame(data)
    G = build_graph(df)
    
    shells = detect_layered_shells(G)
    log(f"Shell Chains Detected: {shells}")
    
    detected_nodes = [n for path in shells for n in path]
    # Check if S1, S2 are in the detected shell chains
    if any("S1" in path for path in shells) and any("S2" in path for path in shells):
        log("✅ TEST 3 PASSED")
    else:
        log("❌ TEST 3 FAILED")

if __name__ == "__main__":
    # Clear prev results
    with open("tests/test_results.txt", "w", encoding="utf-8") as f:
        f.write("Starting Tests...\n")
    test_chronological_cycle()
    test_temporal_smurfing()
    test_layered_shells()
