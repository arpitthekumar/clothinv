"use client";

interface TotalsPanelProps {
	subtotal: number;
	couponDiscount: number;
	tax: number;
	total: number;
}

export function TotalsPanel({ subtotal, couponDiscount, tax, total }: TotalsPanelProps) {
	return (
		<div className="space-y-2">
			<div className="flex justify-between">
				<span>Subtotal:</span>
				<span data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
			</div>
			{couponDiscount > 0 && (
				<div className="flex justify-between text-green-600">
					<span>Coupon Discount:</span>
					<span>-₹{couponDiscount.toFixed(2)}</span>
				</div>
			)}
			<div className="flex justify-between">
				<span>GST (18%):</span>
				<span data-testid="text-tax">₹{tax.toFixed(2)}</span>
			</div>
			<div className="flex justify-between text-lg font-bold">
				<span>Total:</span>
				<span data-testid="text-total">₹{total.toFixed(2)}</span>
			</div>
		</div>
	);
}


