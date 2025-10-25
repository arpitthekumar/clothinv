export type Sale = {
  id: string;
  user_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  items: any; // Array of {productId, quantity, price}
  subtotal: string;
  tax_percent: string;
  tax_amount: string;
  discount_type?: string | null;
  discount_value: string;
  discount_amount: string;
  total_amount: string;
  payment_method: string;
  invoice_number: string;
  deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date | null;
};

export type InsertSale = Omit<Sale, 'id' | 'deleted' | 'deleted_at' | 'created_at'>;