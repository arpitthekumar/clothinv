"use client";

import React, { useMemo } from "react";
import { SaleData } from "@/lib/type";

// ✅ Barcode generator function
function getBarcodeUrl(payload: string): string {
  const value = (payload || "").trim();
  const isEanCandidate = /^\d{12,13}$/.test(value);
  const symbology = isEanCandidate ? "ean13" : "code128";
  return `https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(
    value
  )}&scale=3&includetext=true&backgroundcolor=ffffff&fmt=svg`;
}

interface LabelBillProps {
  data: SaleData;
  taxPercent?: number;
}

const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, taxPercent = 18 }, ref) => {
const createdAt = data.createdAt
  ? new Date(`${data.createdAt}Z`) // ensures UTC interpretation
  : new Date();

    // ✅ Calculate item-level totals properly
    const itemsWithTotals = data.items.map((item) => {
      const itemSubtotal = item.price * item.quantity;
      const itemDiscount = item.discount_amount || 0;
      const itemTaxable = itemSubtotal - itemDiscount;
      const itemTax = (itemTaxable * taxPercent) / 100;
      const itemTotal = itemTaxable + itemTax;
      return { ...item, itemSubtotal, itemDiscount, itemTax, itemTotal };
    });

    // ✅ Grand totals
    const subtotal = itemsWithTotals.reduce((sum, i) => sum + i.itemSubtotal, 0);
    const totalDiscount = itemsWithTotals.reduce((sum, i) => sum + i.itemDiscount, 0);
    const taxAmount = itemsWithTotals.reduce((sum, i) => sum + i.itemTax, 0);
    const total = itemsWithTotals.reduce((sum, i) => sum + i.itemTotal, 0);

    const barcodeUrl = useMemo(
      () => getBarcodeUrl(data.invoiceNumber || "000000"),
      [data.invoiceNumber]
    );

    return (
      <div
        ref={ref}
        style={{
          width: "280px",
          padding: "8px",
          border: "2px solid #000",
          backgroundColor: "#fff",
          fontFamily: "Arial, sans-serif",
          color: "#000",
          fontSize: "14px",
          margin: "0",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "bold" }}>
            Bhootia Fabric Collection
          </h1>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Gandhi Nagar, Moti Ganj, Bharthana, U.P
          </p>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>Ph: 9876543210</p>
        </div>

        <hr style={{ borderColor: "#000", margin: "4px 0" }} />

        {/* CUSTOMER INFO */}
        <div>
          <p>
            <strong>Invoice:</strong> {data.invoiceNumber || "N/A"}
          </p>
          <p>
            <strong>Customer:</strong> {data.customerName || "Walk-in"}
          </p>
          <p>
            <strong>Phone:</strong> {data.customerPhone || "—"}
          </p>
          <p>
            <strong>Date:</strong> {createdAt.toLocaleDateString()}{" "}
            <strong>Time:</strong>{" "}
            {createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <hr style={{ borderColor: "#000", margin: "4px 0" }} />

        {/* ITEMS TABLE */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr>
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Rate</th>
              <th align="right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithTotals.map((item, i) => (
              <tr key={i}>
                <td>{item.name}</td>
                <td align="center">{item.quantity}</td>
                <td align="right">₹{item.price.toFixed(2)}</td>
                <td align="right">₹{item.itemSubtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ borderColor: "#000", margin: "4px 0" }} />

        {/* TOTALS */}
        <div style={{ fontSize: "13px" }}>
          <p>
            <strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}
          </p>
          {totalDiscount > 0 && (
            <p style={{ color: "green" }}>
              <strong>Discount: </strong> -₹{totalDiscount.toFixed(2)}
            </p>
          )}
          <p>
            <strong>Tax ({taxPercent}%):</strong> ₹{taxAmount.toFixed(2)}
          </p>
          <p
            style={{
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Total: ₹{total.toFixed(2)}
          </p>
          <p>
            <strong>Payment:</strong> {data.paymentMethod || "Cash"}
          </p>
        </div>

        {/* BARCODE */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <img
            src={barcodeUrl}
            alt="barcode"
            width={240}
            height={60}
            className="w-[280px] h-[70px] object-cover object-bottom overflow-hidden"
            crossOrigin="anonymous"
          />
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <p style={{ fontSize: "14px", fontWeight: "bold" }}>
            Thank you, Visit Again!
          </p>
        </div>
      </div>
    );
  }
);

LabelBill.displayName = "LabelBill";
export default LabelBill;
