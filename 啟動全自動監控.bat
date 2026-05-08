@echo off
title XQ Dashboard Auto Monitor
cls
echo ==========================================
echo    XQ Dashboard - Auto Sync Tool
echo ==========================================
echo.
echo Monitoring changes in Excel/CSV files...
echo.
node watcher.cjs
pause
