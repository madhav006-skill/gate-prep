@echo off
:: GATE Prep Platform - Auto Start Script
:: Double click karo ya Windows startup me daalo
echo Starting GATE Prep Platform...

:: Start Backend + OCR via PM2
pm2 start F:\gate-prep\ecosystem.config.js

:: Start Frontend
start "GATE Frontend" /D "F:\gate-prep\frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo  GATE Platform Started Successfully!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:5000
echo  OCR API:  http://localhost:8000
echo ============================================
timeout /t 3
