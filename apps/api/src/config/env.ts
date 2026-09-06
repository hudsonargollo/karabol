import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL', 'postgresql://karaoke:karaoke@localhost:5432/karaoke'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  internalServiceSecret: required('INTERNAL_SERVICE_SECRET', 'dev-internal-secret-change-me'),
  appEncryptionKey: required('APP_ENCRYPTION_KEY', 'dev-encryption-key-change-me'),
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  // Web-type OAuth client from Google Cloud Console — see /auth/google.
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};
