from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Input Schema
class Transaction(BaseModel):
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float = Field(gt=0, description="Amount must be positive")
    timestamp: datetime

    class Config:
        frozen = True

# Output Schemas
class NodeScore(BaseModel):
    id: str
    risk_score: float = Field(ge=0, le=100)
    details: dict

class Ring(BaseModel):
    ring_id: str
    nodes: List[str]
    risk_score: float
    pattern_type: str
    total_volume: Optional[float] = 0.0

class DetectionResult(BaseModel):
    batch_id: str
    processed_at: datetime
    total_transactions: int
    suspicious_nodes: List[NodeScore]
    rings: List[Ring]
    # Legacy fields for frontend
    clusters: dict
    summary: dict
