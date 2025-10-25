@echo off
setlocal enabledelayedexpansion

REM Complete ELK Stack Setup and Deployment Script (Windows)
REM This script sets up the entire logging infrastructure

set KIBANA_URL=http://localhost:5601
set ELASTICSEARCH_URL=http://localhost:9200

echo ============================================
echo     AI Study Circle - ELK Stack Setup      
echo ============================================
echo.

echo 📋 Checking prerequisites...

REM Check Docker
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Docker is not installed or not in PATH
    pause
    exit /b 1
)

REM Check Docker Compose
docker compose version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Docker Compose is not available
    pause
    exit /b 1
)

REM Check curl
curl --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ curl is not installed or not in PATH
    pause
    exit /b 1
)

REM Check Docker is running
docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ All prerequisites met

echo 📋 Setting up ELK Stack...

REM Stop any existing containers
docker compose down --remove-orphans 2>nul

REM Start the services
echo 📋 Starting ELK services...
docker compose up -d

if !errorlevel! equ 0 (
    echo ✅ ELK services started successfully
) else (
    echo ❌ Failed to start ELK services
    pause
    exit /b 1
)

echo 📋 Waiting for services to be ready...

REM Wait for Elasticsearch
echo    ⏳ Waiting for Elasticsearch...
set retries=0
set max_retries=60

:wait_elasticsearch
curl -sf "%ELASTICSEARCH_URL%/_cluster/health" >nul 2>&1
if !errorlevel! equ 0 goto elasticsearch_ready

set /a retries+=1
if !retries! gtr !max_retries! (
    echo ❌ Elasticsearch failed to start within timeout
    docker compose logs elasticsearch
    pause
    exit /b 1
)

echo       Attempt !retries!/!max_retries!...
timeout /t 10 /nobreak >nul
goto wait_elasticsearch

:elasticsearch_ready
echo ✅ Elasticsearch is ready

REM Wait for Kibana
echo    ⏳ Waiting for Kibana...
set retries=0

:wait_kibana
curl -sf "%KIBANA_URL%/api/status" >nul 2>&1
if !errorlevel! equ 0 goto kibana_ready

set /a retries+=1
if !retries! gtr !max_retries! (
    echo ❌ Kibana failed to start within timeout
    docker compose logs kibana
    pause
    exit /b 1
)

echo       Attempt !retries!/!max_retries!...
timeout /t 10 /nobreak >nul
goto wait_kibana

:kibana_ready
echo ✅ Kibana is ready

REM Give services a moment to fully initialize
timeout /t 10 /nobreak >nul

echo 📋 Creating Elasticsearch index template...
curl -s -X PUT "%ELASTICSEARCH_URL%/_index_template/ai-study-logs-template" ^
    -H "Content-Type: application/json" ^
    -d @elasticsearch/ai-study-logs-template.json >nul 2>&1

if !errorlevel! equ 0 (
    echo ✅ Index template created successfully
) else (
    echo ⚠️  Index template creation may have failed
)

echo 📋 Importing Kibana index pattern and dashboards...

REM Import index pattern first
if exist "kibana\index-pattern.json" (
    curl -s -X POST "%KIBANA_URL%/api/saved_objects/_import" ^
        -H "kbn-xsrf: true" ^
        --form file=@"kibana/index-pattern.json" >nul 2>&1
    
    if !errorlevel! equ 0 (
        echo ✅ Index pattern imported successfully
    ) else (
        echo ⚠️  Index pattern import may have failed
    )
)

REM Import dashboards
for %%f in ("kibana\dashboards\*.json") do (
    echo    📊 Importing dashboard: %%~nf
    
    curl -s -X POST "%KIBANA_URL%/api/saved_objects/_import" ^
        -H "kbn-xsrf: true" ^
        --form file=@"%%f" >nul 2>&1
    
    if !errorlevel! equ 0 (
        echo       ✅ Successfully imported %%~nf
    ) else (
        echo       ⚠️  Import may have failed for %%~nf
    )
)

echo.
echo ✅ 🎉 ELK Stack setup completed successfully!
echo.

echo 📋 Service Status:
docker compose ps
echo.

echo 📋 Access Information:
echo.
echo 🌐 Kibana Dashboard:     %KIBANA_URL%
echo 🔍 Elasticsearch API:    %ELASTICSEARCH_URL%
echo 📊 Logstash Input:       http://localhost:5044
echo.

echo 📋 Available Dashboards:
echo    • System Overview - Application health and errors
echo    • Performance Metrics - Response times and web vitals
echo    • User Activity - User interactions and engagement
echo.

echo 📋 Next Steps:
echo.
echo 1. 🔧 Start your application to generate logs
echo 2. 📊 Open Kibana: %KIBANA_URL%
echo 3. 🔍 Explore the pre-configured dashboards
echo 4. 📈 Monitor your application in real-time
echo.

echo 📋 Management Commands:
echo    elk-manager.bat status    - Check service status
echo    elk-manager.bat logs      - View service logs
echo    elk-manager.bat stop      - Stop all services
echo    elk-manager.bat cleanup   - Remove all data
echo.

echo 📚 For detailed documentation, see: README.md

pause