"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { UserCheck, Plus, Edit, Trash2, CheckCircle2, XCircle, Phone, Hash, Lock, AlertTriangle, ShieldAlert, Receipt, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Salesperson {
  id: string;
  name: string;
  code?: string | null;
  phone?: string | null;
  active: boolean;
  createdAt?: string;
}

export function SalespersonsSettingsSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = Boolean(
    user &&
      (user.role === "admin" ||
        user.role === "superadmin" ||
        user.username?.trim().toLowerCase() === "admin")
  );
  const [openModal, setOpenModal] = useState(false);
  const [editingSp, setEditingSp] = useState<Salesperson | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    phone: "",
    active: true,
  });

  const { data: salespersons = [], isLoading } = useQuery<Salesperson[]>({
    queryKey: ["/api/salespersons", { includeInactive: true }],
    queryFn: async () => {
      const res = await fetch("/api/salespersons?includeInactive=true");
      if (!res.ok) throw new Error("Failed to load salespersons");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/salespersons", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create salesperson");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons"] });
      toast({ title: "Salesperson Created", description: "Successfully added new salesperson." });
      handleCloseModal();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await apiRequest("PUT", `/api/salespersons/${id}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update salesperson");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons"] });
      toast({ title: "Salesperson Updated", description: "Changes saved successfully." });
      handleCloseModal();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const [confirmDeleteSp, setConfirmDeleteSp] = useState<Salesperson | null>(null);
  const [deleteWarningSp, setDeleteWarningSp] = useState<{
    sp: Salesperson;
    salesCount: number;
    message?: string;
    linkedInvoices: Array<{
      id: string;
      invoiceNumber: string;
      amount: string;
      customerName?: string;
      createdAt?: string;
    }>;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (sp: Salesperson) => {
      const res = await fetch(`/api/salespersons/${sp.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error: any = new Error(data.error || "Failed to delete salesperson");
        error.status = res.status;
        error.code = data.code;
        error.salesCount = data.salesCount;
        error.linkedInvoices = data.linkedInvoices || [];
        error.sp = sp;
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons"] });
      toast({ title: "Salesperson Deleted", description: "Record has been removed." });
      setConfirmDeleteSp(null);
    },
    onError: (err: any) => {
      const targetSp = confirmDeleteSp || err.sp;
      setConfirmDeleteSp(null);

      const isLinked =
        err.code === "HAS_LINKED_SALES" ||
        err.status === 409 ||
        (typeof err.message === "string" && err.message.includes("HAS_LINKED_SALES"));

      if (isLinked && targetSp) {
        let linkedInvoices = err.linkedInvoices || [];
        let salesCount = err.salesCount || 1;
        let msg = err.message || "";

        if (typeof err.message === "string" && err.message.includes("{")) {
          try {
            const jsonPart = err.message.substring(err.message.indexOf("{"));
            const parsed = JSON.parse(jsonPart);
            if (parsed.salesCount) salesCount = parsed.salesCount;
            if (parsed.linkedInvoices) linkedInvoices = parsed.linkedInvoices;
            if (parsed.error) msg = parsed.error;
          } catch {}
        }

        setDeleteWarningSp({
          sp: targetSp,
          salesCount,
          message: msg,
          linkedInvoices,
        });
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    },
  });

  const handleOpenAdd = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins and superadmins can add salespersons.", variant: "destructive" });
      return;
    }
    setEditingSp(null);
    const autoCode = `SP-${(salespersons.length + 1).toString().padStart(3, "0")}`;
    setFormData({ name: "", code: autoCode, phone: "", active: true });
    setOpenModal(true);
  };

  const handleOpenEdit = (sp: Salesperson) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins and superadmins can edit salespersons.", variant: "destructive" });
      return;
    }
    setEditingSp(sp);
    setFormData({
      name: sp.name,
      code: sp.code || "",
      phone: sp.phone || "",
      active: sp.active,
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingSp(null);
    setFormData({ name: "", code: "", phone: "", active: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins and superadmins can create or edit salespersons.", variant: "destructive" });
      return;
    }
    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Full Name is required.", variant: "destructive" });
      return;
    }

    const trimmedPhone = formData.phone.trim();
    if (trimmedPhone) {
      const cleanDigits = trimmedPhone.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        toast({
          title: "Invalid Phone Number",
          description: "Phone number must be a valid 10-digit number.",
          variant: "destructive",
        });
        return;
      }
    }

    const finalCode = formData.code.trim() || `SP-${(salespersons.length + 1).toString().padStart(3, "0")}`;
    const payload = {
      ...formData,
      name: formData.name.trim(),
      phone: trimmedPhone ? trimmedPhone.replace(/\D/g, "").slice(0, 10) : "",
      code: finalCode,
    };

    if (editingSp) {
      updateMutation.mutate({ id: editingSp.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleStatus = (sp: Salesperson) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins and superadmins can modify salespersons.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: sp.id,
      data: { active: !sp.active },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Salespersons Management
            </CardTitle>
            <CardDescription>
              Add and manage salespeople for POS billing and commission reports
            </CardDescription>
          </div>
          {isAdmin ? (
            <Button onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add Salesperson
            </Button>
          ) : (
            <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-muted text-muted-foreground font-medium">
              <Lock className="h-3.5 w-3.5" /> Read-Only (Admin Restricted)
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading salespersons…</div>
          ) : salespersons.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-3 border border-dashed rounded-lg">
              <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="font-medium">No Salespersons Added Yet</p>
              <p className="text-sm">
                {isAdmin
                  ? 'Click "Add Salesperson" to register your staff/sales team.'
                  : "No salespersons have been added yet. Contact an administrator to add staff."}
              </p>
              {isAdmin && (
                <Button size="sm" onClick={handleOpenAdd}>
                  <Plus className="mr-2 h-4 w-4" /> Add Salesperson Now
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salespersons.map((sp) => (
                <div
                  key={sp.id}
                  className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                    sp.active ? "bg-card shadow-sm" : "bg-muted/40 opacity-75"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                          {sp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-base leading-tight">{sp.name}</h4>
                          <span className="text-xs text-muted-foreground">ID: {sp.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <Badge variant={sp.active ? "default" : "secondary"}>
                        {sp.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                      {sp.code && (
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5" /> Code: <span className="font-mono">{sp.code}</span>
                        </div>
                      )}
                      {sp.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> Phone: {sp.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-between pt-4 mt-3 border-t gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleToggleStatus(sp)}
                      >
                        {sp.active ? (
                          <>
                            <XCircle className="h-3.5 w-3.5 mr-1 text-destructive" /> Disable
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Enable
                          </>
                        )}
                      </Button>

                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(sp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          title="Delete Salesperson"
                          onClick={() => {
                            setConfirmDeleteSp(sp);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={openModal} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSp ? "Edit Salesperson" : "Add Salesperson"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                maxLength={30}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Staff Code</label>
              <Input
                placeholder="Auto-generated e.g. SP-001"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium block">Phone Number</label>
                {formData.phone.trim().length > 0 && (
                  <span className={`text-xs font-mono font-medium ${formData.phone.replace(/\D/g, "").length === 10 ? "text-emerald-500" : "text-amber-500"}`}>
                    {formData.phone.replace(/\D/g, "").length === 10
                      ? "✓ 10/10 digits"
                      : `${formData.phone.replace(/\D/g, "").length}/10 digits`}
                  </span>
                )}
              </div>
              <div
                className={`flex items-center border rounded-md overflow-hidden transition-colors ${
                  formData.phone.trim().length > 0 && formData.phone.replace(/\D/g, "").length !== 10
                    ? "border-destructive ring-1 ring-destructive"
                    : ""
                }`}
              >
                <span className="px-3 text-muted-foreground bg-muted border-r border-border font-medium text-xs">+91</span>
                <Input
                  type="tel"
                  placeholder="10-digit Phone number"
                  value={formData.phone}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, "");
                    if (raw.length === 12 && raw.startsWith("91")) {
                      raw = raw.slice(2);
                    }
                    const cleaned = raw.slice(0, 10);
                    setFormData((prev) => ({ ...prev, phone: cleaned }));
                  }}
                  maxLength={10}
                  className="border-0 focus:ring-0 focus:outline-none flex-1 font-mono tracking-wide"
                />
              </div>
              {formData.phone.trim().length > 0 && formData.phone.replace(/\D/g, "").length !== 10 && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <span>⚠️</span> Must be a valid 10-digit number.
                </p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSp ? "Save Changes" : "Create Salesperson"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM PERMANENT DELETE DIALOG */}
      <Dialog open={!!confirmDeleteSp} onOpenChange={(open) => !open && setConfirmDeleteSp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Salesperson
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground/80 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{confirmDeleteSp?.name}</span>
              {confirmDeleteSp?.code ? ` (${confirmDeleteSp.code})` : ""}?
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Note: If this salesperson has any past sales attached, the system will prevent deletion to safeguard audit and commission history.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteSp(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => confirmDeleteSp && deleteMutation.mutate(confirmDeleteSp)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINKED SALES WARNING & DEACTIVATE DIALOG */}
      <Dialog open={!!deleteWarningSp} onOpenChange={(open) => !open && setDeleteWarningSp(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg">Cannot Delete Salesperson</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Connected to existing sales invoices
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200">
              <p className="font-medium text-sm leading-relaxed">
                Cannot delete <span className="font-bold underline">{deleteWarningSp?.sp.name}</span> because this staff member is connected to{" "}
                <span className="font-bold">
                  {deleteWarningSp?.salesCount} sales transaction{deleteWarningSp?.salesCount !== 1 ? "s" : ""}
                </span>
                .
              </p>
              <p className="text-xs mt-1.5 opacity-90 leading-relaxed">
                Deleting this record would break past sales records, tax invoices, and commission reports.
              </p>
            </div>

            {/* List of Connected Invoices */}
            {deleteWarningSp && deleteWarningSp.linkedInvoices && deleteWarningSp.linkedInvoices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-0.5">
                  <span>These are the invoices it is connected to:</span>
                  <span className="text-[11px]">
                    {deleteWarningSp.linkedInvoices.length} of {deleteWarningSp.salesCount} shown
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {deleteWarningSp.linkedInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 hover:bg-muted/60 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Receipt className="h-4 w-4 text-primary shrink-0" />
                        <div className="truncate">
                          <span className="font-mono font-bold text-foreground">
                            {inv.invoiceNumber}
                          </span>
                          {inv.customerName && (
                            <span className="text-muted-foreground ml-2 truncate">
                              ({inv.customerName})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{parseFloat(inv.amount || "0").toLocaleString("en-IN")}
                        </div>
                        {inv.createdAt && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {deleteWarningSp.salesCount > deleteWarningSp.linkedInvoices.length && (
                  <p className="text-[11px] text-muted-foreground text-center pt-0.5">
                    + {deleteWarningSp.salesCount - deleteWarningSp.linkedInvoices.length} more invoice(s) in sales history
                  </p>
                )}
              </div>
            )}

            <div className="p-3 bg-muted/60 border rounded-lg text-xs space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Recommended Action: Disable Salesperson
              </p>
              <p className="leading-relaxed">
                Disabling will hide <strong>{deleteWarningSp?.sp.name}</strong> from POS billing selection so no new sales can be made under their name, while keeping all previous sales, invoices, and reports 100% intact.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteWarningSp(null)}
            >
              Keep Active
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5"
              onClick={() => {
                if (deleteWarningSp) {
                  updateMutation.mutate({
                    id: deleteWarningSp.sp.id,
                    data: { active: false },
                  });
                  setDeleteWarningSp(null);
                }
              }}
            >
              <XCircle className="h-4 w-4" />
              Disable Salesperson Instead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
