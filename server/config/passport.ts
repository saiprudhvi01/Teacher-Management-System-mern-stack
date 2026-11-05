import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { dbStore } from '../store/storage';
import { generateToken } from '../middleware/auth';

// Allowed admin emails for Google OAuth
const ALLOWED_ADMIN_EMAILS = [
  'saiprudhvibodempudi11@gmail.com',
  'pavan90303@gmail.com'
];

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  const data = dbStore.getData();
  const user = data.users.find(u => u.id === id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || process.env.APP_URL?.replace(/\/$/, '') + '/api/auth/google/callback' || 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        
        // Check if email is in allowed admin list
        if (!email || !ALLOWED_ADMIN_EMAILS.includes(email)) {
          return done(new Error('Access denied. Only authorized admin emails are allowed.'), undefined);
        }

        const data = dbStore.getData();
        
        // Check if user already exists
        let user = data.users.find(u => u.email.toLowerCase() === email);
        
        if (!user) {
          // Create new admin user
          const newUser = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: profile.displayName || 'Admin User',
            email: email,
            passwordHash: '', // No password needed for OAuth
            role: 'admin',
            phone: '',
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0]
          };
          
          data.users.push(newUser);
          dbStore.save();
          dbStore.logAudit('Google OAuth Admin Created', newUser.name, 'admin', newUser.email, 'Account created via Google OAuth');
          user = newUser;
        } else {
          // Update user if not admin
          if (user.role !== 'admin') {
            user.role = 'admin';
            dbStore.save();
            dbStore.logAudit('Google OAuth Role Updated', user.name, 'admin', user.email, 'Role updated to admin via Google OAuth');
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

export default passport;
