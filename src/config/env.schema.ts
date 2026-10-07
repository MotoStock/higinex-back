import * as Joi from 'joi';

export const envConfigSchema = Joi.object({
  NIT: Joi.string().default('902015844'),

  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .required(),

  PORT: Joi.number().port().required(),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).default(Joi.ref('JWT_SECRET')),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  CORS_ORIGINS: Joi.string().default(''),

  AUTH_REFRESH_COOKIE_NAME: Joi.string().required(),
  AUTH_COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').required(),
  AUTH_COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').required(),

  SALT_ROUNDS: Joi.number().integer().min(8).max(15).required(),

  ADMIN_EMAIL: Joi.string().email().optional().default('admin@higinex.com'),
  ADMIN_PASSWORD: Joi.string().min(8).optional().default('Admin123*'),
  TEST_CLIENT_EMAIL: Joi.string().email().optional().default('cliente-demo@higinex.com'),
  TEST_CLIENT_PASSWORD: Joi.string().min(6).optional().default('demo123'),

  RESERVATION_TTL_MINUTES: Joi.number().integer().min(30).max(240).default(120),
  RESERVATION_CLEANUP_INTERVAL_MINUTES: Joi.number()
    .integer()
    .min(1)
    .max(60)
    .default(10),
  ORDER_TAX_PERCENT: Joi.number().integer().min(0).max(100).default(19),

  EMAIL_PROVIDER: Joi.string()
    .valid('SMTP', 'GMAIL', 'RESEND', 'SENDGRID', 'DISABLED')
    .default('DISABLED'),
  EMAIL_FROM: Joi.string().email().when('EMAIL_PROVIDER', {
    not: 'DISABLED',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  COMPANY_ORDERS_EMAIL: Joi.string().email().when('EMAIL_PROVIDER', {
    not: 'DISABLED',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  SMTP_HOST: Joi.string().when('EMAIL_PROVIDER', {
    is: 'SMTP',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PORT: Joi.number().port().when('EMAIL_PROVIDER', {
    is: 'SMTP',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_USER: Joi.string().when('EMAIL_PROVIDER', {
    is: Joi.valid('SMTP', 'GMAIL', 'RESEND'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASS: Joi.string().when('EMAIL_PROVIDER', {
    is: Joi.valid('SMTP', 'GMAIL', 'RESEND'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SENDGRID_API_KEY: Joi.string().when('EMAIL_PROVIDER', {
    is: 'SENDGRID',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_VERIFY_URL: Joi.string().default('http://localhost:4200/auth/verify?token={token}'),
  FRONTEND_URL: Joi.string().uri().optional(),

  SWAGGER_USER: Joi.string().default('admin'),
  SWAGGER_PASSWORD: Joi.string().default('admin'),
}).unknown(true);
