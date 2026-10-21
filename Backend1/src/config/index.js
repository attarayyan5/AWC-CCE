// src/config/index.js
// Central configuration from environment variables

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://attaraayan2023_db_user:aFTCDFdVh1lPRpO9@ayanscluster.qonsdwc.mongodb.net/AWS_MGT',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    issuer: process.env.JWT_ISSUER || 'aws-club-management',
    audience: process.env.JWT_AUDIENCE || 'aws-club-app',
  },

  refreshToken: {
    expiresInDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS, 10) || 7,
  },

  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  },

  imagekit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
  },

  security: {
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 12,
  },

  studentId: {
    prefix: process.env.STUDENT_ID_PREFIX || 'AWS',
  },
};

export default config;
