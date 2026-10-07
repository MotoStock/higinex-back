import { PDFOptions } from 'puppeteer';

export const INVOICE_TEMPLATE_NAME = 'invoice';
export const INVOICE_TEMPLATE_DIR = 'templates'; // Relative to service or module

export const INVOICE_PDF_OPTIONS: PDFOptions = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  },
};
