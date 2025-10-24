"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { InvoiceData, invoicePrinter } from "@/lib/printer";

interface ThankYouModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceData: InvoiceData | null;
	customerPhone: string;
}

export function ThankYouModal({ open, onOpenChange, invoiceData, customerPhone }: ThankYouModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Thank you for your purchase!</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<p>Payment recorded. You can now print the bill or share it.</p>
					<div className="grid grid-cols-2 gap-2">
						<Button onClick={async () => { if (invoiceData) await invoicePrinter.printInvoice(invoiceData); }}>
							<Printer className="mr-2 h-4 w-4" /> Print Bill
						</Button>
						<Button
							variant="outline"
							onClick={async () => {
								if (invoiceData && customerPhone) {
									const phoneNumber = customerPhone.startsWith("+91") ? customerPhone : `+91${customerPhone}`;
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


