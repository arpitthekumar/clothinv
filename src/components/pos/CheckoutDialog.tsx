"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CheckoutDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	total: number;
	paymentMethod: string;
	onConfirm: () => void;
}

export function CheckoutDialog({ open, onOpenChange, total, paymentMethod, onConfirm }: CheckoutDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirm Payment</DialogTitle>
				</DialogHeader>
				<p>
					Please confirm the payment of ₹{Math.round(total)} via {paymentMethod.toUpperCase()} is completed.
				</p>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button onClick={onConfirm}>Payment Done</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}


