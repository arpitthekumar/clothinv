"use client";

import React, { useMemo } from "react";
import { SaleData } from "@/lib/type";

function getBarcodeUrl(payload: string): string {
  const value = (payload || "").trim();
  const isEanCandidate = /^\d{12,13}$/.test(value);
  const symbology = isEanCandidate ? "ean13" : "code128";
  return `https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(
    value
  )}&scale=4&includetext=true&guardwhitespace=true&backgroundcolor=ffffff&fmt=svg`;
}

interface LabelBillProps {
  data: SaleData;
  taxPercent?: number;
}

const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(
  ({ data, taxPercent = 18 }, ref) => {
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
        className="p-2 border border-black "
        style={{
          fontFamily: "Arial, sans-serif",
          color: "#000000",
          backgroundColor: "#ffffff",
          
        }}
      >
        {/* HEADER */}
        <h1
          className="text-center font-bold"
          style={{ fontSize: "35px", margin: "0", lineHeight: 1.1 }}
        >
          Bhootia Fabric Collection
        </h1>
        <h2 className="text-center" style={{ fontSize: "18px", margin: 0 }}>
          Gandhi Nagar, Moti Ganj, Bharthana, U.P
        </h2>
        <h2 className="text-center" style={{ fontSize: "15px", margin: 0 }}>
          Ph: 9876543210
        </h2>
        {/* <hr className="border-black my-1" /> */}
        {/* CUSTOMER INFO */}
        <div
          className="flex flex-col mb-1"
          style={{ fontSize: "15px", lineHeight: 1.2 }}
        >
          <div className="flex justify-between">
            <p>
              <strong>Invoice:</strong> {data.invoiceNumber || "N/A"}
            </p>
            <p>
              <strong>Customer:</strong>{" "}
              {data.customerName || "Walk-in Customer"}
            </p>
          </div>
          <div className="flex justify-between">
            <div className="flex">
              <p>
                <strong>Date:</strong>{" "}
                {data.createdAt
                  ? new Date(data.createdAt).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                {" "}
                <strong>Time:</strong>{" "}
                {data.createdAt ? (
                  <span style={{ fontWeight: "" }}>
                    {new Date(data.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <p>
              <strong>Phone:</strong> {data.customerPhone || "N/A"}
            </p>
          </div>
        </div>
        {/* <hr className="border-black my-1" /> */}
        <div style={{ fontSize: "16px" }}>
          {/* Table Header */}
          <div
            className="flex justify-between font-bold pb-3"
            style={{ borderBottom: "1px solid #000", paddingBottom: "2px" }}
          >
            <span style={{ width: "45%" }}>Item</span>
            <span style={{ width: "15%", textAlign: "center" }}>Qty</span>
            <span style={{ width: "20%", textAlign: "right" }}>Price</span>
            <span style={{ width: "20%", textAlign: "right" }}>Amt</span>
          </div>

          {/* Table Rows */}
          {data.items.map((item, idx) => {
            const amount =
              item.price * item.quantity - (item.discount_amount || 0);
            return (
              <div
                key={idx}
                className="flex justify-between"
                style={{
                  fontSize: "15px",
                  // borderBottom: "1px solid #ccc", // replace border-gray-300
                  // padding: "2px 0",
                }}
              >
                <span style={{ width: "45%" }}>{item.name}</span>
                <span style={{ width: "15%", textAlign: "center" }}>
                  {item.quantity}
                </span>
                <span style={{ width: "20%", textAlign: "right" }}>
                  ₹{item.price.toFixed(2)}
                </span>
                <span style={{ width: "20%", textAlign: "right" }}>
                  ₹{amount.toFixed(2)}
                </span>
              </div>
            );
          })}

          <h1 className="pb-2" style={{ fontWeight: "bold", fontSize: "19px",  }}>Total</h1>

          <div
            className="flex justify-between font-bold"
            style={{
              borderTop: "1px solid #000",
              fontSize: "15px",
            }}
          >
            <span style={{ width: "45%" }}>{data.items.length}</span>
            <span style={{ width: "15%", textAlign: "center" }}>
              {data.items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            <span style={{ width: "20%", textAlign: "right" }}></span>
            <span style={{ width: "20%", textAlign: "right" }}>
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* <hr className="border-black my-1" /> */}
        <div style={{ fontSize: "16px", lineHeight: 1.2 }}>
          <div className="flex justify-between">
            <span>Tax ({taxPercent}%):</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between" style={{ color: "#008000" }}>
              <span>Discount:</span>
              <span>-₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* <hr className="border-black my-[2px]" /> */}
          <div
            className="flex justify-between font-bold"
            style={{ fontSize: "18px" }}
          >
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ fontSize: "17px", marginTop: "2px" }}>
          <p className="flex justify-between pb-2">
            <strong>Payment:</strong>
            <span>{data.paymentMethod || "Cash"}</span>
          </p>
        </div>
        <div className="border-t border-black mt-[6px] pt-[6px] flex justify-center">
          <img
            src={barcodeUrl}
            alt="Barcode"
            crossOrigin="anonymous"
            className="w-[450px] h-[100px] object-cover object-bottom overflow-hidden mb-3"
          />
        </div>
        <div
          className="border-t border-black  pb-[12px] text-center"
          style={{ fontSize: "28px", lineHeight: 1 }}
        >
          <p>Thank you, Visit Again</p>
        </div>
      </div>
    );
  }
);

LabelBill.displayName = "LabelBill";
export default LabelBill;
