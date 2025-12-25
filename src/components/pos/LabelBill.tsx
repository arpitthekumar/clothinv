"use client";

import React from "react";
import { SaleData } from "@/lib/type";
import BarcodeGenerator from "@/components/shared/barcode-generator";
import { toZonedTime, format } from "date-fns-tz"; // ✅ correct import

interface LabelBillProps {
  data: SaleData;
  discountAmount?: number;
  onBarcode?: (b64: string | null) => void;
}


const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, discountAmount = 0, onBarcode }, ref) => {
    // ✅ Convert UTC → IST safely using date-fns-tz
    const createdAtRaw =
      typeof data.createdAt === "string"
        ? data.createdAt.replace(" ", "T")
        : data.createdAt || new Date();

    // Parse as UTC explicitly
    const utcDate = new Date(createdAtRaw + "Z"); // ensure it's UTC
    const istDate = toZonedTime(utcDate, "Asia/Kolkata");

    // Format for IST (no AM/PM)
    const formattedDate = format(istDate, "dd/MM/yyyy", {
      timeZone: "Asia/Kolkata",
    });

    // 12-hour format without AM/PM
    let hour = istDate.getHours();
    const minute = istDate.getMinutes().toString().padStart(2, "0");
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    const formattedTime = `${hour}:${minute}`;

    // 🧮 Calculate totals

    const subtotalRaw = data.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const billDiscount = Number(discountAmount) || 0;

    const itemsWithTotals = data.items.map((item) => {
      const rate = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      const gross = rate * qty;

      const ratio = subtotalRaw > 0 ? gross / subtotalRaw : 0;
      const itemDiscount = Math.round(billDiscount * ratio);
      const f_amt = gross - itemDiscount;

     

      return {
        ...item,
        itemSubtotal: f_amt,
      };
    });



    const subtotal = Math.round(
      itemsWithTotals.reduce((sum, i) => sum + i.itemSubtotal, 0)
    );

    // 1️⃣ Subtotal BEFORE discount (display only)
    const displaySubtotal = Math.round(
      data.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      )
    );

    // 2️⃣ Discount amount (from DB or prop)
    const displayDiscount = Math.round(
      Number(discountAmount) || 0
    );


    // 3️⃣ Final total (already discounted items)
    const total = Math.round(
      itemsWithTotals.reduce((sum, i) => sum + i.itemSubtotal, 0)
    );


    // ✅ Format as Indian-style currency (₹1,23,456)
    const formatIN = (num: number) =>
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    // 🧾 UI
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
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "bold" }}>
            Bhootiya Fabric Collection
          </h1>
          <p style={{ margin: "2px 0", fontSize: "12px" }}>
            Moti Ganj, Bakebar Road, Bharthana
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
                <td align="center">{formatIN(item.quantity)}</td>
                <td align="right">₹{formatIN(item.price)}</td>
                <td align="right">₹{formatIN(item.itemSubtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ borderColor: "#000", margin: "4px 0" }} />
        {/* TOTALS */}
        <div style={{ fontSize: "13px" }}>
          <p>
            <strong>Subtotal:</strong> ₹{formatIN(displaySubtotal)}
          </p>

          {displayDiscount > 0 && (
            <p style={{ color: "green" }}>
              <strong>Discount:</strong> -₹{formatIN(displayDiscount)}
            </p>
          )}
          <p style={{ fontSize: "16px", fontWeight: "bold" }}>
            Total: ₹{formatIN(total)}
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
            onBase64={(b64) => onBarcode?.(b64)}
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
