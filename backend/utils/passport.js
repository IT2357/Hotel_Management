// 📁 backend/utils/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import AppleStrategy from "passport-apple";
import { User } from "../models/User.js";
import GuestProfile from "../models/profiles/GuestProfile.js"; // Adjust paths as needed
import StaffProfile from "../models/profiles/StaffProfile.js";
import ManagerProfile from "../models/profiles/ManagerProfile.js";
import AdminProfile from "../models/profiles/AdminProfile.js";

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            "authProviders.provider": "google",
            "authProviders.providerId": profile.id,
          }).select("+tokenVersion");

          if (!user) {
            const existingUser = await User.findOne({
              email: profile.emails[0].value,
            }).select("+tokenVersion");
            if (existingUser) {
              existingUser.authProviders.push({
                provider: "google",
                providerId: profile.id,
                email: profile.emails[0].value,
              });
              await existingUser.save();
              return done(null, existingUser);
            }

            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              authProviders: [
                {
                  provider: "google",
                  providerId: profile.id,
                  email: profile.emails[0].value,
                },
              ],
              emailVerified: true,
              isApproved: true, // Auto-approve social users (adjust if needed)
              isActive: true,
              role: "guest",
              tokenVersion: 0,
            });
            await user.save();

            await GuestProfile.create({
              userId: user._id,
              preferences: { preferredLanguage: "en" },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn("⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set");
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/facebook/callback`,
        profileFields: ["id", "displayName", "email", "first_name", "last_name"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            "authProviders.provider": "facebook",
            "authProviders.providerId": profile.id,
          }).select("+tokenVersion");

          if (!user) {
            const existingUser = await User.findOne({
              email: profile.emails[0].value,
            }).select("+tokenVersion");
            if (existingUser) {
              existingUser.authProviders.push({
                provider: "facebook",
                providerId: profile.id,
                email: profile.emails[0].value,
              });
              await existingUser.save();
              return done(null, existingUser);
            }

            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              authProviders: [
                {
                  provider: "facebook",
                  providerId: profile.id,
                  email: profile.emails[0].value,
                },
              ],
              emailVerified: true,
              isApproved: true, // Auto-approve social users
              isActive: true,
              role: "guest",
              tokenVersion: 0,
            });
            await user.save();

            await GuestProfile.create({
              userId: user._id,
              preferences: { preferredLanguage: "en" },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn("⚠️  Facebook OAuth not configured - FACEBOOK_APP_ID and FACEBOOK_APP_SECRET not set");
}

// Apple Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        callbackURL: process.env.APPLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          let user = await User.findOne({
            "authProviders.provider": "apple",
            "authProviders.providerId": profile.id,
          }).select("+tokenVersion");

          if (!user) {
            const existingUser = await User.findOne({
              email: profile.email,
            }).select("+tokenVersion");
            if (existingUser) {
              existingUser.authProviders.push({
                provider: "apple",
                providerId: profile.id,
                email: profile.email,
              });
              await existingUser.save();
              return done(null, existingUser);
            }

            user = new User({
              name:
                `${profile.name?.firstName || ""} ${
                  profile.name?.lastName || ""
                }`.trim() || "Apple User",
              email: profile.email,
              authProviders: [
                {
                  provider: "apple",
                  providerId: profile.id,
                  email: profile.email,
                },
              ],
              emailVerified: true,
              isApproved: true,
              isActive: true,
              role: "guest",
              tokenVersion: 0,
            });
            await user.save();

            await GuestProfile.create({
              userId: user._id,
              preferences: { preferredLanguage: "en" },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn("⚠️  Apple OAuth not configured - APPLE_CLIENT_ID and APPLE_PRIVATE_KEY not set");
}

// Serialize/Deserialize user (optional, since JWT is stateless)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id).select("+tokenVersion");
  done(null, user);
});

export default passport;
