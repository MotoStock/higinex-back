import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RequestEmailDto } from './dto/request-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailTokenDto } from './dto/verify-email-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { ValidatedUserPayload } from './interfaces/validated-user-payload.interface';
import { getCookieValue } from 'src/common/helpers/cookie.helper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Auth('ADMIN')
  @HttpCode(201)
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');

    const { refreshToken, ...body } =
      await this.authService.login(loginUserDto);

    res.cookie(
      this.config.get<string>('AUTH_REFRESH_COOKIE_NAME')!,
      refreshToken,
      this.getRefreshCookieOptions(),
    );

    return body;
  }

  @Post('email/resend')
  @HttpCode(200)
  resendEmailVerification(@Body() requestEmailDto: RequestEmailDto) {
    return this.authService.resendEmailVerification(requestEmailDto);
  }

  @Get('email/verify')
  @HttpCode(200)
  verifyEmail(@Query() verifyEmailTokenDto: VerifyEmailTokenDto) {
    return this.authService.verifyEmailToken(verifyEmailTokenDto);
  }

  @Post('password/forgot')
  @HttpCode(200)
  requestPasswordReset(@Body() requestEmailDto: RequestEmailDto) {
    return this.authService.requestPasswordReset(requestEmailDto);
  }

  @Post('password/reset')
  @HttpCode(200)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('password/change')
  @Auth()
  @HttpCode(200)
  changePassword(
    @CurrentUser() user: ValidatedUserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');

    const refreshToken = getCookieValue(
      req.headers.cookie,
      this.config.get<string>('AUTH_REFRESH_COOKIE_NAME')!,
    );
    const tokens = await this.authService.refresh(refreshToken);

    res.cookie(
      this.config.get<string>('AUTH_REFRESH_COOKIE_NAME')!,
      tokens.refreshToken,
      this.getRefreshCookieOptions(),
    );

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(
      this.config.get<string>('AUTH_REFRESH_COOKIE_NAME')!,
      this.getRefreshCookieOptions(),
    );

    return { ok: true };
  }

  @Get('me')
  @Auth()
  @HttpCode(200)
  me(@CurrentUser() user: ValidatedUserPayload) {
    return user;
  }

  private getRefreshCookieOptions() {
    const sameSite = this.config.get<'lax' | 'strict' | 'none'>(
      'AUTH_COOKIE_SAMESITE',
    );
    const secure =
      this.config.get<boolean>('AUTH_COOKIE_SECURE', false) ||
      this.config.get<string>('NODE_ENV') === 'production';

    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN')!;
    const maxAge = this.parseDuration(expiresIn);

    return {
      httpOnly: true,
      sameSite,
      secure,
      maxAge,
      path: '/',
    } as const;
  }

  private parseDuration(duration: string): number {
    if (!isNaN(Number(duration))) {
      return Number(duration);
    }

    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 7 days if format is invalid
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
