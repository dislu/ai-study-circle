const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Configure email transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
        },
        // For development/testing, you can use ethereal email
        ...(process.env.NODE_ENV === 'development' && {
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass'
          }
        })
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  // Generate email verification token
  generateVerificationToken(userId) {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${userId}-${Date.now()}-${process.env.JWT_SECRET}`)
      .digest('hex');
  }

  // Generate password reset token
  generateResetToken(email) {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${email}-${Date.now()}-${process.env.JWT_SECRET}`)
      .digest('hex');
  }

  // Send email verification
  async sendVerificationEmail(email, name, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - AI Study Circle</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 AI Study Circle</h1>
              <p>Welcome to smarter studying!</p>
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Thanks for joining AI Study Circle! Please verify your email address to get started.</p>
              <p>Click the button below to verify your account:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationUrl}</p>
              <p><strong>This link expires in 24 hours.</strong></p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>AI Study Circle - Intelligent Content Analysis</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Welcome to AI Study Circle!
        
        Hi ${name},
        
        Thanks for joining AI Study Circle! Please verify your email address to get started.
        
        Click this link to verify your account: ${verificationUrl}
        
        This link expires in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
        
        Best regards,
        AI Study Circle Team
      `;

      const mailOptions = {
        from: `"AI Study Circle" <${process.env.SMTP_USER || 'noreply@aistudycircle.com'}>`,
        to: email,
        subject: 'Verify Your Email - AI Study Circle',
        text: text,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent:', info.messageId);
      
      // For development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - AI Study Circle</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444, #F97316); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>AI Study Circle</p>
            </div>
            <div class="content">
              <h2>Hi ${name || 'there'}!</h2>
              <p>We received a request to reset your password for your AI Study Circle account.</p>
              <div class="warning">
                <p><strong>⚠️ Important:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
              <p>To reset your password, click the button below:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
              <p><strong>This link expires in 1 hour for security reasons.</strong></p>
            </div>
            <div class="footer">
              <p>AI Study Circle - Intelligent Content Analysis</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Password Reset - AI Study Circle
        
        Hi ${name || 'there'},
        
        We received a request to reset your password for your AI Study Circle account.
        
        To reset your password, click this link: ${resetUrl}
        
        This link expires in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        
        Best regards,
        AI Study Circle Team
      `;

      const mailOptions = {
        from: `"AI Study Circle" <${process.env.SMTP_USER || 'noreply@aistudycircle.com'}>`,
        to: email,
        subject: 'Reset Your Password - AI Study Circle',
        text: text,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', info.messageId);
      
      // For development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    try {
      const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to AI Study Circle!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #3B82F6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature { margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to AI Study Circle!</h1>
              <p>Your intelligent study companion</p>
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Welcome to AI Study Circle! We're excited to help you study smarter with our AI-powered tools.</p>
              
              <div class="features">
                <h3>🚀 What you can do:</h3>
                <div class="feature">📄 <strong>Upload Documents:</strong> PDFs, Word docs, and text files</div>
                <div class="feature">📝 <strong>AI Summaries:</strong> Get concise, intelligent summaries</div>
                <div class="feature">🧠 <strong>Practice Exams:</strong> AI-generated quizzes and tests</div>
                <div class="feature">📊 <strong>Track Progress:</strong> Monitor your learning journey</div>
                <div class="feature">📤 <strong>Export Content:</strong> Download in multiple formats</div>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" class="button">Get Started Now</a>
              </p>
              
              <p>Need help? Check out our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/how-it-works">How It Works</a> guide!</p>
            </div>
            <div class="footer">
              <p>AI Study Circle - Intelligent Content Analysis</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Welcome to AI Study Circle!
        
        Hi ${name}!
        
        Welcome to AI Study Circle! We're excited to help you study smarter with our AI-powered tools.
        
        What you can do:
        📄 Upload Documents: PDFs, Word docs, and text files
        📝 AI Summaries: Get concise, intelligent summaries
        🧠 Practice Exams: AI-generated quizzes and tests
        📊 Track Progress: Monitor your learning journey
        📤 Export Content: Download in multiple formats
        
        Get started: ${dashboardUrl}
        
        Best regards,
        AI Study Circle Team
      `;

      const mailOptions = {
        from: `"AI Study Circle" <${process.env.SMTP_USER || 'noreply@aistudycircle.com'}>`,
        to: email,
        subject: '🎉 Welcome to AI Study Circle!',
        text: text,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      throw error;
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();