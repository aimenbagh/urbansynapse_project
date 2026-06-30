@echo off
REM === UrbanSynapse AI - setup backend Windows ===
echo Verification de Python...
python --version

echo Mise a jour de pip...
python -m pip install --upgrade pip

echo Installation des dependances (core, sans geospatial)...
pip install -r requirements-core.txt

if not exist .env copy .env.example .env

echo.
echo === Installation terminee ===
echo Lancer l'API :  python -m uvicorn app.main:app --reload
echo Swagger :       http://localhost:8000/docs
