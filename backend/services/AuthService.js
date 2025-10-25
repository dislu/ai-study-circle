const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthenticationService {
  constructor() {
    this.initializeStrategies();
  }

  initializeStrategies() {
    // JWT Strategy for API authentication
    passport.use(new JwtStrategy({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET
    }, async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }));

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const userData = await this.handleSocialLogin(profile, 'google', {
            accessToken,
            refreshToken
          });
          return done(null, userData);
        } catch (error) {
          return done(error, null);
        }
      }));
    }

    // Facebook Strategy
    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
      passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: '/api/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name', 'picture.type(large)']
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const userData = await this.handleSocialLogin(profile, 'facebook', {
            accessToken,
            refreshToken
          });
          return done(null, userData);
        } catch (error) {
          return done(error, null);
        }
      }));
    }

    // Microsoft Strategy
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      passport.use(new MicrosoftStrategy({
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: '/api/auth/microsoft/callback',
        scope: ['user.read']
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const userData = await this.handleSocialLogin(profile, 'microsoft', {
            accessToken,
            refreshToken
          });
          return done(null, userData);
        } catch (error) {
          return done(error, null);
        }
      }));
    }

    // Serialize/Deserialize user for session
    passport.serializeUser((user, done) => {
      done(null, user._id || user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  async handleSocialLogin(profile, provider, tokens) {
    try {
      // Extract user information from profile
      const email = this.extractEmail(profile);
      const name = this.extractName(profile);
      const picture = this.extractPicture(profile);

      if (!email) {
        throw new Error('No email found in social profile');
      }

      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        // Update existing user with social profile info
        user.socialProfiles = user.socialProfiles || {};
        user.socialProfiles[provider] = {
          id: profile.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          lastLogin: new Date()
        };

        // Update profile picture if not set or from same provider
        if (!user.profilePicture || user.profilePictureProvider === provider) {
          user.profilePicture = picture;
          user.profilePictureProvider = provider;
        }

        // Update name if not set
        if (!user.name && name) {
          user.name = name;
        }

        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        user = new User({
          name: name || 'User',
          email,
          profilePicture: picture,
          profilePictureProvider: provider,
          socialProfiles: {
            [provider]: {
              id: profile.id,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              lastLogin: new Date()
            }
          },
          registrationMethod: provider,
          isEmailVerified: true, // Social accounts are pre-verified
          preferences: {
            language: 'auto',
            notifications: true,
            theme: 'light'
          },
          createdAt: new Date(),
          lastLogin: new Date()
        });

        await user.save();
      }

      return user;
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  extractEmail(profile) {
    if (profile.emails && profile.emails.length > 0) {
      return profile.emails[0].value;
    }
    if (profile._json && profile._json.email) {
      return profile._json.email;
    }
    if (profile.email) {
      return profile.email;
    }
    return null;
  }

  extractName(profile) {
    if (profile.displayName) {
      return profile.displayName;
    }
    if (profile.name) {
      if (typeof profile.name === 'string') {
        return profile.name;
      }
      return `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim();
    }
    if (profile._json && profile._json.name) {
      return profile._json.name;
    }
    return null;
  }

  extractPicture(profile) {
    // Google
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos[0].value;
    }
    // Facebook
    if (profile._json && profile._json.picture && profile._json.picture.data) {
      return profile._json.picture.data.url;
    }
    // Microsoft
    if (profile._json && profile._json.picture) {
      return profile._json.picture;
    }
    return null;
  }

  generateJWT(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        accessToken: this.generateJWT(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture
        }
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select('-socialProfiles.*.accessToken -socialProfiles.*.refreshToken');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
        registrationMethod: user.registrationMethod,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        connectedAccounts: Object.keys(user.socialProfiles || {})
      };
    } catch (error) {
      throw error;
    }
  }

  getAvailableProviders() {
    const providers = [];
    
    if (process.env.GOOGLE_CLIENT_ID) {
      providers.push({
        name: 'google',
        displayName: 'Google',
        color: '#4285f4',
        icon: 'google'
      });
    }

    if (process.env.FACEBOOK_APP_ID) {
      providers.push({
        name: 'facebook',
        displayName: 'Facebook',
        color: '#1877f2',
        icon: 'facebook'
      });
    }

    if (process.env.MICROSOFT_CLIENT_ID) {
      providers.push({
        name: 'microsoft',
        displayName: 'Microsoft',
        color: '#0078d4',
        icon: 'microsoft'
      });
    }

    return providers;
  }
}

module.exports = new AuthenticationService();