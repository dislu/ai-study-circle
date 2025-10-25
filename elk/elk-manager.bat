@echo off
REM ELK Stack Management Script for AI Study Circle (Windows)
REM Manages Elasticsearch, Logstash, Kibana, and Filebeat services

setlocal enabledelayedexpansion

REM Configuration
set "SCRIPT_DIR=%~dp0"
set "ELK_DIR=%SCRIPT_DIR%"
set "COMPOSE_FILE=%ELK_DIR%docker-compose.yml"
set "ENV_FILE=%ELK_DIR%.env"

REM Check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM Check if Docker Compose is available
:check_compose
docker-compose version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose is not available. Please install Docker Compose.
        exit /b 1
    ) else (
        set "COMPOSE_CMD=docker compose"
    )
) else (
    set "COMPOSE_CMD=docker-compose"
)

REM Create environment file if it doesn't exist
:create_env_file
if not exist "%ENV_FILE%" (
    echo [INFO] Creating environment file...
    (
        echo # ELK Stack Environment Configuration
        echo COMPOSE_PROJECT_NAME=ai-study-elk
        echo ELASTIC_VERSION=8.11.0
        echo ELASTICSEARCH_HEAP=1g
        echo LOGSTASH_HEAP=512m
        echo KIBANA_ENCRYPTION_KEY=a7a6311933d3503b89bc2dbc36572c33a6c10925682e591bffcab6911c06786d
        echo ENVIRONMENT=development
        echo TZ=UTC
    ) > "%ENV_FILE%"
    echo [INFO] Environment file created at %ENV_FILE%
)
goto :eof

REM Wait for service to be healthy
:wait_for_health
set "service=%~1"
set "max_attempts=60"
set "attempt=0"

echo [INFO] Waiting for %service% to become healthy...

:health_loop
%COMPOSE_CMD% -f "%COMPOSE_FILE%" ps "%service%" | findstr "healthy" >nul
if not errorlevel 1 (
    echo [INFO] %service% is healthy!
    goto :eof
)

set /a attempt+=1
if %attempt% geq %max_attempts% (
    echo [ERROR] %service% failed to become healthy after 300 seconds
    exit /b 1
)

echo|set /p="."
timeout /t 5 /nobreak >nul
goto health_loop

REM Start ELK stack
:start_elk
echo [INFO] Starting ELK Stack...
call :check_docker
call :check_compose
call :create_env_file

echo [INFO] Pulling latest Docker images...
%COMPOSE_CMD% -f "%COMPOSE_FILE%" pull

echo [INFO] Starting Elasticsearch...
%COMPOSE_CMD% -f "%COMPOSE_FILE%" up -d elasticsearch
call :wait_for_health elasticsearch

echo [INFO] Starting Logstash...
%COMPOSE_CMD% -f "%COMPOSE_FILE%" up -d logstash
call :wait_for_health logstash

echo [INFO] Starting Kibana...
%COMPOSE_CMD% -f "%COMPOSE_FILE%" up -d kibana
call :wait_for_health kibana

echo [INFO] Starting Filebeat...
%COMPOSE_CMD% -f "%COMPOSE_FILE%" up -d filebeat

echo [INFO] Starting additional services...
%COMPOSE_CMD% -f "%COMPOSE_FILE%" up -d elasticsearch-head cerebro

echo [INFO] ELK Stack started successfully!
call :print_urls
goto :eof

REM Stop ELK stack
:stop_elk
echo [INFO] Stopping ELK Stack...
call :check_docker
call :check_compose

%COMPOSE_CMD% -f "%COMPOSE_FILE%" down
echo [INFO] ELK Stack stopped successfully!
goto :eof

REM Restart ELK stack
:restart_elk
echo [INFO] Restarting ELK Stack...
call :stop_elk
call :start_elk
goto :eof

REM Show status
:show_status
call :check_docker
call :check_compose

echo [INFO] ELK Stack Status:
%COMPOSE_CMD% -f "%COMPOSE_FILE%" ps

echo.
echo [INFO] Service Health Status:

REM Check Elasticsearch
curl -s -f http://localhost:9200/_cluster/health >nul 2>&1
if not errorlevel 1 (
    echo   [OK] Elasticsearch: http://localhost:9200
) else (
    echo   [ERROR] Elasticsearch: Not responding
)

REM Check Kibana
curl -s -f http://localhost:5601/api/status >nul 2>&1
if not errorlevel 1 (
    echo   [OK] Kibana: http://localhost:5601
) else (
    echo   [ERROR] Kibana: Not responding
)

