import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import { ORDER_STATUS_LABELS } from './constants/email.constants';
import {
  AuthCodeEmailInput,
  EmailPayload,
  EmailVerificationLinkInput,
  OrderEmailContext,
  OrderNotificationInput,
} from './interfaces/email.types';
import { InvoiceService } from './invoice/invoice.service';

interface SendGridAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: 'attachment' | 'inline';
  content_id?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly companyOrdersEmail: string | null;
  private readonly emailFrom: string;
  private readonly templatesDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly invoiceService: InvoiceService,
  ) {
    this.companyOrdersEmail =
      this.configService.get<string>('COMPANY_ORDERS_EMAIL') ?? null;
    this.emailFrom = this.configService.get<string>('EMAIL_FROM') ?? '';
    this.templatesDir = path.join(
      process.cwd(),
      'dist',
      'notifications',
      'templates',
    );
  }

  get isEmailDisabled(): boolean {
    return this.configService.get<string>('EMAIL_PROVIDER') === 'DISABLED';
  }

  onModuleInit() {
    if (this.isEmailDisabled) {
      this.logger.log(
        '[EMAIL_DISABLED] El proveedor de correos está configurado como DISABLED. No se realizarán envíos de correos electrónicos ni se consumirá SendGrid.',
      );
      return;
    }

    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY is not configured. Emails will fail.');
      return;
    }
    sgMail.setApiKey(apiKey);
    this.logger.log('SendGrid API initialized');
  }

  // ─── PUBLIC METHODS ────────────────────────────────────────────────

  async sendOrderCreatedToCompany(input: OrderNotificationInput) {
    if (this.isEmailDisabled) {
      this.logger.log(
        `[EMAIL_DISABLED] Se omitió el envío de notificación de orden a la empresa para la orden #${input.orderNumber} (Servicio de correos inactivo).`,
      );
      return;
    }
    this.handleSendOrderCreatedToCompany(input).catch((err) =>
      this.logger.error(
        `Failed to send order created email to company: ${err.message}`,
        err.stack,
      ),
    );
  }

  async sendOrderCreatedToCustomer(input: OrderNotificationInput) {
    if (this.isEmailDisabled) {
      this.logger.log(
        `[EMAIL_DISABLED] Se omitió el envío de factura y confirmación a ${input.customer?.email} para la orden #${input.orderNumber} (Servicio de correos inactivo).`,
      );
      return;
    }
    this.handleSendOrderCreatedToCustomer(input).catch((err) =>
      this.logger.error(
        `Failed to send order created email to customer: ${err.message}`,
        err.stack,
      ),
    );
  }

  async sendOrderStatusChangedToCustomer(input: OrderNotificationInput) {
    if (this.isEmailDisabled) {
      this.logger.log(
        `[EMAIL_DISABLED] Se omitió el envío de cambio de estado de orden a ${input.customer?.email} para la orden #${input.orderNumber} (Servicio de correos inactivo).`,
      );
      return;
    }
    this.handleSendOrderStatusChangedToCustomer(input).catch((err) =>
      this.logger.error(
        `Failed to send order status change email: ${err.message}`,
        err.stack,
      ),
    );
  }

  async sendEmailVerificationLink(input: EmailVerificationLinkInput) {
    if (this.isEmailDisabled) {
      this.logger.log(
        `[EMAIL_DISABLED] Se omitió el envío de verificación de correo a ${input.email} (Servicio de correos inactivo).`,
      );
      return;
    }
    this.handleSendEmailVerificationLink(input).catch((err) =>
      this.logger.error(
        `Failed to send email verification link: ${err.message}`,
        err.stack,
      ),
    );
  }

  async sendPasswordResetCode(input: AuthCodeEmailInput) {
    if (this.isEmailDisabled) {
      this.logger.log(
        `[EMAIL_DISABLED] Se omitió el envío de código de recuperación a ${input.email} (Servicio de correos inactivo). Código generado: ${input.code}`,
      );
      return;
    }
    this.handleSendPasswordResetCode(input).catch((err) =>
      this.logger.error(
        `Failed to send password reset code: ${err.message}`,
        err.stack,
      ),
    );
  }

  // ─── PRIVATE HANDLERS ──────────────────────────────────────────────

  private async handleSendOrderCreatedToCompany(input: OrderNotificationInput) {
    if (!this.companyOrdersEmail) {
      this.logger.warn('COMPANY_ORDERS_EMAIL is not configured');
      return;
    }

    const { context, subject } = this.buildOrderContext(
      input,
      `Nuevo pedido ${input.orderNumber}`,
    );

    const companyContext = {
      ...context,
      customer: input.customer,
    };

    await this.sendMail({
      to: this.companyOrdersEmail,
      subject,
      template: 'order-created-company',
      context: companyContext,
    });
  }

  private async handleSendOrderCreatedToCustomer(
    input: OrderNotificationInput,
  ) {
    const { context, subject } = this.buildOrderContext(
      input,
      `Pedido recibido ${input.orderNumber}`,
    );

    const attachments: SendGridAttachment[] = [];
    try {
      const invoiceBuffer = await this.invoiceService.generateInvoice(context);
      attachments.push({
        content: invoiceBuffer.toString('base64'),
        filename: `Factura-${input.orderNumber}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate invoice for order ${input.orderNumber}`,
        error,
      );
    }

    await this.sendMail(
      {
        to: input.customer.email,
        subject,
        template: 'order-created-customer',
        context,
      },
      attachments,
    );
  }

  private async handleSendOrderStatusChangedToCustomer(
    input: OrderNotificationInput,
  ) {
    const { context, subject } = this.buildOrderContext(
      input,
      `Actualización de pedido ${input.orderNumber}`,
    );

    await this.sendMail({
      to: input.customer.email,
      subject,
      template: 'order-status-changed',
      context,
    });
  }

  private async handleSendEmailVerificationLink(
    input: EmailVerificationLinkInput,
  ) {
    await this.sendMail({
      to: input.email,
      subject: 'Verifica tu correo',
      template: 'email-verification',
      context: {
        link: input.link,
        expiresInMinutes: input.expiresInMinutes,
      },
    });
  }

  private async handleSendPasswordResetCode(input: AuthCodeEmailInput) {
    await this.sendMail({
      to: input.email,
      subject: 'Código para restablecer tu contraseña',
      template: 'password-reset',
      context: {
        code: input.code,
        expiresInMinutes: input.expiresInMinutes,
      },
    });
  }

  // ─── CORE EMAIL LOGIC ──────────────────────────────────────────────

  private async sendMail(
    payload: EmailPayload,
    attachments: SendGridAttachment[] = [],
  ) {
    if (this.isEmailDisabled) {
      this.logger.log(
        `[EMAIL_DISABLED] Envío de correo omitido a ${payload.to} [${payload.subject}] (EMAIL_PROVIDER=DISABLED)`,
      );
      return;
    }

    try {
      const logoAttachment = this.getLogoAttachment();
      const allAttachments = logoAttachment
        ? [...attachments, logoAttachment]
        : attachments;

      const contextWithLogo = {
        ...payload.context,
        logoUrl: logoAttachment ? 'cid:logo' : '',
        year: new Date().getFullYear(),
      };

      const htmlContent = await this.compileTemplate(
        payload.template,
        contextWithLogo,
      );

      const msg: sgMail.MailDataRequired = {
        to: payload.to,
        from: this.emailFrom,
        subject: payload.subject,
        html: htmlContent,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent to ${payload.to} [${payload.subject}]`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${payload.to}`, error);
      if (error.response) {
        this.logger.error(
          `SendGrid error body: ${JSON.stringify(error.response.body)}`,
        );
      }
    }
  }

  /**
   * Compiles a Handlebars template from the templates directory.
   */
  private async compileTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateSource);
    return compiledTemplate(context);
  }

  private getLogoAttachment(): SendGridAttachment | null {
    try {
      const logoPath = path.join(
        process.cwd(),
        'dist',
        'notifications',
        'assets',
        'logo.png',
      );
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        return {
          content: logoBuffer.toString('base64'),
          filename: 'logo.png',
          type: 'image/png',
          disposition: 'inline',
          content_id: 'logo',
        };
      }
      this.logger.warn(`Logo not found at: ${logoPath}`);
      return null;
    } catch (error) {
      this.logger.error('Failed to prepare logo attachment', error);
      return null;
    }
  }

  // ─── ORDER CONTEXT BUILDER ─────────────────────────────────────────

  private buildOrderContext(
    input: OrderNotificationInput,
    subject: string,
  ): { context: OrderEmailContext; subject: string } {
    const currency = input.currency ?? 'COP';

    const items = input.items.map((item) => ({
      displayName: this.formatItemName(item.productName, item.variantName),
      quantity: item.quantity,
      unitPriceFormatted: this.formatCurrency(item.unitPrice, currency),
      lineTotalFormatted: this.formatCurrency(item.lineTotal, currency),
      lineTotalValue: this.toNumber(item.lineTotal) ?? 0,
    }));

    const computedSubtotal = items.reduce(
      (sum, item) => sum + item.lineTotalValue,
      0,
    );
    const subtotalValue =
      this.toNumber(input.subtotalAmount) ?? computedSubtotal;
    const taxesValue = this.toNumber(input.taxesAmount) ?? 0;
    const shippingValue = this.toNumber(input.shippingAmount) ?? 0;
    const discountValue = this.toNumber(input.discountAmount) ?? 0;
    const totalValue =
      this.toNumber(input.totalAmount) ??
      subtotalValue + taxesValue + shippingValue - discountValue;

    const context: OrderEmailContext = {
      ...input,
      customerName: input.customer.name,
      createdAtLabel: this.formatDate(input.createdAt),
      statusLabel: this.getStatusLabel(input.status),
      items,
      subtotalFormatted: this.formatCurrency(subtotalValue, currency),
      taxesFormatted: this.formatCurrency(taxesValue, currency),
      shippingFormatted: this.formatCurrency(shippingValue, currency),
      discountFormatted: this.formatCurrency(discountValue, currency),
      totalFormatted: this.formatCurrency(totalValue, currency),
    };

    return { context, subject };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────

  private formatCurrency(value: number | string, currency: string): string {
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) return String(value);

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  }

  private formatDate(date: Date): string {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return String(date);
    }
  }

  private getStatusLabel(status?: string): string {
    if (!status) return 'En proceso';
    return ORDER_STATUS_LABELS[status] ?? status;
  }

  private formatItemName(productName: string, variantName?: string): string {
    if (!variantName || variantName.trim().length === 0) {
      return productName;
    }
    return `${productName} - ${variantName}`;
  }

  private toNumber(value: number | string | undefined | null): number | null {
    if (value === undefined || value === null) return null;
    const numeric = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(numeric) ? numeric : null;
  }
}
