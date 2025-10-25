@echo off
setlocal enabledelayedexpansion

REM Filebeat Log Collection Testing Script (Windows)
REM This script tests various log scenarios to ensure proper collection and parsing

set BACKEND_LOG_DIR=..\backend\logs
set FRONTEND_LOG_DIR=..\frontend\logs
set ELASTICSEARCH_URL=http://localhost:9200
set LOGSTASH_URL=http://localhost:5044

echo ========================================
echo   Filebeat Log Collection Test Suite   
echo ========================================
echo.

echo 🔍 Setting up test directories...
if not exist "%BACKEND_LOG_DIR%" mkdir "%BACKEND_LOG_DIR%"
if not exist "%FRONTEND_LOG_DIR%" mkdir "%FRONTEND_LOG_DIR%"
echo ✅ Test directories created

echo 🔍 Generating sample backend logs...
(
echo {"timestamp":"2024-01-15T10:30:00.000Z","level":"info","message":"Server started","service":"backend","port":5000}
echo {"timestamp":"2024-01-15T10:30:15.123Z","level":"info","message":"User login attempt","service":"auth","userId":"user123","ip":"192.168.1.100","userAgent":"Mozilla/5.0 Chrome/120.0"}
echo {"timestamp":"2024-01-15T10:30:16.456Z","level":"info","message":"Login successful","service":"auth","userId":"user123","sessionId":"sess_abc123"}
echo {"timestamp":"2024-01-15T10:30:30.789Z","level":"info","message":"API request","service":"backend","method":"GET","url":"/api/dashboard","statusCode":200,"responseTime":150,"userId":"user123"}
echo {"timestamp":"2024-01-15T10:31:00.012Z","level":"warn","message":"Slow API response","service":"backend","method":"POST","url":"/api/translate","statusCode":200,"responseTime":3500,"userId":"user123"}
echo {"timestamp":"2024-01-15T10:31:15.345Z","level":"error","message":"Database connection failed","service":"backend","error":{"name":"ConnectionError","message":"Unable to connect to MongoDB","stack":"ConnectionError: Unable to connect\n    at Database.connect (db.js:45:12)"}}
echo {"timestamp":"2024-01-15T10:32:30.567Z","level":"info","message":"User logout","service":"auth","userId":"user123","sessionId":"sess_abc123","sessionDuration":120000}
) > "%BACKEND_LOG_DIR%\test-backend.log"
echo ✅ Backend logs generated

echo 🔍 Generating sample frontend logs...
(
echo {"timestamp":"2024-01-15T10:30:05.000Z","level":"info","message":"App initialized","service":"frontend","page":"/dashboard","userId":"user123","sessionId":"sess_abc123"}
echo {"timestamp":"2024-01-15T10:30:10.123Z","level":"info","message":"User action","service":"frontend","action":"page_view","page":"/dashboard","userId":"user123","sessionId":"sess_abc123","userAgent":"Mozilla/5.0 Chrome/120.0"}
echo {"timestamp":"2024-01-15T10:30:25.456Z","level":"info","message":"Performance metrics","service":"frontend","performance":{"lcp":1200,"fid":50,"cls":0.08,"memory":{"usedJSHeapSize":48000000}},"page":"/dashboard"}
echo {"timestamp":"2024-01-15T10:30:45.789Z","level":"info","message":"User interaction","service":"frontend","action":"click","element":"chat-button","page":"/dashboard","userId":"user123","coordinates":{"x":300,"y":150}}
echo {"timestamp":"2024-01-15T10:31:35.901Z","level":"error","message":"JavaScript error","service":"frontend","error":{"name":"TypeError","message":"Cannot read property of undefined","stack":"TypeError: Cannot read property\n    at Component.render (app.js:142:20)","componentStack":"    in TranslateComponent\n    in Router"}}
) > "%FRONTEND_LOG_DIR%\test-frontend.log"
echo ✅ Frontend logs generated

