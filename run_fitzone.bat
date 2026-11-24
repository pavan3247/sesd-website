@echo off
title FITZONE Gym Management System Server
cd /d "%~dp0"
echo =======================================================
echo   Starting FITZONE Gym Management System...
echo =======================================================
echo.
echo Installing dependencies if needed...
call npm install
echo.
echo Launching Server...
start http://localhost:5000/login.html
node backend/server.js
pause
