import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DemoService } from './demo.service';
import { DemoLoginDto, NotifyDemoStatusDto, SendDemoInvoiceDto } from './dto';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  /**
   * Quick login for demo mode (no password required)
   * Returns tokens and sets refresh cookie
   */
  @Post('login')
  @HttpCode(200)
  async demoLogin(
    @Body() dto: DemoLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.demoService.loginAsDemo(dto.type, dto.email, res);
  }

  /**
   * Returns the initial demo data to be loaded into sessionStorage
   * This includes products, contracts, customer info, inventory, etc.
   */
  @Get('initial-data')
  @HttpCode(200)
  getInitialData() {
    return this.demoService.getInitialDemoData();
  }

  /**
   * Generates an invoice PDF and sends it to the provided demo email
   * Does NOT persist anything to the database
   */
  @Post('send-invoice')
  @Auth()
  @HttpCode(200)
  async sendDemoInvoice(@Body() dto: SendDemoInvoiceDto) {
    return this.demoService.generateAndSendInvoice(dto);
  }

  /**
   * Sends an order status change notification to the demo email
   * Does NOT persist anything to the database
   */
  @Post('notify-status')
  @Auth()
  @HttpCode(200)
  async notifyStatusChange(@Body() dto: NotifyDemoStatusDto) {
    return this.demoService.sendStatusNotification(dto);
  }
}
