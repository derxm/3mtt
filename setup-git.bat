@echo off
echo Initialising git repository...
git init
git add .
git commit -m "feat: initial commit — savings tracker full-stack app"
echo.
echo Done! Repo is ready to push.
echo.
echo Next steps:
echo   1. Create a new repo on GitHub (do NOT initialise with README)
echo   2. Run:  git remote add origin https://github.com/YOUR_USERNAME/savings-tracker.git
echo   3. Run:  git branch -M main
echo   4. Run:  git push -u origin main
pause
