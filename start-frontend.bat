@echo off
echo ========================================
echo   Iniciando Frontend (Puerto 8080)
echo ========================================
cd /d C:\java\multiservicios\frontend
echo.
echo Frontend disponible en: http://localhost:8082
echo.
python -m http.server 8082
