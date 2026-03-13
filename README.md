# SentinelBank
Real-time bank fraud detection demo system.

## Structure
monorepo: frontend/ + backend/

## Run Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

## Run Tests
cd backend
pytest tests/ -v

## Fraud Scenarios
1. HIGH_VALUE_TRANSFER  — A→B 95000
2. SMURFING             — C→D/E/F/G/H/I/J small amounts
3. LAYERING             — K→L→M→N→O chain
4. CIRCULAR             — A→B→C→A
5. RAPID_BURST          — D→10 accounts rapid fire
