@echo off
setlocal enabledelayedexpansion

REM Dashboard Import Script for Kibana (Windows)
REM This script imports pre-configured dashboards into Kibana

set KIBANA_URL=http://localhost:5601
set DASHBOARD_DIR=.\kibana\dashboards

echo 🚀 Starting Kibana Dashboard Import...

REM Wait for Kibana to be available
echo ⏳ Waiting for Kibana to be ready...
:wait_loop
curl -f "%KIBANA_URL%/api/status" >nul 2>&1
if !errorlevel! neq 0 (
    echo    Kibana not ready yet, waiting 10 seconds...
    timeout /t 10 /nobreak >nul
    goto wait_loop
)

echo ✅ Kibana is ready!

REM Import dashboards function
if not exist "%DASHBOARD_DIR%" (
    echo ❌ Dashboard directory not found: %DASHBOARD_DIR%
    exit /b 1
)

for %%f in ("%DASHBOARD_DIR%\*.json") do (
    echo 📊 Importing dashboard: %%~nf
    
    curl -s -X POST "%KIBANA_URL%/api/saved_objects/_import" ^
        -H "kbn-xsrf: true" ^
        -H "Content-Type: application/json" ^
        --form file=@"%%f" >nul 2>&1
    
    if !errorlevel! equ 0 (
        echo    ✅ Successfully imported %%~nf
    ) else (
        echo    ❌ Failed to import %%~nf
    )
)

echo.
echo 🎉 Dashboard import completed!
echo 📊 Access your dashboards at: %KIBANA_URL%/app/dashboards
echo.
echo Available dashboards:
echo    • System Overview - Application health and errors
echo    • Performance Metrics - Response times and web vitals
echo    • User Activity - User interactions and engagement

pause