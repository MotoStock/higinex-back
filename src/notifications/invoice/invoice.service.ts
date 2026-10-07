import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';
import puppeteer from 'puppeteer';
import {
  INVOICE_PDF_OPTIONS,
  INVOICE_TEMPLATE_DIR,
  INVOICE_TEMPLATE_NAME,
} from './constants/invoice.constants';
import { InvoiceData } from './interfaces/invoice.types';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  async generateInvoice(data: InvoiceData): Promise<Buffer> {
    try {
      const templatePath = this.getTemplatePath();
      const logoBase64 = this.getLogoBase64();
      const contextWithLogo = { ...data, logoUrl: logoBase64 };

      const htmlContent = this.compileTemplate(templatePath, contextWithLogo);
      return await this.createPdf(htmlContent);
    } catch (error) {
      this.logger.error('Error generating invoice PDF', error);
      throw new InternalServerErrorException('Failed to generate invoice PDF');
    }
  }

  private getLogoBase64(): string {
    const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const bitmap = fs.readFileSync(logoPath);
      return `data:image/png;base64,${bitmap.toString('base64')}`;
    }
    return '';
  }

  private getTemplatePath(): string {
    const templatePath = path.join(
      __dirname,
      INVOICE_TEMPLATE_DIR,
      `${INVOICE_TEMPLATE_NAME}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      this.logger.error(`Invoice template not found at path: ${templatePath}`);
      throw new Error(`Template not found: ${templatePath}`);
    }

    return templatePath;
  }

  private compileTemplate(templatePath: string, data: InvoiceData): string {
    try {
      const templateHtml = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateHtml);
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error('Error compiling Handlebars template', error);
      throw error;
    }
  }

  private async createPdf(htmlContent: string): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        }),
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        // waitUntil: 'networkidle0',
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const pdfBuffer = await page.pdf(INVOICE_PDF_OPTIONS);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Puppeteer error during PDF creation', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
