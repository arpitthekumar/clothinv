"use client";

import React from "react";
import { InvoiceData } from "@/lib/type"; // Your type

interface LabelBillProps {
  data: InvoiceData;
}

const LabelBill = React.forwardRef<HTMLDivElement, LabelBillProps>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="mx-auto bg-white text-black font-sans border border-gray-300 p-2 w-[360px] text-[11px]"
      style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.2" }}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-[14px] font-bold uppercase tracking-tight">
          Bhootia Fabric Collection
        </h1>
        <p className="text-[9px]">Gandhi Nagar, Moti Ganj, Bharthana, U.P</p>
      </div>

      {/* Invoice Info */}
      <div className="flex justify-between text-[10px] border-b border-dotted border-gray-400 pb-1">
        <span><b>Invoice:</b> {data.invoiceNumber}</span>
        <span><b>Date:</b> {data.date.toLocaleDateString()}</span>
      </div>
      <div className="flex justify-between text-[10px] border-b border-dotted border-gray-400 pb-1 mb-2">
        <span><b>Time:</b> {data.date.toLocaleTimeString()}</span>
        {data.customerName && <span><b>Customer:</b> {data.customerName}</span>}
      </div>

      {/* Items Table */}
      <div className="flex justify-between text-[10px] font-bold border-b border-dotted border-gray-400 pb-1 mb-1">
        <span className="w-[120px]">ITEM</span>
        <span className="w-[30px] text-center">QTY</span>
        <span className="w-[50px] text-center">PRICE</span>
        <span className="w-[50px] text-right">TOTAL</span>
      </div>

      {data.items.map((item, idx) => (
        <div
          key={idx}
          className="flex justify-between text-[10px] border-b border-dotted border-gray-300 pb-1"
        >
          <span className="w-[120px] truncate">{item.name}</span>
          <span className="w-[30px] text-center">{item.quantity}</span>
          <span className="w-[50px] text-center">₹{item.price.toFixed(2)}</span>
          <span className="w-[50px] text-right">₹{item.total.toFixed(2)}</span>
        </div>
      ))}

      {/* Totals */}
      <div className="flex justify-between text-[11px] font-bold border-t border-dotted border-gray-400 mt-2 pt-1">
        <span className="w-[120px]">SUBTOTAL</span>
        <span className="text-right">₹{data.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-[11px] border-t border-dotted border-gray-400 pt-1">
        <span className="w-[120px]">TAX</span>
        <span className="text-right">₹{data.tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-[12px] font-bold border-t border-dotted border-gray-400 pt-1">
        <span className="w-[120px]">TOTAL</span>
        <span className="text-right">₹{data.total.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-[10px] border-t border-dotted border-gray-400 pt-1">
        <span className="w-[120px]">PAYMENT</span>
        <span className="text-right">{data.paymentMethod}</span>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] font-bold mt-2">
        <p>THANK YOU</p>
        <p>VISIT AGAIN!</p>
      </div>
    </div>
  );
});

LabelBill.displayName = "LabelBill";
export default LabelBill;
