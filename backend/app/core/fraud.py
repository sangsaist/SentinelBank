from sqlalchemy.orm import Session
from app.db.models import Transaction
import networkx as nx
from datetime import datetime, timedelta, timezone

def detect_fraud(sender_id: str, receiver_id: str, amount: float, db: Session) -> dict:
    scores = []
    reasons = []

    # RULE 1 — HIGH_VALUE
    if amount > 80000:
        scores.append(0.75)
        reasons.append("HIGH_VALUE_TRANSFER")

    # RULE 2 — HIGH_FREQUENCY
    thirty_seconds_ago = datetime.now(timezone.utc) - timedelta(seconds=30)
    burst_count = db.query(Transaction).filter(
        Transaction.sender_id == sender_id,
        Transaction.timestamp >= thirty_seconds_ago
    ).count()
    if burst_count > 4:
        scores.append(0.80)
        reasons.append("HIGH_FREQUENCY_BURST")

    # RULE 3 — ROUND_AMOUNT
    if amount >= 10000 and amount % 10000 == 0:
        scores.append(0.35)
        reasons.append("ROUND_AMOUNT")

    # RULE 4 — CIRCULAR_TRANSACTION
    try:
        last_txns = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(50).all()
        G = nx.DiGraph()
        for t in last_txns:
            G.add_edge(t.sender_id, t.receiver_id)
        G.add_edge(sender_id, receiver_id)
        
        cycles = list(nx.simple_cycles(G))
        involved_in_cycle = False
        for cycle in cycles:
            if sender_id in cycle:
                involved_in_cycle = True
                break
        
        if involved_in_cycle:
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
