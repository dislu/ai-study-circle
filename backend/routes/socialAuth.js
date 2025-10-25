const express = require('express');
const passport = require('passport');
const AuthService = require('../services/AuthService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize Passport
router.use(passport.initialize());

/**
 * @route   GET /api/auth/providers
 * @desc    Get available social login providers
 * @access  Public
 */
router.get('/providers', (req, res) => {
  try {
    const providers = AuthService.getAvailableProviders();
    
    res.json({
      success: true,
      data: {
        providers,
        count: providers.length
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication providers'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await AuthService.getUserProfile(req.user.id);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const User = require('../models/User');
    
    const updateData = {};
    if (name) updateData.name = name;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -socialProfiles.*.accessToken -socialProfiles.*.refreshToken');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// ==================== GOOGLE AUTHENTICATION ====================

/**
 * @route   GET /api/auth/google
 * @desc    Start Google OAuth flow
 * @access  Public
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = AuthService.generateJWT(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // Redirect to frontend with tokens
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectURL = `${frontendURL}/auth/callback?token=${accessToken}&refresh=${refreshToken}&provider=google`;
      
      res.redirect(redirectURL);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/auth/error?message=Authentication failed`);
    }
  }
);

// ==================== FACEBOOK AUTHENTICATION ====================

/**
 * @route   GET /api/auth/facebook
 * @desc    Start Facebook OAuth flow
 * @access  Public
 */
router.get('/facebook',
  passport.authenticate('facebook', {
    scope: ['email']
  })
);

/**
 * @route   GET /api/auth/facebook/callback
 * @desc    Facebook OAuth callback
 * @access  Public
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = AuthService.generateJWT(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // Redirect to frontend with tokens
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectURL = `${frontendURL}/auth/callback?token=${accessToken}&refresh=${refreshToken}&provider=facebook`;
      
      res.redirect(redirectURL);
    } catch (error) {
      console.error('Facebook callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/auth/error?message=Authentication failed`);
    }
  }
);

// ==================== MICROSOFT AUTHENTICATION ====================

/**
 * @route   GET /api/auth/microsoft
 * @desc    Start Microsoft OAuth flow
 * @access  Public
 */
router.get('/microsoft',
  passport.authenticate('microsoft', {
    scope: ['user.read']
  })
);

/**
 * @route   GET /api/auth/microsoft/callback
 * @desc    Microsoft OAuth callback
 * @access  Public
 */
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = AuthService.generateJWT(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // Redirect to frontend with tokens
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectURL = `${frontendURL}/auth/callback?token=${accessToken}&refresh=${refreshToken}&provider=microsoft`;
      
      res.redirect(redirectURL);
    } catch (error) {
      console.error('Microsoft callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/auth/error?message=Authentication failed`);
    }
  }
);

// ==================== LOGOUT ====================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate tokens on client side)
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Update last login timestamp
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      lastLogin: new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// ==================== ACCOUNT LINKING ====================

/**
 * @route   POST /api/auth/link/:provider
 * @desc    Link social account to existing user
 * @access  Private
 */
router.post('/link/:provider', authenticateToken, (req, res, next) => {
  const provider = req.params.provider;
  
  if (!['google', 'facebook', 'microsoft'].includes(provider)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider'
    });
  }

  // Store user ID in session for linking
  req.session.linkUserId = req.user.id;
  
  passport.authenticate(provider, {
    scope: provider === 'google' ? ['profile', 'email'] : 
           provider === 'facebook' ? ['email'] : ['user.read']
  })(req, res, next);
});

/**
 * @route   DELETE /api/auth/unlink/:provider
 * @desc    Unlink social account from user
 * @access  Private
 */
router.delete('/unlink/:provider', authenticateToken, async (req, res) => {
  try {
    const provider = req.params.provider;
    
    if (!['google', 'facebook', 'microsoft'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider'
      });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    if (!user.socialProfiles || !user.socialProfiles[provider]) {
      return res.status(400).json({
        success: false,
        error: 'Account not linked'
      });
    }

    // Check if user has other login methods
    const hasPassword = !!user.password;
    const hasOtherSocial = Object.keys(user.socialProfiles).filter(p => p !== provider).length > 0;

    if (!hasPassword && !hasOtherSocial) {
      return res.status(400).json({
        success: false,
        error: 'Cannot unlink the only authentication method. Please set a password first.'
      });
    }

    // Remove social profile
    const updateQuery = { $unset: {} };
    updateQuery.$unset[`socialProfiles.${provider}`] = "";

    await User.findByIdAndUpdate(req.user.id, updateQuery);

    res.json({
      success: true,
      message: `${provider} account unlinked successfully`
    });
  } catch (error) {
    console.error('Unlink account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink account'
    });
  }
});

// ==================== EMAIL VERIFICATION ====================

/**
 * @route   POST /api/auth/send-verification
 * @desc    Send email verification
 * @access  Private
 */
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    user.emailVerificationToken = verificationToken;
    await user.save();

    // TODO: Send verification email using nodemailer
    // For now, return the token (in production, this should be sent via email)
    
    res.json({
      success: true,
      message: 'Verification email sent',
      // Remove this in production
      ...(process.env.NODE_ENV === 'development' && { token: verificationToken })
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }
});

/**
 * @route   GET /api/auth/verify/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const User = require('../models/User');

    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Email verification failed'
    });
  }
});

module.exports = router;