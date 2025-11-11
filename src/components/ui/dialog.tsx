"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ✅ Helper type guard to check component displayName safely
function isNamedElement(
  element: React.ReactNode,
  name: string
): element is React.ReactElement {
  return (
    React.isValidElement(element) &&
    typeof element.type !== "string" &&
    (element.type as any).displayName === name
  );
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const headerChildren = React.Children.toArray(children).filter((child) =>
    isNamedElement(child, "DialogHeader")
  );
  const footerChildren = React.Children.toArray(children).filter((child) =>
    isNamedElement(child, "DialogFooter")
  );
  const bodyChildren = React.Children.toArray(children).filter(
    (child) =>
      !isNamedElement(child, "DialogHeader") &&
      !isNamedElement(child, "DialogFooter")
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          `
          fixed left-1/2 top-1/2 z-50 flex flex-col
          w-[95vw] sm:w-full sm:max-w-lg
          max-h-[90vh]
          translate-x-[-50%] translate-y-[-50%]
          border border-border bg-background shadow-lg sm:rounded-lg
          overflow-hidden duration-200
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
          data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
          data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2
          `,
          className
        )}
        {...props}
      >
        {/* ✅ Fixed header */}
        {headerChildren.length > 0 && (
          <div className="sticky top-0 z-10 bg-background px-6 pt-6 pb-4 flex items-center justify-between">
            <div className="w-full">{headerChildren}</div>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-6 w-6 hover:text-red-500 transition-colors duration-200 transform hover:scale-110" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
        )}

        {/* ✅ Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">{bodyChildren}</div>

        {/* ✅ Sticky footer */}
        {footerChildren.length > 0 && (
          <div className="sticky bottom-0 z-10 bg-background px-6 py-4">
            {footerChildren}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ✅ Keep rest same
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
