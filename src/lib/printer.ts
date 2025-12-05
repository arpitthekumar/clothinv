// Invoice printing and WhatsApp sharing functionality
export interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  customerName?: string;
  customerPhone?: string;
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
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  discount_amount?: number;  
}

class InvoicePrinter {
  // ✅ Unified IST formatter (no AM/PM, converts UTC → IST)
  private formatIndianDateTime(date: Date) {
    // Convert UTC → IST
    const utcDate = new Date(date.toString().replace(" ", "T") + "Z");
    const istDate = new Date(
      utcDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    // Format date in dd/mm/yyyy
    const formattedDate = istDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Format 12-hour time manually without AM/PM
    let hours = istDate.getHours();
    const minutes = istDate.getMinutes().toString().padStart(2, "0");

    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    const formattedTime = `${hours}:${minutes}`;
    return { formattedDate, formattedTime };
  }

  // ✅ Helper: Format numbers as Indian currency
  private formatCurrency(value: number, withDecimals = true): string {
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits:  0,
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
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
          <h1>ShopFlow</h1>
          <h2>Invoice</h2>
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
          <div class="total-line grand-total">Total: ₹${this.formatCurrency(
            invoice.total
          )}</div>
          <div class="total-line">Payment Method: ${invoice.paymentMethod}</div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #666;">
          Thank you for your business!
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

  // 🧾 Generate WhatsApp message text
  private generateWhatsAppMessage(invoice: InvoiceData): string {
    const { formattedDate, formattedTime } = this.formatIndianDateTime(
      invoice.date
    );
    const itemsList = invoice.items
      .map(
        (item) =>
          `• ${item.name} x${this.formatCurrency(item.quantity, false)} - ₹${this.formatCurrency(
            item.total
          )}`
      )
      .join("\n");

    return `
🧾 *Invoice: ${invoice.invoiceNumber}*
📅 Date: ${formattedDate} | ${formattedTime}

*Items:*
${itemsList}

💰 *Subtotal:* ₹${this.formatCurrency(invoice.subtotal)}
${
  invoice.discountAmount && invoice.discountAmount > 0
    ? `💰 *Discount:* -₹${this.formatCurrency(invoice.discountAmount)}\n`
    : ""
}💰 *Total:* ₹${this.formatCurrency(invoice.total)}

💳 Payment: ${invoice.paymentMethod}

Thank you for shopping with us! 🙏
    `.trim();
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
    printData += CENTER + BOLD_ON + "ShopFlow\n" + BOLD_OFF;
    printData += "Invoice\n\n";
    printData += LEFT;
    printData += `Invoice: ${invoice.invoiceNumber}\n`;
    printData += `Date: ${formattedDate}\n`;
    printData += `Time: ${formattedTime}\n\n`;
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
    printData +=
      BOLD_ON + `TOTAL: ₹${this.formatCurrency(invoice.total)}\n` + BOLD_OFF;
    printData += `Payment: ${invoice.paymentMethod}\n\n`;
    printData += CENTER + "Thank you for your business!\n\n";
    printData += CUT;

    return printData;
  }
}

export const invoicePrinter = new InvoicePrinter();
