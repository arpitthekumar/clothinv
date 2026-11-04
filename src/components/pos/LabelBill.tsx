"use client";

import React from "react";
import { SaleData } from "@/lib/type";
import BarcodeGenerator from "@/components/shared/barcode-generator";
import { formatISTDateTime } from "@/lib/date-utils";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { type StoreSettings } from "@/types/store-settings";

interface LabelBillProps {
  data: SaleData;
  discountAmount?: number;
  onBarcode?: (b64: string | null) => void;
  storeSettings?: StoreSettings;
}


const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, discountAmount = 0, onBarcode, storeSettings: customStoreSettings }, ref) => {
    const { settings: fetchedSettings } = useStoreSettings();
    const activeSettings = customStoreSettings || fetchedSettings;
    // Format IST date and time safely
    const { formattedDate, formattedTime } = formatISTDateTime(data.createdAt);

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
        (sum, i) => sum + Number(i.price) * Number(i.quantity),
        0
      )
    );

    // 2️⃣ Discount amount (from DB or prop)
    const displayDiscount = Math.round(
      Number(discountAmount) || Number(data.discountAmount) || 0
    );

    const afterDiscount = Math.max(0, displaySubtotal - displayDiscount);

    // 3️⃣ Tax calculation (Strictly use sale's recorded tax, do not force tax on untaxed sales)
    const taxPercent = Number(data.taxPercent || 0);
    const taxAmount = Number(data.taxAmount || 0);

    // 4️⃣ Final total
    const total = data.totalAmount && Number(data.totalAmount) > 0
      ? Math.round(Number(data.totalAmount))
      : Math.round(afterDiscount + taxAmount);


    // ✅ Format as Indian-style currency (₹1,23,456)
    const formatIN = (num: number) =>
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    // Determine if tax is inclusive for THIS sale (historical precedence)
    const isTaxInclusive =
      data.taxInclusive !== undefined
        ? Boolean(data.taxInclusive)
        : (data as any).tax_inclusive !== undefined
        ? Boolean((data as any).tax_inclusive)
        : Boolean(activeSettings.taxInclusive);

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
        <div style={{ textAlign: "center", wordBreak: "break-word", overflowWrap: "break-word" }}>
          <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", lineHeight: 1.2 }}>
            {activeSettings.storeName || "Bhotiya Fabric Collection"}
          </h1>
          {activeSettings.tagline && (
            <p style={{ margin: "2px 0", fontSize: "11px", fontStyle: "italic", lineHeight: 1.2 }}>
              {activeSettings.tagline}
            </p>
          )}
          {activeSettings.address && (
            <p
              style={{
                margin: "2px 0",
                fontSize: "11px",
                lineHeight: 1.2,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {activeSettings.address}
            </p>
          )}
          {activeSettings.phone && (
            <p style={{ margin: "2px 0", fontSize: "12px" }}>
              Ph: {activeSettings.phone}
            </p>
          )}
          {activeSettings.email && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>
              Email: {activeSettings.email}
            </p>
          )}
          {activeSettings.instagram && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>
              Ig: {activeSettings.instagram}
            </p>
          )}
          {activeSettings.whatsappNumber && (
            <p style={{ margin: "2px 0", fontSize: "11px" }}>
              WA: {activeSettings.whatsappNumber}
            </p>
          )}
          {activeSettings.gstNumber && (
            <p style={{ margin: "2px 0", fontSize: "11px", fontWeight: "600" }}>
              GSTIN: {activeSettings.gstNumber}
            </p>
          )}
        </div>

        <hr style={{ borderColor: "#000", margin: "4px 0" }} />

        {/* CUSTOMER INFO */}
        <div style={{ wordBreak: "break-word", fontSize: "13px" }}>
          <p style={{ margin: "1px 0" }}>
            <strong>Invoice:</strong> {data.invoiceNumber || "N/A"}
          </p>
          <p style={{ margin: "1px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <strong>Customer:</strong> {data.customerName || "Walk-in"}
          </p>
          <p style={{ margin: "1px 0" }}>
            <strong>Phone:</strong> {data.customerPhone || "—"}
          </p>
          {activeSettings.showSalespersonOnBill !== false && data.salespersonName && (
            <p style={{ margin: "1px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <strong>Salesperson:</strong> {data.salespersonName}
            </p>
          )}
          <p style={{ margin: "1px 0" }}>
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
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th align="left" style={{ width: "45%" }}>Item</th>
              <th align="center" style={{ width: "15%" }}>Qty</th>
              <th align="right" style={{ width: "20%" }}>Rate</th>
              <th align="right" style={{ width: "20%" }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithTotals.map((item, i) => (
              <tr key={i}>
                <td
                  style={{
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    textOverflow: "ellipsis",
                    wordBreak: "break-word",
                    paddingRight: "4px",
                    lineHeight: "1.2",
                    maxHeight: "2.4em",
                  }}
                >
                  {item.name}
                </td>
                <td align="center" style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>{formatIN(item.quantity)}</td>
                <td align="right" style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>₹{formatIN(item.price)}</td>
                <td align="right" style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>₹{formatIN(item.itemSubtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ borderColor: "#000", margin: "4px 0" }} />
        {/* TOTALS */}
        <div style={{ fontSize: "13px", wordBreak: "break-word" }}>
          <p style={{ margin: "2px 0" }}>
            <strong>Subtotal:</strong> ₹{formatIN(displaySubtotal)}
          </p>

          {displayDiscount > 0 && (
            <p style={{ color: "green", margin: "2px 0" }}>
              <strong>Discount:</strong> -₹{formatIN(displayDiscount)}
            </p>
          )}

          {taxAmount > 0 && (
            <p style={{ margin: "2px 0" }}>
              <strong>
                {activeSettings.taxLabel || "GST"}{taxPercent > 0 ? ` (${taxPercent}%)` : ""}
                {isTaxInclusive ? " (Incl.)" : ""}:
              </strong>{" "}
              {isTaxInclusive ? "" : "+"}₹{formatIN(Math.round(taxAmount))}
            </p>
          )}

          <p style={{ fontSize: "16px", fontWeight: "bold", margin: "4px 0" }}>
            Total: ₹{formatIN(total)}
          </p>
          <p style={{ margin: "2px 0" }}>
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
          <p style={{ fontSize: "13px", fontWeight: "bold" }}>
            {activeSettings.receiptFooter || "Thank you, Visit Again!"}
          </p>
        </div>
      </div>
    );
  }
);

LabelBill.displayName = "LabelBill";
export default LabelBill;
