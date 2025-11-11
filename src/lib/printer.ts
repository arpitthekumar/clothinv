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
}

class InvoicePrinter {
  // ✅ Utility for consistent Indian date/time formatting
  private formatIndianDateTime(date: Date) {
    const formattedDate = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let formattedTime = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    formattedTime = formattedTime.replace(/ ?(AM|PM)/i, "").trim();
    return { formattedDate, formattedTime };
  }

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
                <td>${item.quantity}</td>
                <td>₹${Math.round(item.price)}</td>
                <td>₹${Math.round(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-line">Subtotal: ₹${Math.round(
            invoice.subtotal
          )}</div>
          ${
            invoice.discountAmount && invoice.discountAmount > 0
              ? `<div class="total-line" style="color: green;">Discount: -₹${Math.round(
                  invoice.discountAmount
                )}</div>`
              : ""
          }
          <div class="total-line grand-total">Total: ₹${Math.round(
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

  private generateWhatsAppMessage(invoice: InvoiceData): string {
    const { formattedDate, formattedTime } = this.formatIndianDateTime(
      invoice.date
    );
    const itemsList = invoice.items
      .map(
        (item) => `• ${item.name} x${item.quantity} - ₹${item.total.toFixed(2)}`
      )
      .join("\n");

    return `
🧾 *Invoice: ${invoice.invoiceNumber}*
📅 Date: ${formattedDate} | ${formattedTime}

*Items:*
${itemsList}

💰 *Subtotal:* ₹${invoice.subtotal.toFixed(2)}
${
  invoice.discountAmount && invoice.discountAmount > 0
    ? `💰 *Discount:* -₹${invoice.discountAmount.toFixed(2)}\n`
    : ""
}💰 *Total:* ₹${invoice.total.toFixed(2)}

💳 Payment: ${invoice.paymentMethod}

Thank you for shopping with us! 🙏
    `.trim();
  }

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
      printData += `  ${item.quantity} x ₹${Math.round(
        item.price
      )} = ₹${Math.round(item.total)}\n`;
    });
    printData += "--------------------------------\n";
    printData += `Subtotal: ₹${Math.round(invoice.subtotal)}\n`;
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      printData += `Discount: -₹${Math.round(invoice.discountAmount)}\n`;
    }
    printData += BOLD_ON + `TOTAL: ₹${Math.round(invoice.total)}\n` + BOLD_OFF;
    printData += `Payment: ${invoice.paymentMethod}\n\n`;
    printData += CENTER + "Thank you for your business!\n\n";
    printData += CUT;

    return printData;
  }
}

export const invoicePrinter = new InvoicePrinter();
