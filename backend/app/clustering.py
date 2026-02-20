
import pandas as pd

def analyze_clusters(df: pd.DataFrame) -> dict:
    """
    Legacy heuristic-based clustering for Circle Pack Visualization.
    Groups transactions into Mules, Suspected, and Websites.
    """
    # Ensure amount is numeric
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

    # Receiver analysis
    recv_stats = df.groupby("receiver_id").agg(
        txCount=("transaction_id", "count"),
        totalAmount=("amount", "sum"),
        uniqueSenders=("sender_id", "nunique"),
    ).reset_index()

    # Sender analysis
    send_stats = df.groupby("sender_id").agg(
        txCount=("transaction_id", "count"),
        totalAmount=("amount", "sum"),
        uniqueReceivers=("receiver_id", "nunique"),
    ).reset_index()

    # Thresholds (simple heuristic)
    if not recv_stats.empty:
        recv_tx_threshold = max(recv_stats["txCount"].quantile(0.80), 3)
        recv_amount_threshold = recv_stats["totalAmount"].quantile(0.85)
        sender_threshold = max(recv_stats["uniqueSenders"].quantile(0.75), 2)
    else:
         return {"websites": [], "mule_accounts": [], "suspected_distribution": []}

    # Mule accounts: high incoming tx count AND many unique senders
    mule_mask = (
        (recv_stats["txCount"] >= recv_tx_threshold) &
        (recv_stats["uniqueSenders"] >= sender_threshold)
    )
    mule_accounts = (
        recv_stats[mule_mask]
        .rename(columns={"receiver_id": "id"})
        .assign(role="Mule")
        .to_dict("records")
    )

    # Suspected distribution: high amount but not flagged as mule
    suspected_mask = (
        (recv_stats["totalAmount"] >= recv_amount_threshold) &
        ~mule_mask
    )
    suspected_distribution = recv_stats[suspected_mask].rename(columns={"receiver_id": "id"}).to_dict("records")

    # Websites (senders) — top senders by volume
    mule_ids = set(recv_stats[mule_mask]["receiver_id"])
    suspected_ids = set(recv_stats[suspected_mask]["receiver_id"])

    websites = (
        send_stats[~send_stats["sender_id"].isin(mule_ids | suspected_ids)]
        .nlargest(min(20, len(send_stats)), "txCount")
        .rename(columns={"sender_id": "id"})
        .to_dict("records")
    )

    return {
        "websites": websites,
        "mule_accounts": mule_accounts,
        "suspected_distribution": suspected_distribution,
    }
