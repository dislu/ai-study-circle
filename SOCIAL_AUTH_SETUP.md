# Social Authentication Setup Guide

## Overview
This guide explains how to configure Google, Facebook, and Microsoft OAuth authentication for the AI Study Circle platform.

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### Step 2: Configure OAuth Consent Screen
1. Go to APIs & Services > OAuth consent screen
2. Choose "External" user type
3. Fill in required information:
   - Application name: "AI Study Circle"
   - User support email: Your email
   - Developer contact information: Your email

### Step 3: Create OAuth Credentials
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "AI Study Circle Web Client"
5. Authorized JavaScript origins: `http://localhost:3000`
6. Authorized redirect URIs: `http://localhost:5000/api/social/google/callback`
7. Copy the Client ID and Client Secret

### Step 4: Update Environment Variables
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 2. Facebook OAuth Setup

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Build Connected Experiences"
4. Enter app details:
   - Display Name: "AI Study Circle"
   - App Purpose: "Education"

### Step 2: Configure Facebook Login
1. Add "Facebook Login" product to your app
2. Go to Facebook Login > Settings
3. Add Valid OAuth Redirect URIs: `http://localhost:5000/api/social/facebook/callback`
4. Add Valid OAuth Redirect URIs for web: `http://localhost:3000`

### Step 3: Get App Credentials
1. Go to Settings > Basic
2. Copy App ID and App Secret

### Step 4: Update Environment Variables
```env
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

## 3. Microsoft OAuth Setup

### Step 1: Register Application
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Click "New registration"
4. Name: "AI Study Circle"
5. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
6. Redirect URI: Web - `http://localhost:5000/api/social/microsoft/callback`

### Step 2: Configure Authentication
1. Go to Authentication in your registered app
2. Add platform "Web"
3. Add redirect URI: `http://localhost:5000/api/social/microsoft/callback`
4. Enable "Access tokens" and "ID tokens" under Implicit grant

### Step 3: Create Client Secret
1. Go to Certificates & secrets
2. Click "New client secret"
3. Description: "AI Study Circle Secret"
4. Expires: 24 months (recommended)
5. Copy the secret value immediately (it won't be shown again)

### Step 4: Get Application ID
1. Go to Overview
2. Copy the "Application (client) ID"

### Step 5: Update Environment Variables
```env
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
```

## 4. Testing Configuration

### Quick Test Setup (Development)
For development and testing, you can use these test credentials:

1. Create a `.env` file in the backend directory
2. Copy the values from `.env.example`
3. Replace the OAuth credentials with your actual values
4. Start the backend: `npm run dev`
5. Start the frontend: `npm start`
6. Visit `http://localhost:3000`

### Security Notes

1. **Never commit OAuth secrets to version control**
2. **Use different credentials for production**
3. **Enable HTTPS in production**
4. **Regularly rotate client secrets**
5. **Monitor OAuth usage in respective developer consoles**

## 5. Production Deployment

### Environment Variables for Production
Update these URLs for production:

```env
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
NODE_ENV=production
```

### OAuth Callback URLs for Production
Update redirect URIs in each OAuth provider:

- Google: `https://api.yourdomain.com/api/social/google/callback`
- Facebook: `https://api.yourdomain.com/api/social/facebook/callback`
- Microsoft: `https://api.yourdomain.com/api/social/microsoft/callback`

## 6. Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure redirect URIs match exactly in OAuth provider settings
   - Check for trailing slashes and protocol (http vs https)

2. **"Invalid client" error**
   - Verify client ID and secret are correct
   - Check that the OAuth app is published/live

3. **CORS errors**
   - Ensure frontend URL is in authorized origins
   - Check CORS configuration in backend

4. **Session issues**
   - Verify SESSION_SECRET is set
   - Check MongoDB connection for session storage

### Logs and Debugging

Enable debug logging:
```env
DEBUG=passport:*
```

Check backend logs for detailed OAuth flow information.

## 7. Features Included

### User Authentication Flow
- Social login buttons on main page
- OAuth callback handling
- Automatic user profile creation
- JWT token generation
- Session management

### Profile Management
- View connected social accounts
- Update profile information
- Manage language preferences
- Account linking/unlinking

### Security Features
- Secure token storage
- Refresh token rotation
- Session timeout handling
- CORS protection
- Rate limiting on auth endpoints

## Support

If you encounter issues:
1. Check the environment variables
2. Verify OAuth provider settings
3. Review backend logs
4. Test OAuth URLs directly

The system will gracefully handle authentication failures and provide helpful error messages.