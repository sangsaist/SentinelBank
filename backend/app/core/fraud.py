from datetime import datetime, timedelta, timezone
import networkx as nx
from sqlalchemy.orm import Session
from app.db.models import Transaction

def detect_fraud(sender_id: str, receiver_id: str, amount: float, db: Session) -> dict:
    """
    Scans recent transaction history for high-value transfers, circular loops, and chain layering.
    Returns risk score, color coding, and fraud status.
    """
    scores = []
    reasons = []

    # cutoff window for pattern matching
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=120)
    
    # Pre-fetch recent transactions for graph construction (Rules 2 & 3)
    recent = db.query(Transaction).filter(
        Transaction.timestamp >= cutoff
    ).all()
    
    # Build the recent transaction graph
    G = nx.DiGraph()
    for t in recent:
        G.add_edge(t.sender_id, t.receiver_id)
    
    # Add the current pending transaction edge to the graph
    G.add_edge(sender_id, receiver_id)

    # ════════════════════════════════════════
    # RULE 1 — HIGH VALUE TRANSFER
    # ════════════════════════════════════════
    if amount > 50000:
        scores.append(0.80)
        reasons.append("HIGH_VALUE_TRANSFER")

    # ════════════════════════════════════════
    # RULE 2 — CIRCULAR TRANSACTION
    # ════════════════════════════════════════
    try:
        # If receiver can reach sender, a cycle is completed
        if G.has_node(receiver_id) and G.has_node(sender_id):
            if nx.has_path(G, receiver_id, sender_id):
                path_len = nx.shortest_path_length(G, receiver_id, sender_id)
                # path_len corresponds to number of edges. 
                # e.g. path receiver->node1->sender is length 2, 
                # plus current sender->receiver edge = 3 nodes in cycle.
                if path_len <= 4:
                    scores.append(0.90)
                    reasons.append("CIRCULAR_TRANSACTION")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        pass

    # ════════════════════════════════════════
    # RULE 3 — CHAIN LAYERING
    # ════════════════════════════════════════
    detected_layering = False
    for node in list(G.nodes()):
        if node == receiver_id:
            continue
        try:
            if nx.has_path(G, node, receiver_id):
                path = nx.shortest_path(G, node, receiver_id)
                # len(path) is number of nodes. 
                # len == 4 means A->B->C->D (4 hops)
                # len == 5 means A->B->C->D->E (5 hops)
                if len(path) == 4 or len(path) == 5:
                    detected_layering = True
                    break
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            continue
            
    if detected_layering:
        scores.append(0.85)
        reasons.append("CHAIN_LAYERING")

    # ════════════════════════════════════════
    # SCORE HARMONIZATION
    # ════════════════════════════════════════
    if not scores:
        return {
            "risk_score": 0.0,
            "color": "green",
            "is_fraud": 0,
            "reason": None
        }

    # Find highest score and its corresponding reason
    final_score = max(scores)
    max_idx = scores.index(final_score)
    final_reason = reasons[max_idx]

    # Color logic
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
        "reason": final_reason
    }
