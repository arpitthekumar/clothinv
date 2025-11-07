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
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
}

class InvoicePrinter {
  async printInvoice(invoice: InvoiceData): Promise<void> {
    try {
      // Use Print.js for printing
      const printContent = this.generatePrintableHTML(invoice);
      
      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Popup blocked - please allow popups for printing");
      }
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
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
          <p><strong>Date:</strong> ${invoice.date.toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${invoice.date.toLocaleTimeString()}</p>
          ${invoice.customerName ? `<p><strong>Customer:</strong> ${invoice.customerName}</p>` : ''}
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
            ${invoice.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-line">Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
          ${invoice.discountAmount && invoice.discountAmount > 0 ? `<div class="total-line" style="color: green;">Discount: -₹${invoice.discountAmount.toFixed(2)}</div>` : ''}
          <div class="total-line grand-total">Total: ₹${invoice.total.toFixed(2)}</div>
          <div class="total-line">Payment Method: ${invoice.paymentMethod}</div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #666;">
          Thank you for your business!
        </div>
      </body>
      </html>
    `;
  }

  async shareViaWhatsApp(invoice: InvoiceData, phoneNumber?: string): Promise<void> {
    const message = this.generateWhatsAppMessage(invoice);
    const encodedMessage = encodeURIComponent(message);
    
    let whatsappUrl;
    if (phoneNumber) {
      // Send to specific number
      whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    } else {
      // Open WhatsApp to choose contact
      whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    }
    
    // Open WhatsApp in new window/tab
    window.open(whatsappUrl, "_blank");
  }

  private generateWhatsAppMessage(invoice: InvoiceData): string {
    const itemsList = invoice.items
      .map(item => `• ${item.name} x${item.quantity} - ₹${item.total.toFixed(2)}`)
      .join('\n');
    
    return `
🧾 *Invoice: ${invoice.invoiceNumber}*
📅 Date: ${invoice.date.toLocaleDateString()}

*Items:*
${itemsList}

💰 *Subtotal:* ₹${invoice.subtotal.toFixed(2)}
${invoice.discountAmount && invoice.discountAmount > 0 ? `💰 *Discount:* -₹${invoice.discountAmount.toFixed(2)}\n` : ''}💰 *Total:* ₹${invoice.total.toFixed(2)}

💳 Payment: ${invoice.paymentMethod}

Thank you for shopping with us! 🙏
    `.trim();
  }

  async printDirectly(invoice: InvoiceData): Promise<void> {
    // For direct printer integration (thermal printers, etc.)
    try {
      if ('serial' in navigator) {
        // Use Web Serial API for direct printer communication
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        
        // Generate thermal printer commands (ESC/POS)
        const printData = this.generateThermalPrintData(invoice);
        await writer.write(encoder.encode(printData));
        
        writer.releaseLock();
        await port.close();
      } else {
        throw new Error("Direct printing not supported");
      }
    } catch (error) {
      console.error("Direct print failed:", error);
      // Fallback to regular printing
      await this.printInvoice(invoice);
    }
  }

  private generateThermalPrintData(invoice: InvoiceData): string {
    // ESC/POS commands for thermal printers
    const ESC = '\x1B';
    const INIT = ESC + '@';
    const CENTER = ESC + 'a1';
    const LEFT = ESC + 'a0';
    const BOLD_ON = ESC + 'E1';
    const BOLD_OFF = ESC + 'E0';
    const CUT = ESC + 'i';
    
    let printData = INIT;
    printData += CENTER + BOLD_ON + 'ShopFlow\n' + BOLD_OFF;
    printData += 'Invoice\n\n';
    printData += LEFT;
    printData += `Invoice: ${invoice.invoiceNumber}\n`;
    printData += `Date: ${invoice.date.toLocaleDateString()}\n`;
    printData += `Time: ${invoice.date.toLocaleTimeString()}\n\n`;
    
    printData += '--------------------------------\n';
    invoice.items.forEach(item => {
      printData += `${item.name}\n`;
      printData += `  ${item.quantity} x ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}\n`;
    });
    printData += '--------------------------------\n';
    
    printData += `Subtotal: ₹${invoice.subtotal.toFixed(2)}\n`;
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      printData += `Discount: -₹${invoice.discountAmount.toFixed(2)}\n`;
    }
    printData += BOLD_ON + `TOTAL: ₹${invoice.total.toFixed(2)}\n` + BOLD_OFF;
    printData += `Payment: ${invoice.paymentMethod}\n\n`;
    
    printData += CENTER + 'Thank you for your business!\n\n';
    printData += CUT;
    
    return printData;
  }
}

export const invoicePrinter = new InvoicePrinter();
