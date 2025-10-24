"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PaymentDetailsProps {
	paymentMethod: string;
	onChangePaymentMethod: (v: string) => void;
	customerName: string;
	onChangeCustomerName: (v: string) => void;
	customerPhone: string;
	onChangeCustomerPhone: (v: string) => void;
	couponCode: string;
	onChangeCouponCode: (v: string) => void;
	hasAppliedCoupon: boolean;
	onApplyCoupon: () => void;
	onRemoveCoupon: () => void;
}

export function PaymentDetails({
	paymentMethod,
	onChangePaymentMethod,
	customerName,
	onChangeCustomerName,
	customerPhone,
	onChangeCustomerPhone,
	couponCode,
	onChangeCouponCode,
	hasAppliedCoupon,
	onApplyCoupon,
	onRemoveCoupon,
}: PaymentDetailsProps) {
	return (
		<div className="space-y-4">
			<div>
				<label className="text-sm font-medium mb-2 block">Payment Method</label>
				<Select value={paymentMethod} onValueChange={onChangePaymentMethod}>
					<SelectTrigger data-testid="select-payment-method">
						<SelectValue placeholder="Select method" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="cash">Cash</SelectItem>
						<SelectItem value="upi">UPI</SelectItem>
						<SelectItem value="card">Card</SelectItem>
						<SelectItem value="other">Other</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div>
				<label className="text-sm font-medium mb-2 block">Customer Name</label>
				<Input placeholder="Full name" value={customerName} onChange={(e) => onChangeCustomerName(e.target.value)} data-testid="input-customer-name" />
			</div>
			<div>
				<label className="text-sm font-medium mb-2 block">Customer Phone</label>
				<div className="flex items-center border rounded-md overflow-hidden">
					<span className="px-3 text-gray-600 bg-gray-100 border-r">+91</span>
					<Input type="tel" placeholder="WhatsApp number for receipt" value={customerPhone} onChange={(e) => onChangeCustomerPhone(e.target.value)} data-testid="input-customer-phone" className="border-0 focus:ring-0 focus:outline-none flex-1" />
				</div>
			</div>
			<div>
				<label className="text-sm font-medium mb-2 block">Coupon Code</label>
				<div className="flex gap-2">
					<Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => onChangeCouponCode(e.target.value)} disabled={hasAppliedCoupon} />
					{hasAppliedCoupon ? (
						<Button variant="outline" onClick={onRemoveCoupon}>Remove</Button>
					) : (
						<Button variant="outline" onClick={onApplyCoupon}>Apply</Button>
					)}
				</div>
			</div>
		</div>
	);
}


