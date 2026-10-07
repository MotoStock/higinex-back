
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetFinancePaymentsQueryDto } from './dto/get-payments.dto';
import { GetFinanceRefundsQueryDto } from './dto/get-refunds.dto';
import { GetFinanceReportQueryDto } from './dto/get-report.dto';
import { GetFinanceSummaryQueryDto } from './dto/get-summary.dto';
import { FinanceService } from './finance.service';

@Controller('finance')
@Auth(Role.ADMIN)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  @Get('payments')
  getPayments(@Query() query: GetFinancePaymentsQueryDto) {
    return this.financeService.getPayments(query);
  }

  @Get('refunds')
  getRefunds(@Query() query: GetFinanceRefundsQueryDto) {
    return this.financeService.getRefunds(query);
  }

  @Get('summary')
  getSummary(@Query() query: GetFinanceSummaryQueryDto) {
    return this.financeService.getSummary(query);
  }

  @Get('invoices/:orderId')
  async getInvoice(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.financeService.generateInvoicePdf(orderId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename = invoice - ${orderId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('report')
  async getReport(
    @Query() query: GetFinanceReportQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.financeService.generateReport(query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename = ${filename} `,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
