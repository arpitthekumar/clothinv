import React from "react";
import { SaleData } from "@/lib/type";

interface LabelBillProps {
  data: SaleData;
  discountPercent?: number; // optional discount %
  taxPercent?: number; // optional tax %
}

const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, discountPercent = 0, taxPercent = 18 }, ref) => {
    // Calculate subtotal
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate discount amount
    const discountAmount = (subtotal * discountPercent) / 100;

    // Calculate tax on subtotal after discount
    const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;

    // Final total
    const total = subtotal - discountAmount + taxAmount;

    return (
      <div
        ref={ref}
        className="p-2 border border-black bg-white text-black w-[380px] font-sans"
      >
        <h1 className="text-lg font-bold text-center">
          Bhootia Fabric Collection
        </h1>
        <h2 className="text-sm text-center">
          Gandhi Nagar, Moti Ganj, Bharthana, U.P
        </h2>
        <p>Invoice: {data.invoiceNumber}</p>
        <p>
          Date:{" "}
          {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "-"}
        </p>

        <div className="mt-2">
          {data.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-between font-bold text-sm">
          <span>Subtotal:</span>
          <span>₹{subtotal}</span>
        </div>

        {discountPercent > 0 && (
          <div className="flex justify-between font-bold text-sm">
            <span>Discount ({discountPercent}%):</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-sm">
          <span>Tax ({taxPercent}%):</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-bold text-lg mt-2 border-t border-black pt-1">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        <p className="mt-2">Payment: {data.paymentMethod}</p>
        <p className="text-center mt-1">THANKS VISIT AGAIN!</p>
      </div>
    );
  }
);

LabelBill.displayName = "LabelBill";
export default LabelBill;
