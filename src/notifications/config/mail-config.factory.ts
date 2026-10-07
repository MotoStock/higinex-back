import { ConfigService } from '@nestjs/config';

function cleanEnv(val: string | undefined): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export const getMailConfig = (configService: ConfigService) => {
  const provider = configService.get<string>('EMAIL_PROVIDER');
  const user = cleanEnv(configService.get<string>('SMTP_USER'));
  const pass = cleanEnv(configService.get<string>('SMTP_PASS'));

  const commonAuth = { user, pass };

  switch (provider) {
    case 'GMAIL':
      return {
        service: 'gmail',
        auth: commonAuth,
        pool: true,
        maxConnections: 1,
        rateLimit: 2,
        tls: {
          rejectUnauthorized: false, // Critical for Render
          servername: 'smtp.gmail.com',
        },
        connectionTimeout: 20000,
      };

    case 'RESEND':
      return {
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: commonAuth,
        tls: {
          rejectUnauthorized: true,
        },
      };

    case 'SENDGRID':
      // SendGrid requires 'apikey' as literal username; password is your API key
      return {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false, // 587 uses STARTTLS
        auth: {
          user: 'apikey',
          pass: cleanEnv(configService.get<string>('SENDGRID_API_KEY')),
        },
        tls: {
          rejectUnauthorized: true,
        },
      };

    case 'SMTP':
    default:
      return {
        host: configService.get<string>('SMTP_HOST'),
        port: configService.get<number>('SMTP_PORT'),
        secure: configService.get<number>('SMTP_PORT') === 465,
        auth: commonAuth,
        tls: {
          rejectUnauthorized: false,
        },
      };
  }
};
