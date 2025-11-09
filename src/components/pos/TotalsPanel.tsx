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
				<span data-testid="text-subtotal">₹{Math.round(subtotal)}</span>
			</div>
			{couponDiscount > 0 && (
				<div className="flex justify-between text-green-600">
					<span>Coupon Discount:</span>
					<span>-₹{Math.round(couponDiscount)}</span>
				</div>
			)}
			<div className="flex justify-between text-lg font-bold">
				<span>Total:</span>
				<span data-testid="text-total">₹{Math.round(total)}</span>
			</div>
		</div>
	);
}


