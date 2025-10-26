"use client";
import React, { useEffect, useMemo } from "react";
import { SaleData } from "@/lib/type";

// ✅ Barcode generator helper
function getBarcodeUrl(payload: string): string {
  const value = (payload || "").trim();
  const isEanCandidate = /^\d{12,13}$/.test(value);
  const symbology = isEanCandidate ? "ean13" : "code128";
  return `https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(
    value
  )}&scale=2.5&includetext=true&guardwhitespace=true&fmt=png`;
}


interface LabelBillProps {
  data: SaleData;
  taxPercent?: number;
}

const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, taxPercent = 18 }, ref) => {
    useEffect(() => {
      console.log("🧾 BILL DATA RECEIVED:", data);
    }, [data]);

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalDiscount = data.items.reduce(
      (sum, item) => sum + (item.discount_amount || 0),
      0
    );
    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const total = taxableAmount + taxAmount;

    const barcodeUrl = useMemo(
      () => getBarcodeUrl(data.invoiceNumber || "000000"),
      [data.invoiceNumber]
    );

    return (
      <div
        ref={ref}
        className="p-2 border border-black bg-white text-black w-[210px] font-sans text-[11px]" // ✅ 210px ≈ 58mm
      >
        {/* HEADER */}
        <h1 className="text-base font-bold text-center leading-tight">
          Bhootia Fabric Collection
        </h1>
        <h2 className="text-[10px] text-center leading-tight">
          Gandhi Nagar, Moti Ganj, Bharthana, U.P
        </h2>
        <h2 className="text-[10px] text-center leading-tight">
          Ph: 9876543210
        </h2>

        <div className="border-t border-black my-1" />

        {/* CUSTOMER INFO */}
        <div className="text-[10px] mb-1 leading-tight">
          <p>
            <strong>Invoice:</strong> {data.invoiceNumber || "N/A"}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {data.createdAt ? new Date(data.createdAt).toLocaleString() : "-"}
          </p>
          <p>
            <strong>Customer:</strong>{" "}
            {data.customerName || "Walk-in Customer"}
          </p>
          <p>
            <strong>Phone:</strong> {data.customerPhone || "N/A"}
          </p>
        </div>

        <div className="border-t border-black my-1" />

        {/* ITEMS */}
        <div className="text-[10px]">
          <div className="flex justify-between font-semibold border-b border-black pb-[2px]">
            <span>Item</span>
            <span>Amt</span>
          </div>
          {data.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {item.name} x {item.quantity}
                {item.discount_value ? ` (${item.discount_value}%)` : ""}
              </span>
              <span>
                ₹
                {(
                  item.price * item.quantity -
                  (item.discount_amount || 0)
                ).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-black my-1" />

        {/* BILL SUMMARY */}
        <div className="text-[10px] space-y-[1px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount:</span>
              <span>-₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Tax ({taxPercent}%):</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>

          <div className="border-t border-black my-[2px]" />
          <div className="flex justify-between font-bold text-[12px]">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-[2px] text-[10px]">
          <p>
            <strong>Payment:</strong> {data.paymentMethod || "Cash"}
          </p>
        </div>

        {/* ✅ BARCODE SECTION (58mm width) */}
        <div className="border-t border-black mt-[2px] pt-[2px] flex justify-center">
          <img
            src={barcodeUrl}
            alt="Barcode"
            crossOrigin="anonymous"
            className="w-[190px] h-[50px] object-contain"
          />
        </div>

        {/* FOOTER */}
        <div className="border-t border-black mt-[2px] pt-[2px] text-center text-[9px] leading-tight">
          <p>Thank you for shopping with us!</p>
          <p>Visit Again ❤️</p>
        </div>
      </div>
    );
  }
);

LabelBill.displayName = "LabelBill";
export default LabelBill;
