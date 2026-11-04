"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/shared/header";
import { Sidebar } from "@/components/shared/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, ShieldAlert, Receipt, CheckCircle2, Calendar, Trash2, PhoneCall } from "lucide-react";

import { SalespersonsSettingsSection } from "@/components/settings/sections/salespersons-settings-section";
import { useSearchParams } from "next/navigation";

function AdminUsersContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const searchParams = useSearchParams();
  const currentTabFromUrl = searchParams.get("tab") === "salespersons" ? "salespersons" : "users";
  const [activeTab, setActiveTab] = useState(currentTabFromUrl);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") === "salespersons" ? "salespersons" : "users";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "superadmin" && user.username?.trim().toLowerCase() !== "admin") {
      window.location.href = "/";
    }
  }, [user]);

  const usersQuery = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const totalUsers = useMemo(
    () => (Array.isArray(usersQuery.data) ? usersQuery.data.length : 0),
    [usersQuery.data]
  );

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteWarningUser, setDeleteWarningUser] = useState<{
    user: User;
    salesCount: number;
    linkedInvoices: Array<{
      id: string;
      invoiceNumber: string;
      amount: string;
      customerName?: string;
      createdAt?: string;
    }>;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (targetUser: User) => {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error: any = new Error(data.error || "Failed to delete user");
        error.status = res.status;
        error.code = data.code;
        error.salesCount = data.salesCount;
        error.linkedInvoices = data.linkedInvoices || [];
        error.targetUser = targetUser;
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted", description: "Account removed successfully." });
      setUserToDelete(null);
    },
    onError: (err: any) => {
      const target = userToDelete || err.targetUser;
      setUserToDelete(null);
      const isLinked =
        err.code === "HAS_LINKED_SALES" ||
        err.status === 409 ||
        (typeof err.message === "string" && err.message.includes("HAS_LINKED_SALES"));

      if (isLinked && target) {
        let linkedInvoices = err.linkedInvoices || [];
        let salesCount = err.salesCount || 1;

        if (typeof err.message === "string" && err.message.includes("{")) {
          try {
            const jsonPart = err.message.substring(err.message.indexOf("{"));
            const parsed = JSON.parse(jsonPart);
            if (parsed.salesCount) salesCount = parsed.salesCount;
            if (parsed.linkedInvoices) linkedInvoices = parsed.linkedInvoices;
          } catch {}
        }

        setDeleteWarningUser({
          user: target,
          salesCount,
          linkedInvoices,
        });
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: {
      username: string;
      fullName: string;
      password: string;
      role: string;
    }) => {
      await apiRequest("POST", "/api/admin/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created" });
    },
  });

  const isSuperAdmin = Boolean(
    user && (user.role === "superadmin" || user.username?.trim().toLowerCase() === "admin" || user.id === "admin-dev-001")
  );

  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "employee",
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const editMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      username?: string;
      fullName?: string;
      role?: string;
      password?: string;
    }) => {
      const { id, ...updates } = payload;
      await apiRequest("PUT", `/api/admin/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
      setEditOpen(false);
      setEditingUser(null);
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="User & Staff Management"
          subtitle="Manage system login accounts and sales staff"
          onSidebarToggle={toggleSidebar}
        />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="users">
              <Card className="border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">User Management</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Create, view, and manage system login accounts
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">Max 3 Employees • Max 2 Admins</Badge>
                      <Badge>{totalUsers} Users</Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <PhoneCall className="h-3.5 w-3.5 text-primary shrink-0" />
                    For extra user account slots or device recovery, contact Super Admin: <a href="tel:6398217416" className="font-semibold text-foreground underline">6398217416</a>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-5">
                    <Input
                      className="md:col-span-2"
                      placeholder="Full name"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    />
                    <Input
                      placeholder="Username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <Select
                      onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                      value={newUser.role}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                    <div className="md:col-span-5 flex justify-end">
                      <Button
                        onClick={() => {
                          if (!newUser.fullName.trim()) {
                            toast({
                              title: "Full name is required",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (!newUser.username.trim()) {
                            toast({
                              title: "Username is required",
                              variant: "destructive",
                            });
                            return;
                          }
                          const reserved = ["admin", "administrator"];
                          if (
                            reserved.includes(newUser.username.trim().toLowerCase()) ||
                            reserved.includes(newUser.fullName.trim().toLowerCase())
                          ) {
                            toast({
                              title: "Reserved Username/Name",
                              description: "'admin' and 'administrator' are reserved names and cannot be assigned to user accounts.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (!newUser.password.trim()) {
                            toast({
                              title: "Password is required",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (!newUser.role) {
                            toast({
                              title: "Role is required",
                              variant: "destructive",
                            });
                            return;
                          }

                          addMutation.mutate(newUser);
                          setNewUser({ username: "", fullName: "", password: "", role: "employee" });
                        }}
                      >
                        Add user
                      </Button>
                    </div>
                  </div>

                  <div className="divide-y rounded-md border overflow-hidden">
                    <div className="grid grid-cols-6 gap-2 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                      <div className="col-span-2">Name</div>
                      <div>Username</div>
                      <div>Role</div>
                      <div>Created</div>
                      <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y">
                      {Array.isArray(usersQuery.data) && usersQuery.data.length > 0 ? (
                        usersQuery.data.map((u: any) => {
                          const isRowSuperAdmin =
                            u.role === "superadmin" ||
                            u.username?.trim().toLowerCase() === "admin" ||
                            u.id === "admin-dev-001";
                          return (
                            <div
                              key={u.id}
                              className="grid grid-cols-6 gap-2 items-center p-3"
                            >
                              <div className="col-span-2 font-medium">
                                {u.fullName}
                              </div>
                              <div className="text-muted-foreground">
                                {u.username}
                              </div>
                              <div>
                                <Badge
                                  variant={
                                    isRowSuperAdmin
                                      ? "default"
                                      : u.role === "admin"
                                      ? "outline"
                                      : "secondary"
                                  }
                                  className={
                                    isRowSuperAdmin
                                      ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                                      : ""
                                  }
                                >
                                  {isRowSuperAdmin ? "superadmin" : u.role}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {u.createdAt
                                  ? new Date(u.createdAt).toLocaleDateString()
                                  : "-"}
                              </div>
                              <div className="flex justify-end gap-2">
                                {(isSuperAdmin || !isRowSuperAdmin) && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingUser(u);
                                        setEditOpen(true);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:bg-destructive/10"
                                      onClick={() => setUserToDelete(u)}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          No users found
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salespersons">
              <SalespersonsSettingsSection />
            </TabsContent>
          </Tabs>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              {editingUser && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Full name</Label>
                      <Input
                        defaultValue={editingUser.fullName}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input
                        defaultValue={editingUser.username}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            username: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Role</Label>
                      <Select
                        onValueChange={(v) =>
                          setEditingUser({ ...editingUser, role: v })
                        }
                        defaultValue={editingUser.role}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {isSuperAdmin && (
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>New password (optional)</Label>
                      <Input
                        type="password"
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const reserved = ["admin", "administrator"];
                        const uLower = editingUser.username?.trim().toLowerCase() || "";
                        const fLower = editingUser.fullName?.trim().toLowerCase() || "";
                        if (
                          (reserved.includes(uLower) && editingUser.id !== "admin-dev-001" && editingUser.id !== "admin") ||
                          (reserved.includes(fLower) && editingUser.id !== "admin-dev-001" && editingUser.id !== "admin")
                        ) {
                          toast({
                            title: "Reserved Username/Name",
                            description: "'admin' and 'administrator' are reserved names and cannot be assigned to user accounts.",
                            variant: "destructive",
                          });
                          return;
                        }

                        editMutation.mutate({
                          id: editingUser.id,
                          username: editingUser.username,
                          fullName: editingUser.fullName,
                          role: editingUser.role,
                          password: editingUser.password,
                        });
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete User Confirmation Dialog */}
          <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete User Account
                </DialogTitle>
                <DialogDescription className="pt-2 text-sm leading-relaxed">
                  Are you sure you want to delete user account{" "}
                  <span className="font-semibold text-foreground">
                    {userToDelete?.fullName} ({userToDelete?.username})
                  </span>
                  ?
                  <br />
                  <span className="text-xs text-muted-foreground mt-2 block">
                    If this user has recorded any sales in the past, deletion will be blocked to protect sales audit records.
                  </span>
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="gap-2 sm:gap-0 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setUserToDelete(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => userToDelete && deleteMutation.mutate(userToDelete)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* User Linked Sales Warning Dialog */}
          <Dialog open={!!deleteWarningUser} onOpenChange={(open) => !open && setDeleteWarningUser(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Cannot Delete User</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Connected to past sales transactions
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 py-2 text-sm">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200">
                  <p className="font-medium text-xs leading-relaxed">
                    Cannot delete <span className="font-bold underline">{deleteWarningUser?.user.fullName} ({deleteWarningUser?.user.username})</span> because this user recorded{" "}
                    <span className="font-bold">
                      {deleteWarningUser?.salesCount} sales transaction{deleteWarningUser?.salesCount !== 1 ? "s" : ""}
                    </span>
                    .
                  </p>
                  <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed">
                    Deleting this user account would break historical cashier audit trails and financial reports.
                  </p>
                </div>

                {/* List of Connected Invoices */}
                {deleteWarningUser && deleteWarningUser.linkedInvoices.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-0.5">
                      <span>Recent Invoices Recorded by User:</span>
                      <span className="text-[11px]">
                        {deleteWarningUser.linkedInvoices.length} of {deleteWarningUser.salesCount} shown
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {deleteWarningUser.linkedInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-2 rounded-lg border bg-muted/40 hover:bg-muted/60 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Receipt className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div>
                              <span className="font-mono font-bold text-foreground">
                                {inv.invoiceNumber}
                              </span>
                              {inv.customerName && (
                                <span className="text-muted-foreground ml-1.5 text-[11px]">
                                  • {inv.customerName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ₹{parseFloat(inv.amount || "0").toLocaleString("en-IN")}
                            </div>
                            {inv.createdAt && (
                              <div className="text-[10px] text-muted-foreground">
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
                    {deleteWarningUser.salesCount > deleteWarningUser.linkedInvoices.length && (
                      <p className="text-[11px] text-muted-foreground text-center pt-0.5">
                        + {deleteWarningUser.salesCount - deleteWarningUser.linkedInvoices.length} more invoice(s) on record
                      </p>
                    )}
                  </div>
                )}

                <div className="p-3 bg-muted/60 border rounded-lg text-xs space-y-1 text-muted-foreground">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Recommended Action: Change Role or Password
                  </p>
                  <p className="leading-relaxed">
                    To prevent this user from logging in or making new sales, you can edit their account to change their password or adjust their role, keeping historical records completely intact.
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  className="w-full bg-primary"
                  onClick={() => setDeleteWarningUser(null)}
                >
                  Understood
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
