"use client";

import React, { useMemo } from "react";
import { SaleData } from "@/lib/type";
import BarcodeGenerator from "@/components/shared/barcode-generator";

// ✅ Barcode generator function
// function getBarcodeUrl(payload: string): string {
//   const value = (payload || "").trim();
//   const isEanCandidate = /^\d{12,13}$/.test(value);
//   const symbology = isEanCandidate ? "ean13" : "code128";
//   return `https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(
//     value
//   )}&scale=3&includetext=true&backgroundcolor=ffffff&fmt=svg`;
// }

interface LabelBillProps {
  data: SaleData;
  taxPercent?: number;
  discountAmount?: number; // Sale-level discount (coupon discount)
}

const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, taxPercent = 0, discountAmount = 0 }, ref) => {
    const createdAt = data.createdAt
      ? new Date(`${data.createdAt}Z`) // ensures UTC interpretation
      : new Date();

    // ✅ Calculate item-level totals properly (no tax)
    const itemsWithTotals = data.items.map((item) => {
      const itemSubtotal = item.price * item.quantity;
      const itemTotal = itemSubtotal;
      return { ...item, itemSubtotal, itemTotal };
    });

    // ✅ Grand totals (no tax)
    const subtotal = Math.round(itemsWithTotals.reduce(
      (sum, i) => sum + i.itemSubtotal,
      0
    ) * 100) / 100;
    // Use sale-level discount if provided, otherwise calculate from items
    const totalDiscount = discountAmount > 0 
      ? Math.round(discountAmount * 100) / 100
      : Math.round(itemsWithTotals.reduce(
          (sum, i) => sum + (i.discount_amount || 0),
          0
        ) * 100) / 100;
    const taxAmount = 0;
    const total = Math.round((subtotal - totalDiscount + taxAmount) * 100) / 100;

    // const barcodeUrl = useMemo(
    //   () => getBarcodeUrl(data.invoiceNumber || "000000"),
    //   [data.invoiceNumber]
    // );

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
                <td align="right">₹{Math.round(item.price * 100) / 100}</td>
                <td align="right">₹{Math.round(item.itemSubtotal * 100) / 100}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ borderColor: "#000", margin: "4px 0" }} />

        {/* TOTALS */}
        <div style={{ fontSize: "13px" }}>
          <p>
            <strong>Subtotal:</strong> ₹{Math.round(subtotal)}
          </p>
          {totalDiscount > 0 && (
            <p style={{ color: "green" }}>
              <strong>Discount: </strong> -₹{Math.round(totalDiscount)}
            </p>
          )}
          <p
            style={{
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Total: ₹{Math.round(total)}
          </p>
          <p>
            <strong>Payment:</strong> {data.paymentMethod || "Cash"}
          </p>
        </div>

        {/* BARCODE */}
        {/* BARCODE */}
        <div className="flex justify-center ">
          <BarcodeGenerator
            value={data.invoiceNumber || "000000"}
            width={2} // line width
            height={60} // taller barcode
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
