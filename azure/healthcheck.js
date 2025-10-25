// Health check script for Azure Container Instances
const http = require('http');

const healthCheck = async () => {
    try {
        // Check if the main application is responding
        const req = http.request({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: '/api/health',
            method: 'GET',
            timeout: 3000
        }, (res) => {
            if (res.statusCode === 200) {
                console.log('Health check passed');
                process.exit(0);
            } else {
                console.error(`Health check failed with status: ${res.statusCode}`);
                process.exit(1);
            }
        });
        
        req.on('error', (err) => {
            console.error('Health check failed:', err.message);
            process.exit(1);
        });
        
        req.on('timeout', () => {
            console.error('Health check timed out');
            req.destroy();
            process.exit(1);
        });
        
        req.end();
        
    } catch (error) {
        console.error('Health check error:', error.message);
        process.exit(1);
    }
};

// Run health check
healthCheck();