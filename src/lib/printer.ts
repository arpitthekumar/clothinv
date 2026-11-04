import { formatISTDateTime } from "./date-utils";
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/types/store-settings";

// Invoice printing and WhatsApp sharing functionality
export interface InvoiceData {
  invoiceNumber: string;
  date: Date | string | number;
  customerName?: string;
  customerPhone?: string;
  salespersonName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  taxPercent?: number;
  taxInclusive?: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  discount_amount?: number;  
  storeSettings?: {
    storeName?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstNumber?: string;
    tagline?: string;
    receiptFooter?: string;
    taxLabel?: string;
    taxInclusive?: boolean;
    showSalespersonOnBill?: boolean;
    whatsappTemplate?: string;
    instagram?: string;
    whatsappNumber?: string;
  };
}

class InvoicePrinter {
  // ✅ Unified IST formatter (handles Date, ISO string, timestamps safely)
  public formatIndianDateTime(dateInput?: Date | string | number) {
    return formatISTDateTime(dateInput);
  }

  // ✅ Helper: Format numbers as Indian currency
  private formatCurrency(value: number, withDecimals = true): string {
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // 🖨 Print invoice in popup
  async printInvoice(invoice: InvoiceData): Promise<void> {
    try {
      const printContent = this.generatePrintableHTML(invoice);
      const printWindow = window.open("", "_blank");
      if (!printWindow)
        throw new Error("Popup blocked - please allow popups for printing");

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (error) {
      console.error("Print failed:", error);
      throw new Error("Failed to print invoice");
    }
  }

  // 🧾 Generate printable HTML (for normal printer)
  private generatePrintableHTML(invoice: InvoiceData): string {
    const { formattedDate, formattedTime } = this.formatIndianDateTime(
      invoice.date
    );
    const store = invoice.storeSettings;
    const storeName = store?.storeName || "";
    const address = store?.address || "";
    const phone = store?.phone || "";
    const email = store?.email;
    const instagram = store?.instagram;
    const whatsappNumber = store?.whatsappNumber;
    const tagline = store?.tagline || "Quality Fabrics & Clothing";
    const footer = store?.receiptFooter || "Thank you for your business!";
    const gst = store?.gstNumber;

    const isInclusive = invoice.taxInclusive !== undefined ? invoice.taxInclusive : Boolean(store?.taxInclusive);

    const contactParts = [`Ph: ${phone}`];
    if (email) contactParts.push(`Email: ${email}`);
    if (instagram) contactParts.push(`Ig: ${instagram}`);
    if (whatsappNumber) contactParts.push(`WA: ${whatsappNumber}`);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 2px 0; font-size: 13px; color: #444; }
          .invoice-details { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .totals { text-align: right; margin-top: 20px; }
          .total-line { margin: 5px 0; }
          .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 5px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${storeName}</h1>
          ${tagline ? `<p><em>${tagline}</em></p>` : ""}
          <p>${address}</p>
          <p>${contactParts.join(" | ")}</p>
          ${gst ? `<p>GSTIN: ${gst}</p>` : ""}
          <h2>Tax Invoice</h2>
        </div>

        <div class="invoice-details">
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          ${
            invoice.customerName
              ? `<p><strong>Customer:</strong> ${invoice.customerName}</p>`
              : ""
          }
          ${
            (store?.showSalespersonOnBill !== false && invoice.salespersonName)
              ? `<p><strong>Sales Person:</strong> ${invoice.salespersonName}</p>`
              : ""
          }
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${this.formatCurrency(item.quantity, false)}</td>
                <td>₹${this.formatCurrency(item.price)}</td>
                <td>₹${this.formatCurrency(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-line">Subtotal: ₹${this.formatCurrency(
            invoice.subtotal
          )}</div>
          ${
            invoice.discountAmount && invoice.discountAmount > 0
              ? `<div class="total-line" style="color: green;">Discount: -₹${this.formatCurrency(
                  invoice.discountAmount
                )}</div>`
              : ""
          }
          ${
            invoice.tax && invoice.tax > 0
              ? `<div class="total-line">${store?.taxLabel || "GST"} ${invoice.taxPercent ? `(${invoice.taxPercent}%)` : ""}${isInclusive ? " (Incl.)" : ""}: ${isInclusive ? "" : "+"}₹${this.formatCurrency(
                  invoice.tax
                )}</div>`
              : ""
          }
          <div class="total-line grand-total">Total: ₹${this.formatCurrency(
            invoice.total
          )}</div>
          <div class="total-line">Payment Method: ${invoice.paymentMethod}</div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #444; font-weight: bold;">
          ${footer}
        </div>
      </body>
      </html>
    `;
  }

  // 💬 Share invoice via WhatsApp
  async shareViaWhatsApp(
    invoice: InvoiceData,
    phoneNumber?: string
  ): Promise<void> {
    const message = this.generateWhatsAppMessage(invoice);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  }

  // 🧾 Generate WhatsApp message text (Public so POS modal can use it)
  public generateWhatsAppMessage(invoice: InvoiceData): string {
    const { formattedDate, formattedTime } = this.formatIndianDateTime(
      invoice.date
    );
    const store = invoice.storeSettings;
    const storeName = store?.storeName || "";
    const customer = invoice.customerName || "Walk-in Customer";
    const footer = store?.receiptFooter || "Thank you, Visit Again!";
    const taxLabel = store?.taxLabel || "GST";
    const isInclusive = invoice.taxInclusive !== undefined ? invoice.taxInclusive : Boolean(store?.taxInclusive);

    const itemsList = (invoice.items || [])
      .map(
        (item) =>
          `• ${item.name} x${this.formatCurrency(item.quantity, false)} - ₹${this.formatCurrency(
            item.total
          )}`
      )
      .join("\n");

    const discountLine =
      invoice.discountAmount && invoice.discountAmount > 0
        ? `💰 *Discount:* -₹${this.formatCurrency(invoice.discountAmount)}\n`
        : "";

    const taxLine =
      invoice.tax && invoice.tax > 0
        ? `💰 *${taxLabel} ${invoice.taxPercent ? `(${invoice.taxPercent}%)` : ""}${isInclusive ? " (Incl.)" : ""}:* ${isInclusive ? "" : "+"}₹${this.formatCurrency(invoice.tax)}\n`
        : "";

    const template = store?.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;

    return template
      .replace(/\{store_name\}/g, storeName)
      .replace(/\{invoice_number\}/g, invoice.invoiceNumber || "N/A")
      .replace(/\{customer_name\}/g, customer)
      .replace(/\{date\}/g, formattedDate)
      .replace(/\{time\}/g, formattedTime)
      .replace(/\{items_list\}/g, itemsList)
      .replace(/\{subtotal\}/g, this.formatCurrency(invoice.subtotal))
      .replace(/\{discount_line\}/g, discountLine)
      .replace(/\{tax_line\}/g, taxLine)
      .replace(/\{total\}/g, this.formatCurrency(invoice.total))
      .replace(/\{payment_method\}/g, invoice.paymentMethod || "Cash")
      .replace(/\{footer\}/g, footer)
      .replace(/\{salesperson_name\}/g, (store?.showSalespersonOnBill !== false && invoice.salespersonName) ? invoice.salespersonName : "")
      .replace(/\{email\}/g, store?.email || "")
      .replace(/\{instagram\}/g, store?.instagram || "")
      .replace(/\{whatsapp_number\}/g, store?.whatsappNumber || "")
      .trim();
  }

  // 🖨 Thermal printer output
  async printDirectly(invoice: InvoiceData): Promise<void> {
    try {
      if ("serial" in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        const printData = this.generateThermalPrintData(invoice);
        await writer.write(encoder.encode(printData));
        writer.releaseLock();
        await port.close();
      } else {
        throw new Error("Direct printing not supported");
      }
    } catch (error) {
      console.error("Direct print failed:", error);
      await this.printInvoice(invoice);
    }
  }

  // 🧾 Thermal printer layout
  private generateThermalPrintData(invoice: InvoiceData): string {
    const { formattedDate, formattedTime } = this.formatIndianDateTime(
      invoice.date
    );
    const ESC = "\x1B";
    const INIT = ESC + "@";
    const CENTER = ESC + "a1";
    const LEFT = ESC + "a0";
    const BOLD_ON = ESC + "E1";
    const BOLD_OFF = ESC + "E0";
    const CUT = ESC + "i";

    let printData = INIT;
    printData += CENTER + BOLD_ON + "wtscloth\n" + BOLD_OFF;
    printData += "Invoice\n\n";
    printData += LEFT;
    printData += `Invoice: ${invoice.invoiceNumber}\n`;
    printData += `Date: ${formattedDate}\n`;
    printData += `Time: ${formattedTime}\n`;
    if (invoice.storeSettings?.showSalespersonOnBill !== false && invoice.salespersonName) {
      printData += `Salesperson: ${invoice.salespersonName}\n`;
    }
    printData += "\n";
    printData += "--------------------------------\n";
    invoice.items.forEach((item) => {
      printData += `${item.name}\n`;
      printData += `  ${this.formatCurrency(item.quantity, false)} x ₹${this.formatCurrency(
        item.price
      )} = ₹${this.formatCurrency(item.total)}\n`;
    });
    printData += "--------------------------------\n";
    printData += `Subtotal: ₹${this.formatCurrency(invoice.subtotal)}\n`;
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      printData += `Discount: -₹${this.formatCurrency(invoice.discountAmount)}\n`;
    }
    if (invoice.tax && invoice.tax > 0) {
      printData += `GST ${invoice.taxPercent ? `(${invoice.taxPercent}%)` : ""}: +₹${this.formatCurrency(invoice.tax)}\n`;
    }
    printData +=
      BOLD_ON + `TOTAL: ₹${this.formatCurrency(invoice.total)}\n` + BOLD_OFF;
    printData += `Payment: ${invoice.paymentMethod}\n\n`;
    printData += CENTER + "Thank you for your business!\n\n";
    printData += CUT;

    return printData;
  }
}

export const invoicePrinter = new InvoicePrinter();
