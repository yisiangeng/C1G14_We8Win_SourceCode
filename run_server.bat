@echo off
echo Starting FastAPI Server...
cd ML
python -m uvicorn app:app --reload --port 8000
pause
