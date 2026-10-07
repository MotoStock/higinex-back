import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthCodeType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'crypto';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RequestEmailDto } from './dto/request-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailTokenDto } from './dto/verify-email-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  RefreshJwtPayload,
  UserJwtPayload,
} from './interfaces/jwt-payload.interface';
import { LoginUserResponse } from './interfaces/login-user-response.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly emailVerifyTtlMs = 10 * 60 * 1000;
  private readonly passwordResetTtlMs = 15 * 60 * 1000;
  private readonly resendCooldownMs = 60 * 1000;
  private readonly maxCodesPerHour = 3;
  private readonly maxCodeAttempts = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailService: NotificationsService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    try {
      const { email, password, customer } = registerUserDto;

      const saltRounds = this.configService.get<number>('SALT_ROUNDS')!;
      const isEmailDisabled = this.emailService.isEmailDisabled;

      const data: Prisma.UserCreateInput = {
        email,
        password: await bcrypt.hash(password, saltRounds),
        ...(isEmailDisabled ? { emailVerifiedAt: new Date() } : {}),
        ...(customer && { customer: { create: customer } }),
      };

      const user = await this.prisma.user.create({
        data,
        include: { customer: true },
      });

      if (!isEmailDisabled) {
        await this.sendEmailVerificationLink(user);
      } else {
        this.logger.log(
          `[EMAIL_DISABLED] Usuario ${user.email} registrado y auto-verificado (Servicio de correos temporalmente inactivo).`,
        );
      }

      return {
        message: isEmailDisabled
          ? 'Usuario registrado exitosamente (verificación automática activa debido a servicio de correos temporalmente inactivo).'
          : 'User registered successfully',
      };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'AuthService.register',
        defaultMessage: 'Failed to register user',
      });
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
        include: { customer: true },
      });

      if (!user) throw new BadRequestException('User not found');

      if (user.deletedAt)
        throw new UnauthorizedException('Invalid credentials');

      if (user.isActive === false)
        throw new ForbiddenException('User account is inactive');

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid)
        throw new UnauthorizedException('Invalid credentials - password');

      if (!user.emailVerifiedAt) {
        if (this.emailService.isEmailDisabled) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date() },
          });
          this.logger.log(
            `[EMAIL_DISABLED] Usuario ${user.email} auto-verificado durante login por servicio de correos inactivo.`,
          );
        } else {
          await this.sendEmailVerificationLink(user);
          throw new ForbiddenException(
            'Email not verified. A new verification link has been sent if allowed by cooldown.',
          );
        }
      }

      const { accessToken, refreshToken } = await this.issueTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const loginUserResponse: LoginUserResponse & { refreshToken: string } = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        customer: user.customer || undefined,
        accessToken,
        refreshToken,
      };

      return loginUserResponse;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'AuthService.login',
        defaultMessage: 'Failed to login user',
      });
    }
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');

    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        { secret },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.tokenType !== 'refresh')
      throw new UnauthorizedException('Invalid refresh token');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      omit: { password: true },
    });

    if (!user || user.deletedAt || !user.isActive)
      throw new UnauthorizedException('Invalid refresh token');

    if (!user.emailVerifiedAt)
      throw new UnauthorizedException('Invalid refresh token');

    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async resendEmailVerification(requestEmailDto: RequestEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: requestEmailDto.email },
    });

    if (!user || user.deletedAt || user.isActive === false) return { ok: true };
    if (user.emailVerifiedAt) return { ok: true };

    await this.sendEmailVerificationLink(user);
    return { ok: true };
  }

  async verifyEmailToken(verifyEmailTokenDto: VerifyEmailTokenDto) {
    const { token } = verifyEmailTokenDto;
    const now = new Date();
    const tokenHash = this.hashCode(token);

    const authCode = await this.prisma.authCode.findFirst({
      where: {
        type: AuthCodeType.EMAIL_VERIFY,
        codeHash: tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      include: { user: true },
    });

    if (
      !authCode ||
      authCode.user.deletedAt ||
      authCode.user.isActive === false
    )
      throw new BadRequestException('Invalid token');

    await this.prisma.$transaction(async (tx) => {
      await tx.authCode.update({
        where: { id: authCode.id },
        data: { usedAt: now },
      });

      if (!authCode.user.emailVerifiedAt) {
        await tx.user.update({
          where: { id: authCode.userId },
          data: { emailVerifiedAt: now },
        });
      }
    });

    return { ok: true };
  }

  async requestPasswordReset(requestEmailDto: RequestEmailDto) {
    if (this.emailService.isEmailDisabled) {
      this.logger.warn(
        `[EMAIL_DISABLED] Solicitud de restablecimiento de contraseña para ${requestEmailDto.email} cancelada: servicio de correos inactivo.`,
      );
      throw new BadRequestException(
        'El servicio de envío de correos electrónicos está temporalmente desactivado. Por favor, comunícate con el administrador para recuperar tu cuenta.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: requestEmailDto.email },
    });

    if (!user || user.deletedAt || user.isActive === false) return { ok: true };

    await this.sendPasswordResetCode(user);
    return { ok: true };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt || user.isActive === false)
      throw new BadRequestException('Invalid code');

    const saltRounds = this.configService.get<number>('SALT_ROUNDS')!;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.$transaction(async (tx) => {
      await this.consumeAuthCode(
        tx,
        user.id,
        AuthCodeType.PASSWORD_RESET,
        code,
      );
      await tx.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      });
    });

    return { ok: true };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const saltRounds = this.configService.get<number>('SALT_ROUNDS')!;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    return { message: 'Password updated successfully' };
  }

  private async issueTokens(user: UserJwtPayload) {
    const accessToken = await this.getAccessToken(user);
    const refreshToken = await this.getRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  private async getAccessToken(payload: UserJwtPayload): Promise<string> {
    const { id, email, role } = payload;
    return this.jwtService.signAsync({ id, email, role });
  }

  private async getRefreshToken(userId: string): Promise<string> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');

    return this.jwtService.signAsync<RefreshJwtPayload>(
      { sub: userId, tokenType: 'refresh', jti: randomUUID() },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { secret, expiresIn: expiresIn as any },
    );
  }

  private async sendEmailVerificationLink(user: { id: string; email: string }) {
    const issued = await this.issueAuthValue(
      user.id,
      AuthCodeType.EMAIL_VERIFY,
      this.emailVerifyTtlMs,
      () => this.generateEmailVerificationToken(),
    );

    if (!issued) return;

    const link = this.buildEmailVerificationLink(issued.value);

    await this.emailService.sendEmailVerificationLink({
      email: user.email,
      link,
      expiresInMinutes: Math.ceil(this.emailVerifyTtlMs / 60000),
    });
  }

  private async sendPasswordResetCode(user: { id: string; email: string }) {
    const issued = await this.issueAuthValue(
      user.id,
      AuthCodeType.PASSWORD_RESET,
      this.passwordResetTtlMs,
      () => this.generateAuthCode(),
    );

    if (!issued) return;

    await this.emailService.sendPasswordResetCode({
      email: user.email,
      code: issued.value,
      expiresInMinutes: Math.ceil(this.passwordResetTtlMs / 60000),
    });
  }

  private async issueAuthValue(
    userId: string,
    type: AuthCodeType,
    ttlMs: number,
    generateValue: () => string,
  ) {
    const now = new Date();
    const canSend = await this.canIssueAuthCode(userId, type, now);
    if (!canSend) return null;

    await this.prisma.authCode.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    const value = generateValue();
    const codeHash = this.hashCode(value);
    const expiresAt = new Date(now.getTime() + ttlMs);

    await this.prisma.authCode.create({
      data: {
        userId,
        type,
        codeHash,
        expiresAt,
      },
    });

    return { value, expiresAt };
  }

  private async canIssueAuthCode(
    userId: string,
    type: AuthCodeType,
    now: Date,
  ) {
    const latest = await this.prisma.authCode.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (
      latest &&
      now.getTime() - latest.createdAt.getTime() < this.resendCooldownMs
    ) {
      return false;
    }

    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
    const count = await this.prisma.authCode.count({
      where: {
        userId,
        type,
        createdAt: { gte: windowStart },
      },
    });

    return count < this.maxCodesPerHour;
  }

  private async consumeAuthCode(
    prisma: Prisma.TransactionClient,
    userId: string,
    type: AuthCodeType,
    code: string,
  ) {
    const now = new Date();
    const authCode = await prisma.authCode.findFirst({
      where: {
        userId,
        type,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!authCode) throw new BadRequestException('Invalid code');

    if (authCode.attempts >= this.maxCodeAttempts) {
      await prisma.authCode.update({
        where: { id: authCode.id },
        data: { usedAt: now },
      });
      throw new BadRequestException('Invalid code');
    }

    const codeHash = this.hashCode(code);
    const isMatch = this.hashesMatch(authCode.codeHash, codeHash);

    if (!isMatch) {
      const nextAttempts = authCode.attempts + 1;
      await prisma.authCode.update({
        where: { id: authCode.id },
        data: {
          attempts: nextAttempts,
          ...(nextAttempts >= this.maxCodeAttempts && { usedAt: now }),
        },
      });
      throw new BadRequestException('Invalid code');
    }

    await prisma.authCode.update({
      where: { id: authCode.id },
      data: { usedAt: now },
    });
  }

  private generateAuthCode() {
    return String(randomInt(0, 1000000)).padStart(6, '0');
  }

  private generateEmailVerificationToken() {
    return randomBytes(32).toString('hex');
  }

  private buildEmailVerificationLink(token: string) {
    const rawTemplate = this.configService.get<string>('EMAIL_VERIFY_URL');
    const template = rawTemplate?.trim();

    if (template) {
      if (template.includes('{token}')) {
        return template.replace('{token}', encodeURIComponent(token));
      }

      const separator = template.includes('?') ? '&' : '?';
      return `${template}${separator}token=${encodeURIComponent(token)}`;
    }

    const port = this.configService.get<number>('PORT') ?? 3000;
    return `http://localhost:${port}/api/v1/auth/email/verify?token=${encodeURIComponent(
      token,
    )}`;
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private hashesMatch(stored: string, incoming: string) {
    const storedBuffer = Buffer.from(stored);
    const incomingBuffer = Buffer.from(incoming);
    if (storedBuffer.length !== incomingBuffer.length) return false;
    return timingSafeEqual(storedBuffer, incomingBuffer);
  }
}
