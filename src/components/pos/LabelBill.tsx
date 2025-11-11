"use client";

import React, { useMemo } from "react";
import { SaleData } from "@/lib/type";
import BarcodeGenerator from "@/components/shared/barcode-generator";

interface LabelBillProps {
  data: SaleData;
  taxPercent?: number;
  discountAmount?: number;
}

const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, taxPercent = 0, discountAmount = 0 }, ref) => {
    // ✅ Convert UTC → IST + shift for correct PM display
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

    const formattedDate = createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // ✅ Get 12-hour format but strip AM/PM manually
    let formattedTime = createdAt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 12-hour
    });

    // Remove AM/PM part
    formattedTime = formattedTime.replace(/ ?(AM|PM)/i, "").trim();

    // ✅ Calculate item-level totals properly (no tax)
    const itemsWithTotals = data.items.map((item) => {
      const itemSubtotal = item.price * item.quantity;
      return { ...item, itemSubtotal };
    });

    const subtotal = Math.round(
      itemsWithTotals.reduce((sum, i) => sum + i.itemSubtotal, 0)
    );

    const totalDiscount =
      discountAmount > 0
        ? Math.round(discountAmount)
        : Math.round(
            itemsWithTotals.reduce(
              (sum, i) => sum + (i.discount_amount || 0),
              0
            )
          );

    const total = subtotal - totalDiscount;

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
            Bhootiya Fabric Collection
          </h1>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Moti Ganj, bakebar road, Bharthana
          </p>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Ph: +91 82736 89065
          </p>
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
            <strong>Date:</strong> {formattedDate} <strong>Time:</strong>{" "}
            {formattedTime}
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
            <strong>Subtotal:</strong> ₹{subtotal}
          </p>
          {totalDiscount > 0 && (
            <p style={{ color: "green" }}>
              <strong>Discount: </strong> -₹{totalDiscount}
            </p>
          )}
          <p style={{ fontSize: "16px", fontWeight: "bold" }}>
            Total: ₹{total}
          </p>
          <p>
            <strong>Payment:</strong> {data.paymentMethod || "Cash"}
          </p>
        </div>

        {/* BARCODE */}
        <div className="flex justify-center">
          <BarcodeGenerator
            value={data.invoiceNumber || "000000"}
            width={2}
            height={60}
            displayValue={true}
            className="max-w-full"
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
