@echo off
REM Docker Management Script for AI Study Circle (Windows)
REM This script provides easy commands to manage the Docker environment

setlocal enabledelayedexpansion

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo [INFO] Docker and Docker Compose are available.

REM Main script logic
if "%1"=="dev-up" goto :dev_up
if "%1"=="dev-down" goto :dev_down
if "%1"=="dev-logs" goto :dev_logs
if "%1"=="prod-up" goto :prod_up
if "%1"=="prod-down" goto :prod_down
if "%1"=="prod-logs" goto :prod_logs
if "%1"=="simple-up" goto :simple_up
if "%1"=="simple-down" goto :simple_down
if "%1"=="simple-logs" goto :simple_logs
if "%1"=="build" goto :build_images
if "%1"=="status" goto :status
if "%1"=="cleanup" goto :cleanup
goto :help

:dev_up
echo [INFO] Starting development environment...
docker-compose -f docker-compose.dev.yml --env-file .env.docker up -d
echo [INFO] Development environment is running!
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Backend: http://localhost:5000
echo [INFO] MongoDB: localhost:27017
goto :end

:dev_down
echo [INFO] Stopping development environment...
docker-compose -f docker-compose.dev.yml down
echo [INFO] Development environment stopped.
goto :end

:dev_logs
echo [INFO] Showing development logs...
docker-compose -f docker-compose.dev.yml logs -f %2 %3 %4 %5
goto :end

:prod_up
echo [INFO] Starting production environment...
if not exist .env.prod (
    echo [WARNING] .env.prod file not found. Creating from template...
    copy .env.prod.example .env.prod
    echo [WARNING] Please edit .env.prod with your production values before continuing.
    pause
    exit /b 1
)
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
echo [INFO] Production environment is running!
goto :end

:prod_down
echo [INFO] Stopping production environment...
docker-compose -f docker-compose.prod.yml --env-file .env.prod down
echo [INFO] Production environment stopped.
goto :end

:prod_logs
echo [INFO] Showing production logs...
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f %2 %3 %4 %5
goto :end

:simple_up
echo [INFO] Starting simple environment...
if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.docker .env
    echo [WARNING] Please edit .env with your configuration values.
)
docker-compose up -d
echo [INFO] Simple environment is running!
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Backend: http://localhost:5000
goto :end

:simple_down
echo [INFO] Stopping simple environment...
docker-compose down
echo [INFO] Simple environment stopped.
goto :end

:simple_logs
echo [INFO] Showing simple environment logs...
docker-compose logs -f %2 %3 %4 %5
goto :end

:build_images
echo [INFO] Building all Docker images...
docker-compose -f docker-compose.dev.yml build --no-cache
echo [INFO] Images built successfully!
goto :end

:status
echo [INFO] Docker containers status:
docker ps -a --filter "name=ai-study-circle"
echo.
echo [INFO] Docker volumes:
docker volume ls --filter "name=ai-study-circle"
goto :end

:cleanup
echo [INFO] Cleaning up Docker resources...
docker system prune -f
docker volume prune -f
echo [INFO] Cleanup completed!
goto :end

:help
echo ================================
echo   AI Study Circle - Docker Manager
echo ================================
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   dev-up      Start development environment
echo   dev-down    Stop development environment
echo   dev-logs    Show development logs
echo   prod-up     Start production environment
echo   prod-down   Stop production environment
echo   prod-logs   Show production logs
echo   simple-up   Start simple environment (docker-compose.yml)
echo   simple-down Stop simple environment
echo   simple-logs Show simple environment logs
echo   build       Build all Docker images
echo   status      Show containers and volumes status
echo   cleanup     Clean up Docker resources
echo   help        Show this help message
echo.
echo Examples:
echo   %0 dev-up          Start development environment
echo   %0 dev-logs backend Show backend logs only
echo   %0 prod-up         Start production environment
echo   %0 status          Show current status
echo.

:end
pause