REM Check Logstash
curl -s -f http://localhost:9600 >nul 2>&1
if not errorlevel 1 (
    echo   [OK] Logstash: http://localhost:9600
) else (
    echo   [ERROR] Logstash: Not responding
)
goto :eof

REM View logs
:view_logs
set "service=%~1"
call :check_docker
call :check_compose

if "%service%"=="" (
    echo [INFO] Showing logs for all ELK services...
    %COMPOSE_CMD% -f "%COMPOSE_FILE%" logs -f
) else (
    echo [INFO] Showing logs for %service%...
    %COMPOSE_CMD% -f "%COMPOSE_FILE%" logs -f "%service%"
)
goto :eof

REM Clean up volumes and data
:cleanup
echo [WARNING] This will remove all ELK data and volumes. Are you sure? (y/N)
set /p response="Enter choice: "
if /i "%response%"=="y" (
    echo [INFO] Cleaning up ELK Stack...
    call :check_docker
    call :check_compose
    
    %COMPOSE_CMD% -f "%COMPOSE_FILE%" down -v
    docker volume prune -f
    echo [INFO] ELK Stack cleaned up successfully!
) else (
    echo [INFO] Cleanup cancelled.
)
goto :eof

REM Setup index templates
:setup_templates
echo [INFO] Setting up Elasticsearch index templates...

REM Wait for Elasticsearch to be ready
:wait_es_loop
curl -s -f http://localhost:9200/_cluster/health >nul 2>&1
if errorlevel 1 (
    echo|set /p="."
    timeout /t 2 /nobreak >nul
    goto wait_es_loop
)

REM Apply index template
if exist "%ELK_DIR%elasticsearch\index-templates\ai-study-logs-template.json" (
    curl -X PUT "http://localhost:9200/_index_template/ai-study-logs" ^
         -H "Content-Type: application/json" ^
         -d @"%ELK_DIR%elasticsearch\index-templates\ai-study-logs-template.json"
    echo [INFO] Index template applied successfully!
) else (
    echo [WARNING] Index template file not found
)
goto :eof

REM Print service URLs
:print_urls
echo.
echo [INFO] ELK Stack URLs:
echo   📊 Kibana Dashboard: http://localhost:5601
echo   🔍 Elasticsearch: http://localhost:9200
echo   📈 Logstash Monitoring: http://localhost:9600
echo   🧠 Elasticsearch Head: http://localhost:9100
echo   🔧 Cerebro (ES Admin): http://localhost:9000
echo.
echo [INFO] Useful Elasticsearch endpoints:
echo   📊 Cluster Health: http://localhost:9200/_cluster/health
echo   📝 List Indices: http://localhost:9200/_cat/indices
echo   🔍 Search Logs: http://localhost:9200/ai-study-logs-*/_search
goto :eof

REM Show help
:show_help
echo ELK Stack Management Script for AI Study Circle
echo.
echo Usage: %~nx0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo     start           Start the ELK stack
echo     stop            Stop the ELK stack
echo     restart         Restart the ELK stack
echo     status          Show status of all services
echo     logs [service]  Show logs (all services or specific service)
echo     cleanup         Remove all data and volumes
echo     setup           Setup index templates and dashboards
echo     urls            Show service URLs
echo     help            Show this help message
echo.
echo Services:
echo     elasticsearch   Elasticsearch search engine
echo     logstash       Logstash log processor
echo     kibana         Kibana dashboard
echo     filebeat       Filebeat log shipper
echo.
echo Examples:
echo     %~nx0 start                    # Start all services
echo     %~nx0 logs elasticsearch       # Show Elasticsearch logs
echo     %~nx0 status                   # Show service status
echo     %~nx0 cleanup                  # Clean all data (with confirmation)
echo.
goto :eof

REM Main command handler
set "command=%~1"
if "%command%"=="" set "command=help"

if "%command%"=="start" (
    call :start_elk
) else if "%command%"=="stop" (
    call :stop_elk
) else if "%command%"=="restart" (
    call :restart_elk
) else if "%command%"=="status" (
    call :show_status
) else if "%command%"=="logs" (
    call :view_logs "%~2"
) else if "%command%"=="cleanup" (
    call :cleanup
) else if "%command%"=="setup" (
    call :setup_templates
) else if "%command%"=="urls" (
    call :print_urls
) else if "%command%"=="help" (
    call :show_help
) else (
    echo [ERROR] Unknown command: %command%
    call :show_help
    exit /b 1
)

endlocal