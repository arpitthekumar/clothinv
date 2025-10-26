"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useRef } from "react";
import html2canvas from "html2canvas";
import LabelBill from "./LabelBill";
import { SaleData } from "@/lib/type";
import { InvoiceData } from "@/lib/printer"; // or wherever your InvoiceData is defined

interface ThankYouModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData | null;
  customerPhone: string;
}

export function ThankYouModal({
  open,
  onOpenChange,
  invoiceData,
  customerPhone,
}: ThankYouModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrintInvoice = async () => {
    if (!invoiceRef.current) return;

    const canvas = await html2canvas(invoiceRef.current);
    const dataUrl = canvas.toDataURL("image/png");

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "invoice.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator
        .share({
          files: [file],
          title: "Invoice",
          text: "Thank you for your purchase!",
        })
        .then(() => console.log("Shared successfully"))
        .catch((err) => console.error("Share failed:", err));
    } else {
      alert("Sharing not supported on this device");
    }
  };

  // Convert InvoiceData to SaleData for LabelBill
  // Convert InvoiceData to SaleData for LabelBill
  // Convert InvoiceData to SaleData for LabelBill
  const saleData: SaleData | null = invoiceData
    ? {
        items: (invoiceData.items ?? []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          discount_value: item.discountValue || item.discount_value || 0, // percent
          discount_amount: item.discountAmount || item.discount_amount || 0, // actual ₹ discount
        })),
        totalAmount: invoiceData.total ?? 0,
        paymentMethod: invoiceData.paymentMethod ?? "Cash",
        invoiceNumber: invoiceData.invoiceNumber ?? "N/A",
        createdAt: invoiceData.date ?? new Date().toISOString(),
        customerName: invoiceData.customerName || "Walk-in Customer",
        customerPhone: customerPhone || "N/A",
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thank you for your purchase!</DialogTitle>
        </DialogHeader>

        {/* Hidden LabelBill div for image generation */}
        <div ref={invoiceRef} className="p-2 m-2 border border-black bg-white">
          {saleData && <LabelBill data={saleData} />}
        </div>

        <div className="space-y-3 mt-4">
          <p>Payment recorded. You can now print the bill or share it.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handlePrintInvoice}>
              <Printer className="mr-2 h-4 w-4" /> Print Bill
            </Button>
            {/* <Button
              variant="outline"
              onClick={async () => {
                if (invoiceData && customerPhone) {
                  const phoneNumber = customerPhone.startsWith("+91")
                    ? customerPhone
                    : `+91${customerPhone}`;
                  await invoicePrinter.shareViaWhatsApp(
                    invoiceData,
                    phoneNumber
                  ); // Use InvoiceData here
                }
              }}
            >
              Share via WhatsApp
            </Button> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
