var GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return cb(null, user);
      }

      // Optional: link to an existing local account with the same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          await user.save();
          return cb(null, user);
        }
      }

      // No existing user — create a new one
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: email,
        avatar: profile.photos?.[0]?.value
        // no password — this account logs in via Google only
      });

      return cb(null, user);
    } catch (error) {
      return cb(error, null);
    }
  }
));

// Required for session-based auth
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err, null);
  }
});

module.exports = passport;