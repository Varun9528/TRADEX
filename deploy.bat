@echo off
REM ============================================
REM TRADEX AUTOMATED DEPLOYMENT SCRIPT
REM ============================================
REM This script automates the deployment process
REM for TradeX to GitHub, Render, and Vercel.
REM ============================================

echo.
echo ============================================
echo TRADEX DEPLOYMENT SCRIPT
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "backend\server.js" (
    echo ERROR: Please run this script from the tradex root directory
    echo Expected location: C:\xampp\htdocs\tradex
    exit /b 1
)

echo STEP 1: Checking Git Status...
echo -------------------------------------------
git status
echo.

echo STEP 2: Adding All Changes...
echo -------------------------------------------
git add .
echo.

echo STEP 3: Committing Changes...
echo -------------------------------------------
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=chore: Automated deployment update
git commit -m "%commit_message%"
if errorlevel 1 (
    echo No changes to commit or commit failed
    goto PUSH
)
echo.

:PUSH
echo STEP 4: Pushing to GitHub...
echo -------------------------------------------
git push origin master
if errorlevel 1 (
    echo ERROR: Push failed. Check your connection and try again.
    exit /b 1
)
echo.

echo STEP 5: Verifying Backend Health...
echo -------------------------------------------
curl -s https://tradex-384m.onrender.com/api/health
echo.
echo.

echo STEP 6: Building Frontend...
echo -------------------------------------------
cd frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    cd ..
    exit /b 1
)
cd ..
echo.

echo STEP 7: Vercel Deployment Notes...
echo -------------------------------------------
echo IMPORTANT: Make sure to set the following in Vercel Dashboard:
echo - Environment Variable: VITE_API_URL
echo - Value: https://tradex-384m.onrender.com
echo.
echo To deploy to Vercel manually, run:
echo   cd frontend
echo   vercel --prod
echo.

echo ============================================
echo DEPLOYMENT SUMMARY
echo ============================================
echo.
echo GitHub: ✅ PUSHED
echo Backend (Render): 🔄 AUTO-DEPLOYING
echo Frontend (Vercel): ⚠️ MANUAL DEPLOY RECOMMENDED
echo.
echo Latest Commit:
git log -1 --oneline
echo.
echo Backend Status:
curl -s https://tradex-384m.onrender.com/api/health | findstr /i "success"
echo.
echo ============================================
echo DEPLOYMENT COMPLETE!
echo ============================================
echo.
echo NEXT STEPS:
echo 1. Monitor Render deployment: https://dashboard.render.com
echo 2. Deploy to Vercel: cd frontend ^&^& vercel --prod
echo 3. Test the application thoroughly
echo.
echo See DEPLOYMENT_COMPLETE.md for detailed instructions.
echo ============================================
