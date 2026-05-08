@echo off
echo [1/3] Updating data from Excel...
node excel-processor.js

echo [2/3] Syncing to GitHub...
git add .
git commit -m "Update stock data"
git push origin main

echo [3/3] Starting local preview...
npm run dev
pause
