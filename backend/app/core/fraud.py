from sqlalchemy.orm import Session
from app.db.models import Transaction
import networkx as nx
from datetime import datetime, timedelta, timezone

def detect_fraud(sender_id: str, receiver_id: str, amount: float, db: Session) -> dict:
    scores = []
    reasons = []

    # RULE 1 — HIGH_VALUE (> 80,000)
    if amount > 80000:
        scores.append(0.75)
        reasons.append("HIGH_VALUE_TRANSFER")

    # RULE 2 — HIGH_FREQUENCY (> 4 txns in 15 seconds AND amount > 1000)
    fifteen_seconds_ago = datetime.now(timezone.utc) - timedelta(seconds=15)
    burst_count = db.query(Transaction).filter(
        Transaction.sender_id == sender_id,
        Transaction.timestamp >= fifteen_seconds_ago,
        Transaction.amount > 1000
    ).count()
    if burst_count > 4:
        scores.append(0.80)
        reasons.append("HIGH_FREQUENCY_BURST")

    # RULE 3 — ROUND_AMOUNT (Multiples of 10,000)
    if amount >= 10000 and amount % 10000 == 0:
        scores.append(0.35)
        reasons.append("ROUND_AMOUNT")

    # RULE 4 — CIRCULAR_TRANSACTION (Loop in last 60 seconds, length <= 3)
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
        recent_txns = db.query(Transaction).filter(
            Transaction.timestamp >= cutoff
        ).all()
        
        if len(recent_txns) >= 2:
            G = nx.DiGraph()
            for t in recent_txns:
                G.add_edge(t.sender_id, t.receiver_id)
            
            # Logic: If we add sender_id -> receiver_id, 
            # does it complete a path back to sender_id?
            # i.e. Is sender_id reachable from receiver_id?
            if G.has_node(receiver_id) and G.has_node(sender_id):
                if nx.has_path(G, receiver_id, sender_id):
                    path_length = nx.shortest_path_length(G, receiver_id, sender_id)
                    if path_length <= 3:
                        scores.append(0.90)
                        reasons.append("CIRCULAR_TRANSACTION")
    except Exception:
        pass

    if not scores:
        return {
            "risk_score": 0.0,
            "color": "green",
            "is_fraud": 0,
            "reason": None
        }

    final_score = max(scores)
    max_index = scores.index(final_score)
    reason = reasons[max_index]

    if final_score < 0.4:
        color = "green"
    elif final_score < 0.7:
        color = "orange"
    else:
        color = "red"

    return {
        "risk_score": final_score,
        "color": color,
        "is_fraud": 1 if color == "red" else 0,
        "reason": reason
    }
