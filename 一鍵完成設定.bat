@echo off
echo [1/4] Initializing local Git...
git init

echo [1.5/4] Configuring identity...
git config user.email "philip@example.com"
git config user.name "philip"

echo [2/4] Adding files and committing...
git add .
git commit -m "initial dashboard setup"

echo [3/4] Linking to your GitHub: philip12010315-creator
git branch -M main
git remote add origin https://github.com/philip12010315-creator/xq-dashboard.git 2>nul

echo [4/4] Pushing to GitHub (A login window may appear)...
git push -u origin main --force

echo.
echo All set! Please check your GitHub Repository.
pause
