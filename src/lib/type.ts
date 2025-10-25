// src/lib/types.ts

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SaleData {
  id?: string;
  userId?: string; // maps to userId or user_id in DB
  customerId?: string; // maps to customer_id
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string; // payment_method
  invoiceNumber: string; // invoice_number
  createdAt?: string | Date; // created_at
  deleted?: boolean;
  deletedAt?: string | Date; // deleted_at
}
