export interface SubscriptionPaymentRecord {
  id: string;
  date: string;
  monthsAdded: number;
  amountPaid: number;
  ratePer6Months: number;
  newExpiryDate: string;
  paymentMethod?: string;
  notes?: string;
  renewedBy?: string;
}

export interface StoreSettings {
  id?: string;
  storeName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  tagline: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxPercent: number;
  taxLabel: string;
  taxInclusive?: boolean;
  showSalespersonOnBill?: boolean;
  whatsappTemplate?: string;
  instagram?: string;
  whatsappNumber?: string;
  subscriptionExpiryDate?: string;
  subscriptionRate6Months?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  lastPaymentMonths?: number;
  subscriptionHistory?: SubscriptionPaymentRecord[];
  backupFrequency?: "weekly" | "monthly" | "disabled";
  maxAllowedEmployees?: number; // Super Admin controllable limit (default 3)
  maxAllowedAdmins?: number;    // Super Admin controllable limit (default 2)
}

export const DEFAULT_WHATSAPP_TEMPLATE =
  `🏪 *{store_name}*\n` +
  `🧾 *Invoice:* {invoice_number}\n` +
  `👤 *Customer:* {customer_name}\n` +
  `📅 *Date:* {date} | {time}\n\n` +
  `*Items:*\n` +
  `{items_list}\n\n` +
  `💰 *Subtotal:* ₹{subtotal}\n` +
  `{discount_line}` +
  `{tax_line}` +
  `💳 *Total Paid:* ₹{total} ({payment_method})\n\n` +
  `{footer}`;

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "Bhotiya Fabric Collection",
  address: "Moti Ganj, Bakebar Road, Bharthana",
  phone: "+91 82736 89065",
  email: "",
  gstNumber: "",
  tagline: "Quality Fabrics & Clothing",
  receiptFooter: "Thank you, Visit Again!",
  taxEnabled: false,
  taxPercent: 18,
  taxLabel: "GST",
  taxInclusive: false,
  showSalespersonOnBill: true,
  whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
  instagram: "",
  whatsappNumber: "",
  subscriptionExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  subscriptionRate6Months: 2500,
  lastPaymentAmount: 2500,
  lastPaymentDate: new Date().toISOString(),
  lastPaymentMonths: 6,
  subscriptionHistory: [],
  backupFrequency: "weekly",
  maxAllowedEmployees: 3,
  maxAllowedAdmins: 2,
};

