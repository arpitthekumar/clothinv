export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  invoiceId?: string;
  invoiceNumber: string;
  date?: Date;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  taxPercent?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
}