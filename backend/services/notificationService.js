const nodemailer = require('nodemailer');
const { alertLogger } = require('../../utils/logger');

/**
 * Notification Service for Alert Management
 * Handles sending notifications through various channels (Email, Slack, SMS, etc.)
 */

class NotificationService {
    constructor() {
        this.emailTransporter = null;
        this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        this.smsApiKey = process.env.SMS_API_KEY;
        this.pagerDutyIntegrationKey = process.env.PAGERDUTY_INTEGRATION_KEY;
        
        this.initializeEmailTransporter();
    }

    // Initialize email transporter
    initializeEmailTransporter() {
        try {
            this.emailTransporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER || 'alerts@ai-study-circle.com',
                    pass: process.env.SMTP_PASS || 'your-app-password'
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            alertLogger.info('Email transporter initialized successfully');
        } catch (error) {
            alertLogger.error('Failed to initialize email transporter', {
                error: error.message
            });
        }
    }

    // Send email notification
    async sendEmailNotification(notification) {
        try {
            if (!this.emailTransporter) {
                throw new Error('Email transporter not initialized');
            }

            const emailOptions = {
                from: process.env.SMTP_USER || 'alerts@ai-study-circle.com',
                to: this.getEmailRecipients(notification.severity),
                subject: `[${notification.severity.toUpperCase()}] ${notification.title}`,
                html: this.generateEmailHTML(notification),
                text: this.generateEmailText(notification)
            };

            const result = await this.emailTransporter.sendMail(emailOptions);
            
            alertLogger.info('Email notification sent successfully', {
                messageId: result.messageId,
                recipients: emailOptions.to,
                subject: emailOptions.subject
            });

            return { success: true, messageId: result.messageId };

        } catch (error) {
            alertLogger.error('Failed to send email notification', {
                error: error.message,
                notification_type: notification.type
            });
            return { success: false, error: error.message };
        }
    }

    // Send Slack notification
    async sendSlackNotification(notification) {
        try {
            if (!this.slackWebhookUrl) {
                throw new Error('Slack webhook URL not configured');
            }

            const slackPayload = {
                text: notification.title,
                attachments: [
                    {
                        color: this.getSlackColor(notification.severity),
                        fields: [
                            {
                                title: 'Severity',
                                value: notification.severity.toUpperCase(),
                                short: true
                            },
                            {
                                title: 'Type',
                                value: notification.type,
                                short: true
                            },
                            {
                                title: 'Message',
                                value: notification.message,
                                short: false
                            },
                            {
                                title: 'Timestamp',
                                value: new Date().toISOString(),
                                short: true
                            }
                        ],
                        footer: 'AI Study Circle Monitoring',
                        ts: Math.floor(Date.now() / 1000)
                    }
                ]
            };

            // Add specific fields based on alert type
            if (notification.data) {
                slackPayload.attachments[0].fields.push(...this.getAlertSpecificFields(notification));
            }

            const response = await fetch(this.slackWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(slackPayload)
            });

            if (response.ok) {
                alertLogger.info('Slack notification sent successfully', {
                    notification_type: notification.type,
                    severity: notification.severity
                });
                return { success: true };
            } else {
                throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            alertLogger.error('Failed to send Slack notification', {
                error: error.message,
                notification_type: notification.type
            });
            return { success: false, error: error.message };
        }
    }

    // Send SMS notification (using Twilio or similar service)
    async sendSMSNotification(notification) {
        try {
            if (!this.smsApiKey) {
                throw new Error('SMS API key not configured');
            }

            // For critical alerts only
            if (notification.severity !== 'critical') {
                return { success: true, skipped: 'SMS only for critical alerts' };
            }

            const smsMessage = this.generateSMSText(notification);
            const recipients = this.getSMSRecipients();

            // Here you would integrate with your SMS provider (Twilio, AWS SNS, etc.)
            // const result = await twilioClient.messages.create({
            //     body: smsMessage,
            //     to: recipient,
            //     from: process.env.TWILIO_PHONE_NUMBER
            // });

            alertLogger.info('SMS notification sent successfully', {
                notification_type: notification.type,
                recipients: recipients.length,
                message_length: smsMessage.length
            });

            return { success: true, recipients: recipients.length };

        } catch (error) {
            alertLogger.error('Failed to send SMS notification', {
                error: error.message,
                notification_type: notification.type
            });
            return { success: false, error: error.message };
        }
    }

