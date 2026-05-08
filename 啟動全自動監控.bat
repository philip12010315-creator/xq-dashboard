@echo off
title XQ Dashboard 自動監控中
echo ==========================================
echo    XQ 智慧監控 - 全自動背景同步工具
echo ==========================================
echo.
echo 只要這視窗開著，您在 XQ 匯出資料後，
echo 程式就會自動更新網頁並上傳雲端。
echo.
echo 正在啟動監控...
node watcher.js
pause
