const express = require('express');
const { alertLogger } = require('../../src/utils/Logger');

const router = express.Router();

/**
 * Alert webhook endpoints for Elasticsearch Watcher
 * Receives alerts from Elasticsearch and processes them accordingly
 */

// Critical Error Rate Alert Handler
router.post('/error-rate', (req, res) => {
    try {
        const alertData = req.body;
        
        alertLogger.error('Critical error rate alert received', {
            alert_type: alertData.alert_type,
            error_count: alertData.error_count,
            time_window: alertData.time_window,
            services_affected: alertData.services_affected,
            severity_breakdown: alertData.severity_breakdown,
            timestamp: alertData.timestamp,
            source: 'elasticsearch_watcher'
        });

        // Process critical error rate alert
        processCriticalErrorAlert(alertData);

        res.status(200).json({
            status: 'success',
            message: 'Critical error rate alert processed',
            alert_id: generateAlertId('error_rate'),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        alertLogger.error('Failed to process error rate alert', {
            error: error.message,
            stack: error.stack,
            alert_data: req.body
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to process alert',
            error: error.message
        });
    }
});

// Performance Degradation Alert Handler
router.post('/performance', (req, res) => {
    try {
        const alertData = req.body;
        
        alertLogger.warn('Performance degradation alert received', {
            alert_type: alertData.alert_type,
            severity: alertData.severity,
            avg_response_time: alertData.avg_response_time,
            max_response_time: alertData.max_response_time,
            p95_response_time: alertData.p95_response_time,
            slow_endpoints: alertData.slow_endpoints,
            timestamp: alertData.timestamp,
            source: 'elasticsearch_watcher'
        });

        // Process performance degradation alert
        processPerformanceAlert(alertData);

        res.status(200).json({
            status: 'success',
            message: 'Performance alert processed',
            alert_id: generateAlertId('performance'),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        alertLogger.error('Failed to process performance alert', {
            error: error.message,
            stack: error.stack,
            alert_data: req.body
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to process alert',
            error: error.message
        });
    }
});

// Security Threat Alert Handler
router.post('/security', (req, res) => {
    try {
        const alertData = req.body;
        
        alertLogger.error('Security threat alert received', {
            alert_type: alertData.alert_type,
            severity: alertData.severity,
            threat_count: alertData.threat_count,
            avg_risk_score: alertData.avg_risk_score,
            max_risk_score: alertData.max_risk_score,
            threat_sources: alertData.threat_sources,
            attack_types: alertData.attack_types,
            targeted_endpoints: alertData.targeted_endpoints,
            timestamp: alertData.timestamp,
            source: 'elasticsearch_watcher'
        });

        // Process security threat alert
        processSecurityAlert(alertData);

        res.status(200).json({
            status: 'success',
            message: 'Security threat alert processed',
            alert_id: generateAlertId('security'),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        alertLogger.error('Failed to process security alert', {
            error: error.message,
            stack: error.stack,
            alert_data: req.body
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to process alert',
            error: error.message
        });
    }
});

// System Anomaly Alert Handler
router.post('/anomaly', (req, res) => {
    try {
        const alertData = req.body;
        
        alertLogger.warn('System anomaly alert received', {
            alert_type: alertData.alert_type,
            severity: alertData.severity,
            anomaly_count: alertData.anomaly_count,
            max_error_rate: alertData.max_error_rate,
            max_response_time: alertData.max_response_time,
            min_user_activity: alertData.min_user_activity,
            anomalies: alertData.anomalies,
            timestamp: alertData.timestamp,
            source: 'elasticsearch_watcher'
        });

        // Process system anomaly alert
        processAnomalyAlert(alertData);

        res.status(200).json({
            status: 'success',
            message: 'System anomaly alert processed',
            alert_id: generateAlertId('anomaly'),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        alertLogger.error('Failed to process anomaly alert', {
            error: error.message,
            stack: error.stack,
            alert_data: req.body
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to process alert',
            error: error.message
        });
    }
});

// General Alert Status Endpoint
router.get('/status', (req, res) => {
    try {
        const alertStats = getAlertStatistics();
        
        res.status(200).json({
            status: 'operational',
            alert_system: 'active',
            statistics: alertStats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        alertLogger.error('Failed to get alert status', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to get alert status',
            error: error.message
        });
    }
});

// Alert Processing Functions

function processCriticalErrorAlert(alertData) {
    // Send immediate notifications for critical errors
    const notification = {
        type: 'critical_error_rate',
        title: '🚨 Critical Error Rate Alert',
        message: `${alertData.error_count} critical errors detected in ${alertData.time_window}`,
        severity: 'critical',
        data: alertData,
        channels: ['email', 'slack', 'sms'] // High priority - all channels
    };
    
    sendNotification(notification);
    
    // Log to alert tracking system
    trackAlert('error_rate', alertData.error_count, 'critical');
    
    // Trigger automatic incident response if threshold exceeded
    if (alertData.error_count > 50) {
        triggerIncidentResponse(alertData);
    }
}

function processPerformanceAlert(alertData) {
    // Handle performance degradation based on severity
    const channels = alertData.severity === 'critical' ? ['email', 'slack'] : ['slack'];
    
    const notification = {
        type: 'performance_degradation',
        title: `🐌 Performance Alert (${alertData.severity})`,
        message: `Response time degraded: Avg ${alertData.avg_response_time}ms, Max ${alertData.max_response_time}ms`,
        severity: alertData.severity,
        data: alertData,
        channels: channels
    };
    
    sendNotification(notification);
    trackAlert('performance', alertData.avg_response_time, alertData.severity);
}

function processSecurityAlert(alertData) {
    // High priority security alerts - immediate action required
    const notification = {
        type: 'security_threat',
        title: `🔴 Security Threat Detected (${alertData.severity})`,
        message: `${alertData.threat_count} security threats detected with max risk score ${alertData.max_risk_score}/10`,
        severity: alertData.severity,
        data: alertData,
        channels: ['email', 'slack', 'sms', 'pagerduty'] // Maximum priority
    };
    
    sendNotification(notification);
    trackAlert('security', alertData.threat_count, alertData.severity);
    
    // Trigger security incident response for critical threats
    if (alertData.severity === 'critical') {
        triggerSecurityIncidentResponse(alertData);
    }
}

function processAnomalyAlert(alertData) {
    // Machine learning detected anomalies
    const notification = {
        type: 'system_anomaly',
        title: `🔍 System Anomalies Detected (${alertData.severity})`,
        message: `${alertData.anomaly_count} anomalies detected in system behavior patterns`,
        severity: alertData.severity,
        data: alertData,
        channels: ['slack', 'email']
    };
    
    sendNotification(notification);
    trackAlert('anomaly', alertData.anomaly_count, alertData.severity);
}

// Utility Functions

function generateAlertId(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${type}_${timestamp}_${random}`;
}

function sendNotification(notification) {
    try {
        // Log notification for debugging
        alertLogger.info('Sending notification', {
            type: notification.type,
            title: notification.title,
            severity: notification.severity,
            channels: notification.channels
        });

        // Here you would integrate with actual notification services:
        
        // Email notifications
        if (notification.channels.includes('email')) {
            // sendEmailNotification(notification);
        }
        
        // Slack notifications
        if (notification.channels.includes('slack')) {
            // sendSlackNotification(notification);
        }
        
        // SMS notifications
        if (notification.channels.includes('sms')) {
            // sendSMSNotification(notification);
        }
        
        // PagerDuty notifications
        if (notification.channels.includes('pagerduty')) {
            // sendPagerDutyNotification(notification);
        }
        
    } catch (error) {
        alertLogger.error('Failed to send notification', {
            error: error.message,
            notification_type: notification.type
        });
    }
}

function trackAlert(type, value, severity) {
    // Track alert metrics for analysis and reporting
    alertLogger.info('Alert tracked', {
        alert_type: type,
        value: value,
        severity: severity,
        tracked_at: new Date().toISOString()
    });
}

function triggerIncidentResponse(alertData) {
    alertLogger.error('Automatic incident response triggered', {
        trigger_type: 'critical_error_threshold',
        error_count: alertData.error_count,
        services_affected: alertData.services_affected
    });
    
    // Here you would integrate with incident management systems
    // createIncident(alertData);
    // notifyOnCallTeam(alertData);
    // escalateToManagement(alertData);
}

function triggerSecurityIncidentResponse(alertData) {
    alertLogger.error('Security incident response triggered', {
        trigger_type: 'critical_security_threat',
        threat_count: alertData.threat_count,
        risk_score: alertData.max_risk_score,
        attack_types: alertData.attack_types
    });
    
    // Here you would integrate with security incident response
    // createSecurityIncident(alertData);
    // notifySecurityTeam(alertData);
    // triggerAutomaticMitigation(alertData);
}

function getAlertStatistics() {
    // Return basic alert system statistics
    return {
        alerts_processed_today: 0, // Would query from database/logs
        critical_alerts_count: 0,
        last_alert_time: null,
        alert_types: ['error_rate', 'performance', 'security', 'anomaly'],
        notification_channels: ['email', 'slack', 'sms', 'pagerduty'],
        system_status: 'operational'
    };
}

module.exports = router;