import pandas as pd
from fastapi import HTTPException
from pathlib import Path

REQUIRED_COLUMNS = {"transaction_id", "sender_id", "receiver_id", "amount", "timestamp"}

def validate_csv(file_path: Path) -> pd.DataFrame:
    """
    Validates CSV file structure and content (FR-1 to FR-5).
    """
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

    # FR-2: Check required columns
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

    # FR-3: 10k row limit
    if len(df) > 10000:
        raise HTTPException(status_code=400, detail="File exceeds 10,000 transaction limit")

    # FR-4: Positive amounts
    if (pd.to_numeric(df['amount'], errors='coerce') <= 0).any():
        raise HTTPException(status_code=400, detail="Found non-positive amounts")

    # FR-5: Timestamp parsing & Sorting (FR-6)
    try:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
    except:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    return df
