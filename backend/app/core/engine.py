import time
import random
import threading
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Account, Transaction, FraudAlert
from app.core.fraud import detect_fraud
from datetime import datetime, timezone
import uuid
from collections import deque

engine_state = {"status": "stopped", "rate": 60, "count": 0, "target": None}
_engine_thread = None

# History to prevent engine-driven false positives
engine_edge_history = deque(maxlen=20)
last_five_senders = deque(maxlen=5)

def run_engine(broadcast_fn):
    db: Session = SessionLocal()
    try:
        accounts_objs = db.query(Account).all()
        account_ids = [a.account_id for a in accounts_objs]
        
        while engine_state["status"] != "stopped":
            if engine_state["status"] == "paused":
                time.sleep(0.5)
                continue
            
            # Constraint Logic: Sync with Fraud Detector window (120s)
            import networkx as nx
            from datetime import timedelta
            
            # Build the current "reality" graph from the DB (same as fraud.py)
            graph_cutoff = datetime.now(timezone.utc) - timedelta(seconds=120)
            recent_txns = db.query(Transaction).filter(Transaction.timestamp >= graph_cutoff).all()
            
            temp_G = nx.DiGraph()
            for t in recent_txns:
                temp_G.add_edge(t.sender_id, t.receiver_id)

            max_attempts = 15
            found_safe_pair = False
            sender_id = None
            receiver_id = None
            
            for _ in range(max_attempts):
                eligible_senders = [aid for aid in account_ids if aid not in last_five_senders]
                if not eligible_senders: eligible_senders = account_ids
                
                s = random.choice(eligible_senders)
                r = random.choice([aid for aid in account_ids if aid != s])
                
                # 1. ANTI-CIRCULAR: Blocks r -> s loop paths
                if temp_G.has_node(r) and temp_G.has_node(s):
                    if nx.has_path(temp_G, r, s):
                        continue
                
                # 2. ANTI-LAYERING: Don't pick s if A->B->S already exists (adding S->R would be 4th node)
                if temp_G.has_node(s):
                    is_layering = False
                    for node in temp_G.nodes():
                        try:
                            if nx.has_path(temp_G, node, s):
                                path = nx.shortest_path(temp_G, node, s)
                                if len(path) >= 3: # Path is path A->B->S (3 nodes)
                                    is_layering = True
                                    break
                        except: continue
                    if is_layering: continue

                sender_id, receiver_id = s, r
                found_safe_pair = True
                break
            
            if not found_safe_pair:
                # Absolute fallback if no safe pair found (rare)
                sender_id, receiver_id = random.sample(account_ids, 2)

            # Constraint 1: Safe amount (500-7999, never >= 10k)
            amount = round(random.uniform(1000, 7999), 2)
            
            # Update histories
            engine_edge_history.append((sender_id, receiver_id))
            last_five_senders.append(sender_id)
            
            fraud_result = detect_fraud(sender_id, receiver_id, amount, db)
            
            txn_id = str(uuid.uuid4())[:8]
            txn = Transaction(
                transaction_id=txn_id,
                sender_id=sender_id,
                receiver_id=receiver_id,
                amount=amount,
                timestamp=datetime.now(timezone.utc),
                is_fraud=fraud_result["is_fraud"],
                risk_score=fraud_result["risk_score"],
                color=fraud_result["color"],
                fraud_reason=fraud_result["reason"]
            )
            db.add(txn)
            db.commit()
            db.refresh(txn)

            alert_id = None
            if txn.is_fraud == 1:
                alert_id = str(uuid.uuid4())[:8]
                alert = FraudAlert(
                    alert_id=alert_id,
                    transaction_id=txn.transaction_id,
                    reason=txn.fraud_reason,
                    risk_score=txn.risk_score,
                    pattern_type=txn.fraud_reason,
                    timestamp=txn.timestamp
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)

            engine_state["count"] += 1
            
            broadcast_fn({
                "type": "transaction",
                "data": {
                    "transaction_id": txn.transaction_id,
                    "sender_id": txn.sender_id,
                    "receiver_id": txn.receiver_id,
                    "amount": txn.amount,
                    "timestamp": txn.timestamp.isoformat(),
                    "is_fraud": txn.is_fraud,
                    "risk_score": txn.risk_score,
                    "color": txn.color,
                    "fraud_reason": txn.fraud_reason
                }
            })

            if txn.is_fraud == 1:
                broadcast_fn({
                    "type": "fraud_alert",
                    "data": {
                        "alert_id": alert_id,
                        "transaction_id": txn.transaction_id,
                        "reason": txn.fraud_reason,
                        "risk_score": txn.risk_score,
                        "pattern_type": txn.fraud_reason,
                        "timestamp": txn.timestamp.isoformat()
                    }
                })

            broadcast_fn({
                "type": "engine_status",
                "data": {
                    "status": engine_state["status"],
                    "rate": engine_state["rate"],
                    "count": engine_state["count"]
                }
            })

            if engine_state["target"] is not None and engine_state["count"] >= engine_state["target"]:
                engine_state["status"] = "stopped"
                break
                
            # Constraint 4: Always at least 1s between txns
            sleep_time = max(1.0, 60.0 / engine_state["rate"])
            time.sleep(sleep_time)
            
    finally:
        db.close()

def start_engine(broadcast_fn):
    global _engine_thread
    if _engine_thread is None or not _engine_thread.is_alive():
        engine_state["status"] = "running"
        _engine_thread = threading.Thread(target=run_engine, args=(broadcast_fn,), daemon=True)
        _engine_thread.start()

def stop_engine():
    engine_state["status"] = "stopped"

def pause_engine():
    engine_state["status"] = "paused"

def resume_engine(broadcast_fn):
    engine_state["status"] = "running"
    global _engine_thread
    if _engine_thread is None or not _engine_thread.is_alive():
        _engine_thread = threading.Thread(target=run_engine, args=(broadcast_fn,), daemon=True)
        _engine_thread.start()

def reset_everything():
    # 1. Stop engine
    engine_state["status"] = "stopped"
    engine_state["count"] = 0
    engine_state["target"] = None
    
    # 2. Clear in-memory history
    engine_edge_history.clear()
    last_five_senders.clear()
    
    # 3. Clear database tables
    from app.db.database import SessionLocal
    from app.db.models import Transaction, FraudAlert, Account
    from app.db.seed import seed_accounts
    
    db = SessionLocal()
    try:
        db.query(FraudAlert).delete()
        db.query(Transaction).delete()
        db.query(Account).delete()
        db.commit()
        
        # 4. Re-seed accounts
        seed_accounts(db)
        db.commit()
    finally:
        db.close()
    
    return engine_state
