//#region Path src/components/sales/ReturnModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ReturnModal({
  open,
  setOpen,
  items,
  onUpdateQty,
  onSubmit,
  selectedSale,
  isSubmitting,
}: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Return - {selectedSale?.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((item: any) => (
              <div key={item.productId} className="flex justify-between border rounded p-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{item.price} • Max: {item.maxQuantity}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline"
                          disabled={item.quantity <= 0}
                          onClick={() => onUpdateQty(item.productId, item.quantity - 1)}>
                    -
                  </Button>

                  <span className="w-10 text-center">{item.quantity}</span>

                  <Button size="sm" variant="outline"
                          disabled={item.quantity >= item.maxQuantity}
                          onClick={() => onUpdateQty(item.productId, item.quantity + 1)}>
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Process Return"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