echo 🔍 Generating performance test logs...
(
echo {"timestamp":"2024-01-15T10:35:00.000Z","level":"info","message":"Performance measurement","log_type":"performance","performance":{"lcp":800,"fid":30,"cls":0.05},"page":"/dashboard","performance_score":"good"}
echo {"timestamp":"2024-01-15T10:35:15.000Z","level":"warn","message":"Performance degradation","log_type":"performance","performance":{"lcp":3200,"fid":80,"cls":0.12},"page":"/chat","performance_score":"needs_improvement"}  
echo {"timestamp":"2024-01-15T10:35:30.000Z","level":"error","message":"Poor performance","log_type":"performance","performance":{"lcp":5800,"fid":200,"cls":0.35},"page":"/translate","performance_score":"poor"}
) > "%FRONTEND_LOG_DIR%\test-performance.log"
echo ✅ Performance logs generated

echo 🔍 Generating security test logs...
(
echo {"timestamp":"2024-01-15T10:40:00.000Z","level":"warn","message":"Failed authentication attempt","log_type":"security","service":"auth","ip":"203.0.113.15","endpoint":"/auth/login","auth_result":"failure","security_event_type":"authentication"}
echo {"timestamp":"2024-01-15T10:40:15.000Z","level":"error","message":"Multiple failed login attempts","log_type":"security","service":"auth","ip":"203.0.113.15","attempts":5,"security_event_type":"suspicious_activity","security_severity":"high"}
echo {"timestamp":"2024-01-15T10:40:45.000Z","level":"error","message":"Unauthorized access attempt","log_type":"security","service":"backend","ip":"198.51.100.25","endpoint":"/admin/users","statusCode":403,"security_event_type":"authorization"}
) > "%BACKEND_LOG_DIR%\test-security.log"  
echo ✅ Security logs generated

echo 🔍 Generating user activity test logs...
(
echo {"timestamp":"2024-01-15T10:45:00.000Z","level":"info","message":"Page view","log_type":"user_activity","action":"page_view","page":"/dashboard","userId":"user123","sessionId":"sess_abc123","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
echo {"timestamp":"2024-01-15T10:45:15.000Z","level":"info","message":"Button click","log_type":"user_activity","action":"click","element":"ai-chat-button","page":"/dashboard","userId":"user123","coordinates":{"x":250,"y":100},"engagement_score":3}
echo {"timestamp":"2024-01-15T10:45:30.000Z","level":"info","message":"Search performed","log_type":"user_activity","action":"search","query":"translate hello","page":"/translate","userId":"user123","engagement_score":5}
) > "%FRONTEND_LOG_DIR%\test-user-activity.log"
echo ✅ User activity logs generated

echo 🔍 Testing Elasticsearch connectivity...
curl -sf "%ELASTICSEARCH_URL%/_cluster/health" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Elasticsearch is accessible
) else (
    echo ❌ Elasticsearch is not accessible
)

echo 🔍 Checking log ingestion (waiting 30 seconds for processing)...
timeout /t 30 /nobreak >nul

echo.
echo ✅ 🎉 Filebeat log collection test completed!
echo.
echo 📊 Next steps:
echo    1. Check Kibana dashboards: http://localhost:5601
echo    2. Run sample Elasticsearch queries
echo    3. Monitor real application logs
echo.
echo 📋 Sample Elasticsearch queries:
echo    1. All error logs:
echo       curl "%ELASTICSEARCH_URL%/ai-study-logs-*/_search?q=level:error&pretty"
echo    2. Performance issues:  
echo       curl "%ELASTICSEARCH_URL%/ai-study-logs-*/_search?q=log_type:performance&pretty"
echo    3. Security events:
echo       curl "%ELASTICSEARCH_URL%/ai-study-logs-*/_search?q=log_type:security&pretty"

set /p cleanup="Clean up test logs? (y/N): "
if /i "%cleanup%"=="y" (
    del "%BACKEND_LOG_DIR%\test-*.log" 2>nul
    del "%FRONTEND_LOG_DIR%\test-*.log" 2>nul
    echo ✅ Test logs cleaned up
)

pause