    // Send PagerDuty notification
    async sendPagerDutyNotification(notification) {
        try {
            if (!this.pagerDutyIntegrationKey) {
                throw new Error('PagerDuty integration key not configured');
            }

            // Only for critical alerts
            if (notification.severity !== 'critical') {
                return { success: true, skipped: 'PagerDuty only for critical alerts' };
            }

            const pagerDutyPayload = {
                routing_key: this.pagerDutyIntegrationKey,
                event_action: 'trigger',
                dedup_key: `ai-study-circle-${notification.type}-${Date.now()}`,
                payload: {
                    summary: notification.title,
                    source: 'AI Study Circle Monitoring',
                    severity: notification.severity,
                    component: 'logging-system',
                    group: 'infrastructure',
                    class: notification.type,
                    custom_details: {
                        message: notification.message,
                        alert_data: notification.data,
                        timestamp: new Date().toISOString()
                    }
                }
            };

            const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pagerDutyPayload)
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                alertLogger.info('PagerDuty notification sent successfully', {
                    notification_type: notification.type,
                    dedup_key: pagerDutyPayload.dedup_key,
                    status: result.status
                });
                return { success: true, dedup_key: pagerDutyPayload.dedup_key };
            } else {
                throw new Error(`PagerDuty API error: ${result.message || 'Unknown error'}`);
            }

        } catch (error) {
            alertLogger.error('Failed to send PagerDuty notification', {
                error: error.message,
                notification_type: notification.type
            });
            return { success: false, error: error.message };
        }
    }

    // Main notification dispatch method
    async sendNotification(notification) {
        const results = {};

        for (const channel of notification.channels) {
            try {
                switch (channel) {
                    case 'email':
                        results.email = await this.sendEmailNotification(notification);
                        break;
                    case 'slack':
                        results.slack = await this.sendSlackNotification(notification);
                        break;
                    case 'sms':
                        results.sms = await this.sendSMSNotification(notification);
                        break;
                    case 'pagerduty':
                        results.pagerduty = await this.sendPagerDutyNotification(notification);
                        break;
                    default:
                        alertLogger.warn('Unknown notification channel', { channel });
                }
            } catch (error) {
                results[channel] = { success: false, error: error.message };
                alertLogger.error(`Failed to send ${channel} notification`, {
                    error: error.message,
                    notification_type: notification.type
                });
            }
        }

        return results;
    }

    // Helper methods

    getEmailRecipients(severity) {
        const baseRecipients = ['devops@ai-study-circle.com', 'monitoring@ai-study-circle.com'];
        
        if (severity === 'critical') {
            return [...baseRecipients, 'admin@ai-study-circle.com', 'cto@ai-study-circle.com'];
        }
        
        return baseRecipients;
    }

    getSMSRecipients() {
        return [
            process.env.ONCALL_PHONE_1 || '+1234567890',
            process.env.ONCALL_PHONE_2 || '+1234567891'
        ];
    }

    getSlackColor(severity) {
        const colors = {
            critical: '#FF0000',
            high: '#FF8C00',
            medium: '#FFD700',
            low: '#32CD32'
        };
        return colors[severity] || '#808080';
    }

    generateEmailHTML(notification) {
        return `
            <html>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="border-left: 4px solid ${this.getAlertColor(notification.severity)}; padding-left: 20px; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #333;">${notification.title}</h2>
                            <p style="margin: 5px 0 0 0; color: #666; font-weight: bold; text-transform: uppercase;">${notification.severity} Alert</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5; color: #444;">
                                ${notification.message}
                            </p>
                        </div>
                        
                        ${this.generateAlertDataHTML(notification.data)}
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 14px; color: #888;">
                                <strong>Alert Time:</strong> ${new Date().toLocaleString()}<br>
                                <strong>Alert Type:</strong> ${notification.type}<br>
                                <strong>System:</strong> AI Study Circle Monitoring
                            </p>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:5601/app/kibana" style="display: inline-block; padding: 12px 24px; background-color: #007cba; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                View Dashboard
                            </a>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    generateEmailText(notification) {
        return `
AI Study Circle Alert - ${notification.severity.toUpperCase()}

${notification.title}

${notification.message}

Alert Type: ${notification.type}
Timestamp: ${new Date().toISOString()}

View Dashboard: http://localhost:5601/app/kibana

This is an automated alert from the AI Study Circle monitoring system.
        `.trim();
    }

    generateSMSText(notification) {
        return `🚨 AI Study Circle ALERT: ${notification.title} - ${notification.message}. Check dashboard: http://localhost:5601`;
    }

    generateAlertDataHTML(data) {
        if (!data) return '';
        
        let html = '<div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">';
        html += '<h4 style="margin: 0 0 10px 0; color: #333;">Alert Details:</h4>';
        html += '<ul style="margin: 0; padding-left: 20px; color: #555;">';
        
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object') {
                html += `<li><strong>${key}:</strong> ${JSON.stringify(value, null, 2)}</li>`;
            } else {
                html += `<li><strong>${key}:</strong> ${value}</li>`;
            }
        });
        
        html += '</ul></div>';
        return html;
    }

    getAlertSpecificFields(notification) {
        const fields = [];
        const data = notification.data;
        
        switch (notification.type) {
            case 'critical_error_rate':
                if (data.error_count) fields.push({ title: 'Error Count', value: data.error_count.toString(), short: true });
                if (data.time_window) fields.push({ title: 'Time Window', value: data.time_window, short: true });
                break;
                
            case 'performance_degradation':
                if (data.avg_response_time) fields.push({ title: 'Avg Response Time', value: `${data.avg_response_time}ms`, short: true });
                if (data.max_response_time) fields.push({ title: 'Max Response Time', value: `${data.max_response_time}ms`, short: true });
                break;
                
            case 'security_threat':
                if (data.threat_count) fields.push({ title: 'Threat Count', value: data.threat_count.toString(), short: true });
                if (data.max_risk_score) fields.push({ title: 'Max Risk Score', value: `${data.max_risk_score}/10`, short: true });
                break;
                
            case 'system_anomaly':
                if (data.anomaly_count) fields.push({ title: 'Anomaly Count', value: data.anomaly_count.toString(), short: true });
                break;
        }
        
        return fields;
    }

    getAlertColor(severity) {
        const colors = {
            critical: '#dc3545',
            high: '#fd7e14',
            medium: '#ffc107',
            low: '#28a745'
        };
        return colors[severity] || '#6c757d';
    }
}

module.exports = new NotificationService();