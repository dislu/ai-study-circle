@echo off
echo ====================================
echo   Starting AI Study Circle Development
echo ====================================
echo.

echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB is not running. Attempting to start...
    echo Starting MongoDB in background...
    start /B mongod --dbpath "C:\data\db" 2>nul
    timeout /t 3 >nul
    echo If MongoDB fails to start, please:
    echo 1. Install MongoDB Community Edition
    echo 2. Create directory C:\data\db
    echo 3. Or use MongoDB Atlas cloud database
    echo.
) else (
    echo ✅ MongoDB is running
)

echo Starting backend server...
cd backend
start "AI Study Circle - Backend" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 >nul

echo Starting frontend...
cd ..\frontend  
start "AI Study Circle - Frontend" cmd /k "npm start"

echo.
echo ====================================
echo   Development servers are starting...
echo ====================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo 📖 OAuth Setup Guide: SOCIAL_AUTH_SETUP.md
echo 🔧 Test OAuth endpoints: node backend/test-oauth.js
echo.
echo Press any key to open the application in browser...
pause >nul

timeout /t 3 >nul
start http://localhost:3000

echo.
echo Development environment is ready!
echo.
echo To stop servers:
echo - Close the terminal windows that opened
echo - Or press Ctrl+C in each terminal
echo.
pause