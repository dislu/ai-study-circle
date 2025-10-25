@echo off
echo ====================================
echo   AI Study Circle - Development Setup
echo ====================================
echo.

echo Checking Node.js installation...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo Checking MongoDB...
mongod --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB not found. Please install MongoDB Community Edition.
    echo Visit: https://www.mongodb.com/try/download/community
    echo.
    echo You can also use MongoDB Atlas (cloud) by updating MONGODB_URI in .env
) else (
    echo ✅ MongoDB is installed
)

echo.
echo Installing backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing packages...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies already installed
)

echo.
echo Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    echo Installing packages...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies already installed
)

echo.
echo Checking environment configuration...
cd ..\backend
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" > nul
        echo ⚠️  Created .env from .env.example
        echo ⚠️  Please update OAuth credentials in backend\.env
    ) else (
        echo ❌ No .env.example file found
    )
) else (
    echo ✅ Environment file exists
)

echo.
echo ====================================
echo   Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Configure OAuth credentials in backend\.env
echo 2. Read SOCIAL_AUTH_SETUP.md for OAuth setup guide
echo 3. Start MongoDB (if using local installation)
echo 4. Run: start-dev.bat to start both servers
echo.
echo For OAuth setup instructions, see:
echo   📖 SOCIAL_AUTH_SETUP.md
echo.
pause