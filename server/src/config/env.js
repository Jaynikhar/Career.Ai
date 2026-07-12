import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/career_prep',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  trialDays: Number(process.env.TRIAL_DAYS || 7),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  enableScheduler: process.env.ENABLE_SCHEDULER === 'true',
  jobIngestCron: process.env.JOB_INGEST_CRON || '0 */6 * * *',
  questionGenCron: process.env.QUESTION_GEN_CRON || '0 3 * * *',
  jobFeedSearchTerm: process.env.JOB_FEED_SEARCH_TERM || '',
  questionBankTargetPerType: Number(process.env.QUESTION_BANK_TARGET_PER_TYPE || 25),
  maxNewQuestionsPerRun: Number(process.env.MAX_NEW_QUESTIONS_PER_RUN || 3),

  // Set RECOGNIZED_COMPANIES=ALL to temporarily disable the company filter
  // entirely (useful for confirming the fetch itself works).
  recognizedCompanies: (process.env.RECOGNIZED_COMPANIES || 'google,amazon,facebook,apple,microsoft')
    .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean),

  jobExpiryDays: Number(process.env.JOB_EXPIRY_DAYS || 7),
  jobExpiryCron: process.env.JOB_EXPIRY_CRON || '0 4 * * *',

  adzunaAppId: process.env.ADZUNA_APP_ID || '',
  adzunaAppKey: process.env.ADZUNA_APP_KEY || '',
  adzunaCountry: process.env.ADZUNA_COUNTRY || 'in'
};