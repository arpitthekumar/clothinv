// src/lib/types.ts

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  discountPercent?: number; // <-- add this
  total?: number; // optional, if you have it
  discount_value?: number; // percentage discount
  discount_amount?: number; // actual amount discount
}

export interface SaleData {
  id?: string;
  userId?: string; // maps to userId or user_id in DB
  customerId?: string; // maps to customer_id
  customerName: string; // customer_name
  customerPhone: string; // customer_phone
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string; // payment_method
  invoiceNumber: string; // invoice_number
  createdAt?: string | Date; // created_at
  deleted?: boolean;
  deletedAt?: string | Date; // deleted_at
}

export interface InvoiceData {
  items: any[];

  invoiceNumber: string;
  paymentMethod: string;
  total: number; // probably exists instead of totalAmount
  date: string; // probably exists instead of createdAt
  // other fields...
}
