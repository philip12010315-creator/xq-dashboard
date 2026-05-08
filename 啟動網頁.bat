@echo off
setlocal

echo [1/3] Environment Check...

:: Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is NOT installed!
    echo Please download: https://nodejs.org/
    pause
    exit /b
)

:: Check Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is NOT installed!
    echo Please download: https://git-scm.com/
    pause
    exit /b
)

echo [OK] Running data processor...
node excel-processor.js

echo [2/3] Syncing with GitHub...
git add .
git commit -m "Update dashboard data"
git push origin main

echo [3/3] Starting local server...
npm run dev

pause
