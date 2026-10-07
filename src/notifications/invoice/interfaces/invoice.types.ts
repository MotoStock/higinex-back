import { OrderEmailContext } from '../../interfaces/email.types';

export type InvoiceData = OrderEmailContext;

export interface InvoiceAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}
