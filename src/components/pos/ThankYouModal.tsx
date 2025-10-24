"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { InvoiceData, invoicePrinter } from "@/lib/printer";
import { useRef } from "react";
import html2canvas from "html2canvas";

interface ThankYouModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceData: InvoiceData | null;
	customerPhone: string;
}

export function ThankYouModal({ open, onOpenChange, invoiceData, customerPhone }: ThankYouModalProps) {
	const invoiceRef = useRef<HTMLDivElement>(null);

	const handlePrintInvoice = async () => {
		if (!invoiceRef.current) return;

		// Convert invoice div to image
		const canvas = await html2canvas(invoiceRef.current);
		const dataUrl = canvas.toDataURL("image/png");

		// Convert to Blob and File
		const res = await fetch(dataUrl);
		const blob = await res.blob();
		const file = new File([blob], "invoice.png", { type: "image/png" });

		// Use Web Share API for mobile
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Thank you for your purchase!</DialogTitle>
				</DialogHeader>

				{/* Hidden invoice div for image generation */}
				<div ref={invoiceRef} className="p-4 m-2 border border-black bg-white" style={{ width: 300 }}>
					<h2 className="text-lg font-bold">Invoice</h2>
					<p>Customer Phone: {customerPhone}</p>
					{invoiceData && (
						<div className="mt-2">
							{invoiceData.items.map((item, idx) => (
								<div key={idx} className="flex justify-between">
									<span>{item.name}</span>
									<span>₹{item.price}</span>
								</div>
							))}
							<div className="mt-2 font-bold flex justify-between">
								<span>Total:</span>
								<span>₹{invoiceData.total}</span>
							</div>
						</div>
					)}
				</div>

				<div className="space-y-3">
					<p>Payment recorded. You can now print the bill or share it.</p>
					<div className="grid grid-cols-2 gap-2">
						<Button onClick={handlePrintInvoice}>
							<Printer className="mr-2 h-4 w-4" /> Print Bill
						</Button>
						<Button
							variant="outline"
							onClick={async () => {
								if (invoiceData && customerPhone) {
									const phoneNumber = customerPhone.startsWith("+91")
										? customerPhone
										: `+91${customerPhone}`;
									await invoicePrinter.shareViaWhatsApp(invoiceData, phoneNumber);
								}
							}}
						>
							Share via WhatsApp
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
