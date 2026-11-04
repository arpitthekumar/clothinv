"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  Award,
  TrendingUp,
  Receipt,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ShieldAlert,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invoicePrinter, type InvoiceData } from "@/lib/printer";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useAuth } from "@/hooks/use-auth";
import { ThankYouModal } from "@/components/pos/ThankYouModal";

interface CustomerWithStats {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  createdAt: string;
  totalSales?: number;
  totalSpent?: number;
  lastPurchaseAt?: string | null;
  deleted?: boolean;
  deleted_at?: string | null;
}

interface SaleHistory {
  id: string;
  invoice_number: string;
  created_at: string;
  total_amount: string;
  payment_method: string;
  items: any;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const isAdmin = Boolean(
    user &&
      (user.role === "admin" ||
        user.role === "superadmin" ||
        user.username?.trim().toLowerCase() === "admin")
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState<CustomerWithStats | null>(null);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState<InvoiceData | null>(null);
  const [printCustomerPhone, setPrintCustomerPhone] = useState("");

  // Customer Table Pagination & Sorting State
  const [tablePage, setTablePage] = useState(1);
  const [tableItemsPerPage, setTableItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "spent_desc" | "orders_desc" | "date_desc">("name_asc");

  // History Timeline Pagination & Filter State
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(5);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySortBy, setHistorySortBy] = useState<"newest" | "oldest" | "amount_desc">("newest");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setTablePage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setHistoryPage(1);
    setHistorySearchQuery("");
  }, [selectedCustomerId]);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [formError, setFormError] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings: storeSettings } = useStoreSettings();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch Customers List
  const {
    data: customers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<CustomerWithStats[]>({
    queryKey: ["/api/customers", debouncedSearchQuery, showArchived],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.set("q", debouncedSearchQuery);
      if (showArchived) params.set("includeDeleted", "true");
      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  // Customer Table Sorting & Pagination Math
  const sortedCustomers = [...customers].sort((a, b) => {
    if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
    if (sortBy === "spent_desc") return (b.totalSpent || 0) - (a.totalSpent || 0);
    if (sortBy === "orders_desc") return (b.totalSales || 0) - (a.totalSales || 0);
    if (sortBy === "date_desc") {
      const dateA = new Date(a.createdAt || (a as any).created_at || 0).getTime();
      const dateB = new Date(b.createdAt || (b as any).created_at || 0).getTime();
      return dateB - dateA;
    }
    return 0;
  });

  const totalTableItems = sortedCustomers.length;
  const totalTablePages = Math.max(1, Math.ceil(totalTableItems / tableItemsPerPage));
  const validTablePage = Math.min(tablePage, totalTablePages);
  const tableStartIndex = (validTablePage - 1) * tableItemsPerPage;
  const tableEndIndex = Math.min(tableStartIndex + tableItemsPerPage, totalTableItems);
  const paginatedCustomers = sortedCustomers.slice(tableStartIndex, tableEndIndex);

  // Fetch Selected Customer Details & History
  const { data: customerHistory, isLoading: isLoadingHistory } = useQuery<{
    customer: CustomerWithStats;
    totalSales: number;
    totalSpent: number;
    sales: SaleHistory[];
  }>({
    queryKey: ["/api/customers", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      const res = await fetch(`/api/customers/${selectedCustomerId}`);
      if (!res.ok) throw new Error("Failed to fetch customer details");
      return res.json();
    },
    enabled: !!selectedCustomerId,
  });

  // Fetch Deleting Customer History Preview (if they have sales)
  const { data: deletingCustomerDetails } = useQuery<{
    customer: CustomerWithStats;
    totalSales: number;
    totalSpent: number;
    sales: SaleHistory[];
  }>({
    queryKey: ["/api/customers", "delete-preview", isDeletingCustomer?.id],
    queryFn: async () => {
      if (!isDeletingCustomer?.id) return null;
      const res = await fetch(`/api/customers/${isDeletingCustomer.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!isDeletingCustomer && (isDeletingCustomer.totalSales || 0) > 0,
  });

  // Create Customer Mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; email?: string }) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create customer");
      }
      return json;
    },
    onSuccess: () => {
      toast({
        title: "Customer Added",
        description: "Customer registered successfully.",
      });
      setIsAddModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (err: Error) => {
      setFormError(err.message);
      toast({
        title: "Error Creating Customer",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; phone: string; email?: string };
    }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update customer");
      }
      return json;
    },
    onSuccess: () => {
      toast({
        title: "Customer Updated",
        description: "Customer details updated successfully.",
      });
      setEditingCustomer(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (err: Error) => {
      setFormError(err.message);
      toast({
        title: "Error Updating Customer",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Delete Customer Mutation (Hard Delete for 0 sales)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error: any = new Error(json.error || "Failed to delete customer");
        error.status = res.status;
        error.code = json.code;
        error.salesCount = json.salesCount;
        error.linkedInvoices = json.linkedInvoices;
        throw error;
      }
      return json;
    },
    onSuccess: () => {
      toast({
        title: "Customer Deleted",
        description: "Customer record has been permanently removed.",
      });
      setIsDeletingCustomer(null);
      if (selectedCustomerId === isDeletingCustomer?.id) {
        setSelectedCustomerId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (err: any) => {
      const isLinked =
        err.code === "HAS_LINKED_SALES" ||
        err.status === 409 ||
        (typeof err.message === "string" && err.message.includes("HAS_LINKED_SALES"));

      if (isLinked && isDeletingCustomer) {
        setIsDeletingCustomer({
          ...isDeletingCustomer,
          totalSales: err.salesCount || 1,
        });
      } else {
        toast({
          title: "Error Deleting Customer",
          description: err.message,
          variant: "destructive",
        });
        setIsDeletingCustomer(null);
      }
    },
  });

  // Archive Customer Mutation (Soft Delete for customers with sales history)
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}?archive=true`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to archive customer");
      }
      return json;
    },
    onSuccess: () => {
      toast({
        title: "Customer Archived",
        description: "Customer hidden from active lookups. Sales history preserved.",
      });
      setIsDeletingCustomer(null);
      if (selectedCustomerId === isDeletingCustomer?.id) {
        setSelectedCustomerId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Error Archiving Customer",
        description: err.message,
        variant: "destructive",
      });
      setIsDeletingCustomer(null);
    },
  });

  // Restore Customer Mutation
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}?action=restore`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to restore customer");
      }
      return json;
    },
    onSuccess: () => {
      toast({
        title: "Customer Restored",
        description: "Customer restored to active records.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Error Restoring Customer",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "" });
    setFormError("");
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (customer: CustomerWithStats) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit customer records.",
        variant: "destructive",
      });
      return;
    }
    setFormError("");
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
    });
    setEditingCustomer(customer);
  };

  const handleRequestDelete = (customer: CustomerWithStats) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete or archive customer records.",
        variant: "destructive",
      });
      return;
    }
    setIsDeletingCustomer(customer);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Customer name is required");
      return;
    }
    if (formData.name.trim().toLowerCase() === "walk-in customer") {
      setFormError('Cannot add "Walk-in Customer" as a persistent customer record');
      return;
    }
    const cleanDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim() || formData.phone.trim() === "N/A" || formData.phone.trim() === "0000000000" || cleanDigits.length !== 10) {
      setFormError("A valid 10-digit phone number is required");
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      phone: cleanDigits.slice(0, 10),
      email: formData.email.trim() || undefined,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit customer records.",
        variant: "destructive",
      });
      return;
    }
    if (!editingCustomer) return;
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Customer name is required");
      return;
    }
    if (formData.name.trim().toLowerCase() === "walk-in customer") {
      setFormError('Cannot set customer name to "Walk-in Customer"');
      return;
    }
    const cleanDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim() || formData.phone.trim() === "N/A" || formData.phone.trim() === "0000000000" || cleanDigits.length !== 10) {
      setFormError("A valid 10-digit phone number is required");
      return;
    }

    updateMutation.mutate({
      id: editingCustomer.id,
      data: {
        name: formData.name.trim(),
        phone: cleanDigits.slice(0, 10),
        email: formData.email.trim() || undefined,
      },
    });
  };

  const handlePrintReceipt = (sale: SaleHistory) => {
    try {
      const items = Array.isArray(sale.items)
        ? sale.items
        : typeof sale.items === "string"
        ? JSON.parse(sale.items)
        : [];

      const formattedItems = items.map((i: any) => {
        const p = parseFloat(i.price || "0");
        const q = Number(i.quantity) || 1;
        return {
          name: i.name || "Item",
          quantity: q,
          price: p,
          total: p * q,
        };
      });

      const totalVal = parseFloat(sale.total_amount || "0");

      setPrintInvoiceData({
        invoiceNumber: sale.invoice_number,
        date: sale.created_at,
        customerName: customerHistory?.customer.name || "Customer",
        customerPhone: customerHistory?.customer.phone || "",
        salespersonName: (sale as any).salesperson_name || (sale as any).salespersonName || undefined,
        items: formattedItems,
        subtotal: totalVal,
        tax: 0,
        total: totalVal,
        paymentMethod: sale.payment_method,
        storeSettings,
      });
      setPrintCustomerPhone(customerHistory?.customer.phone || "");
      setThankYouOpen(true);
    } catch (err: any) {
      toast({
        title: "Print Error",
        description: "Failed to format invoice for printing",
        variant: "destructive",
      });
    }
  };

  // KPI Metrics calculations
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce(
    (sum, c) => sum + (c.totalSpent || 0),
    0
  );
  const avgOrderValue =
    totalCustomers > 0 ? Math.round(totalRevenue / Math.max(1, customers.reduce((sum, c) => sum + (c.totalSales || 0), 0))) : 0;
  const repeatCustomers = customers.filter(
    (c) => (c.totalSales || 0) > 1
  ).length;

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Customer Management"
          subtitle="View customer profiles, track order history, and manage store relationships"
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Customers
                  </p>
                  <h3 className="text-2xl font-bold mt-1">{totalCustomers}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered in database
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer Revenue
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime registered sales
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avg Order Value
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    ₹{avgOrderValue.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per customer order
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Repeat Customers
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                    {repeatCustomers}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalCustomers > 0
                      ? `${Math.round((repeatCustomers / totalCustomers) * 100)}% retention rate`
                      : "0% retention rate"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Header & Search */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">
                    Customer Database
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Search customer records or add a new customer manually.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleOpenAddModal}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Customer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={showArchived ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowArchived(!showArchived);
                      setTablePage(1);
                    }}
                    className={`h-8 text-xs gap-1.5 ${showArchived ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25" : ""}`}
                    title={showArchived ? "Viewing all including archived" : "View archived records"}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>{showArchived ? "Including Archived" : "Show Archived"}</span>
                  </Button>

                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Sort By:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as any);
                        setTablePage(1);
                      }}
                      className="bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                    >
                      <option value="name_asc">Name (A to Z)</option>
                      <option value="name_desc">Name (Z to A)</option>
                      <option value="spent_desc">Highest Amount Spent</option>
                      <option value="orders_desc">Most Orders Count</option>
                      <option value="date_desc">Recently Registered</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customers Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead>Last Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-32 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                            <span>Loading customer directory...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : customers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-32 text-center text-muted-foreground"
                        >
                          {searchQuery ? (
                            <span>No customers found matching &quot;{searchQuery}&quot;</span>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Users className="h-8 w-8 text-muted-foreground/50" />
                              <p className="font-medium">No customers in database yet</p>
                              <p className="text-xs text-muted-foreground">
                                Customers will automatically be registered during POS checkout or when added manually.
                              </p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCustomers.map((customer) => {
                        const initials = customer.name
                          ? customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : "CU";

                        return (
                          <TableRow
                            key={customer.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-semibold text-foreground flex items-center gap-2">
                                    <span>{customer.name}</span>
                                    {customer.deleted && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-medium"
                                      >
                                        Archived
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {(() => {
                                      const rawDate = customer.createdAt || (customer as any).created_at;
                                      if (!rawDate) return "Added recently";
                                      const parsed = new Date(rawDate);
                                      return isNaN(parsed.getTime())
                                        ? "Added recently"
                                        : `Added ${parsed.toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })}`;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2 font-mono text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{customer.phone}</span>
                              </div>
                            </TableCell>

                            <TableCell className="text-muted-foreground text-sm">
                              {customer.email ? (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  <span>{customer.email}</span>
                                </div>
                              ) : (
                                <span className="text-xs opacity-50">—</span>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                {customer.totalSales || 0}
                              </span>
                            </TableCell>

                            <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              ₹{(customer.totalSpent || 0).toLocaleString("en-IN")}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                              {customer.lastPurchaseAt ? (
                                new Date(customer.lastPurchaseAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              ) : (
                                <span className="opacity-50">No purchases yet</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View Purchase History"
                                  onClick={() => setSelectedCustomerId(customer.id)}
                                >
                                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                                {isAdmin && (
                                  <>
                                    {!customer.deleted ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          title="Edit Customer"
                                          onClick={() => handleOpenEditModal(customer)}
                                        >
                                          <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          title={(customer.totalSales || 0) > 0 ? "Archive Customer" : "Delete Customer"}
                                          onClick={() => handleRequestDelete(customer)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Restore Customer"
                                        onClick={() => restoreMutation.mutate(customer.id)}
                                        disabled={restoreMutation.isPending}
                                      >
                                        <ArchiveRestore className="h-4 w-4 text-emerald-600" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Customer Table Pagination Bar */}
              {totalTableItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>
                      Showing <strong className="text-foreground">{totalTableItems === 0 ? 0 : tableStartIndex + 1}</strong> to{" "}
                      <strong className="text-foreground">{tableEndIndex}</strong> of{" "}
                      <strong className="text-foreground">{totalTableItems}</strong> customers
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="hidden sm:inline">Show:</span>
                      <select
                        value={tableItemsPerPage}
                        onChange={(e) => {
                          setTableItemsPerPage(Number(e.target.value));
                          setTablePage(1);
                        }}
                        className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value={5}>5 / page</option>
                        <option value={10}>10 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setTablePage(1)}
                      disabled={validTablePage <= 1}
                      title="First Page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                      disabled={validTablePage <= 1}
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="px-2 font-medium text-foreground">
                      Page {validTablePage} of {totalTablePages}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                      disabled={validTablePage >= totalTablePages}
                      title="Next Page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setTablePage(totalTablePages)}
                      disabled={validTablePage >= totalTablePages}
                      title="Last Page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Add New Customer
            </DialogTitle>
            <DialogDescription>
              Register a customer record. Phone number is required to prevent duplicates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAdd} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 text-xs font-medium bg-destructive/10 text-destructive rounded-md border border-destructive/20 flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-name">Customer Name *</Label>
              <Input
                id="add-name"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-phone">Phone Number *</Label>
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
                  id="add-phone"
                  type="tel"
                  placeholder="10-digit Phone number"
                  value={formData.phone}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, "");
                    if (raw.length === 12 && raw.startsWith("91")) {
                      raw = raw.slice(2);
                    }
                    const cleaned = raw.slice(0, 10);
                    setFormData({ ...formData, phone: cleaned });
                  }}
                  maxLength={10}
                  className="border-0 focus:ring-0 focus:outline-none flex-1 font-mono tracking-wide"
                  required
                />
              </div>
              {formData.phone.trim().length > 0 && formData.phone.replace(/\D/g, "").length !== 10 ? (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <span>⚠️</span> Must be a valid 10-digit number.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Phone numbers are unique per customer. Walk-in or dummy numbers are not allowed.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">Email Address (Optional)</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog
        open={!!editingCustomer}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit Customer Details
            </DialogTitle>
            <DialogDescription>
              Update information for {editingCustomer?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 text-xs font-medium bg-destructive/10 text-destructive rounded-md border border-destructive/20 flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Customer Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-phone">Phone Number *</Label>
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
                  id="edit-phone"
                  type="tel"
                  placeholder="10-digit Phone number"
                  value={formData.phone}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, "");
                    if (raw.length === 12 && raw.startsWith("91")) {
                      raw = raw.slice(2);
                    }
                    const cleaned = raw.slice(0, 10);
                    setFormData({ ...formData, phone: cleaned });
                  }}
                  maxLength={10}
                  className="border-0 focus:ring-0 focus:outline-none flex-1 font-mono tracking-wide"
                  required
                />
              </div>
              {formData.phone.trim().length > 0 && formData.phone.replace(/\D/g, "").length !== 10 && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <span>⚠️</span> Must be a valid 10-digit number.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address (Optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCustomer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Smart Delete / Archive Modal */}
      <Dialog
        open={!!isDeletingCustomer}
        onOpenChange={(open) => !open && setIsDeletingCustomer(null)}
      >
        <DialogContent className="sm:max-w-md">
          {isDeletingCustomer && (
            <>
              {(isDeletingCustomer.totalSales || 0) > 0 ? (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold">Cannot Delete Customer</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          Invoice & Financial Records Protection
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-3 py-2 text-sm">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200">
                      <p className="font-medium text-xs leading-relaxed">
                        Cannot delete <span className="font-bold underline">{isDeletingCustomer.name}</span> because this customer is connected to{" "}
                        <span className="font-bold">
                          {isDeletingCustomer.totalSales} purchase{(isDeletingCustomer.totalSales || 0) > 1 ? "s" : ""}
                        </span>{" "}
                        totaling <span className="font-bold">₹{(isDeletingCustomer.totalSpent || 0).toLocaleString("en-IN")}</span>.
                      </p>
                      <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed">
                        Deleting this customer would break past tax invoices, accounting records, and return logs.
                      </p>
                    </div>

                    {/* Connected Invoices List */}
                    {deletingCustomerDetails?.sales && deletingCustomerDetails.sales.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-0.5">
                          <span>These are the invoices it is connected to:</span>
                          <span className="text-[11px]">
                            {Math.min(deletingCustomerDetails.sales.length, 5)} of {deletingCustomerDetails.sales.length} shown
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {deletingCustomerDetails.sales.slice(0, 5).map((sale) => (
                            <div
                              key={sale.id}
                              className="flex items-center justify-between p-2 rounded-lg border bg-muted/40 hover:bg-muted/60 transition-colors text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Receipt className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="font-mono font-bold text-foreground">
                                  {sale.invoice_number}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  ₹{parseFloat(sale.total_amount || "0").toLocaleString("en-IN")}
                                </div>
                                {sale.created_at && (
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(sale.created_at).toLocaleDateString("en-IN", {
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
                        {deletingCustomerDetails.sales.length > 5 && (
                          <p className="text-[11px] text-muted-foreground text-center pt-0.5">
                            + {deletingCustomerDetails.sales.length - 5} more invoice(s) on record
                          </p>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-muted/60 border rounded-lg text-xs space-y-1 text-muted-foreground">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        Recommended Action: Archive Customer
                      </p>
                      <p className="leading-relaxed">
                        Archiving hides this customer from active searches and POS billing autofill, while preserving all past invoices and revenue reports 100% intact.
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="outline" onClick={() => setIsDeletingCustomer(null)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-medium"
                      onClick={() => archiveMutation.mutate(isDeletingCustomer.id)}
                      disabled={archiveMutation.isPending}
                    >
                      <Archive className="h-4 w-4" />
                      {archiveMutation.isPending ? "Archiving..." : "Archive Customer Instead"}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Delete Customer Record
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-sm leading-relaxed">
                      Are you sure you want to permanently delete{" "}
                      <span className="font-semibold text-foreground">{isDeletingCustomer.name}</span> ({isDeletingCustomer.phone})?
                      <br />
                      <span className="text-xs text-muted-foreground mt-2 block">
                        This customer has 0 recorded purchases. This action is permanent and cannot be undone.
                      </span>
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter className="gap-2 sm:gap-0 pt-3">
                    <Button variant="outline" onClick={() => setIsDeletingCustomer(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(isDeletingCustomer.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Confirm Permanent Delete"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Purchase History Sheet / Drawer */}
      <Sheet
        open={!!selectedCustomerId}
        onOpenChange={(open) => !open && setSelectedCustomerId(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-3 text-xl">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                {customerHistory?.customer?.name
                  ? customerHistory.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "CU"}
              </div>
              <div>
                <div>{customerHistory?.customer?.name || "Customer Details"}</div>
                <div className="text-xs font-normal text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {customerHistory?.customer?.phone}
                </div>
              </div>
            </SheetTitle>
            <SheetDescription>
              Customer profile and lifetime purchase statement
            </SheetDescription>
          </SheetHeader>

          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Loading purchase history...</span>
            </div>
          ) : !customerHistory ? (
            <div className="p-4 text-center text-muted-foreground">
              Customer record not found.
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {/* Customer Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted/30 border-border/60">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold mt-1 text-primary">
                      {customerHistory.totalSales}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/60">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      Total Amount Spent
                    </p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                      ₹{customerHistory.totalSpent.toLocaleString("en-IN")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Purchase History List */}
              <div className="space-y-4">
                <div className="flex flex-col gap-2.5 pb-1 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                      <Receipt className="h-4 w-4 text-primary" />
                      Purchase History Timeline ({customerHistory?.sales.length || 0})
                    </h4>
                  </div>

                  {customerHistory && customerHistory.sales.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Filter invoice # or item..."
                          value={historySearchQuery}
                          onChange={(e) => {
                            setHistorySearchQuery(e.target.value);
                            setHistoryPage(1);
                          }}
                          className="pl-8 h-8 text-xs bg-muted/20"
                        />
                      </div>

                      <select
                        value={historySortBy}
                        onChange={(e) => {
                          setHistorySortBy(e.target.value as any);
                          setHistoryPage(1);
                        }}
                        className="bg-background border border-border rounded px-2 h-8 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="amount_desc">Highest Amount</option>
                      </select>
                    </div>
                  )}
                </div>

                {(!customerHistory || customerHistory.sales.length === 0) ? (
                  <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground text-sm">
                    No sales recorded for this customer yet.
                  </div>
                ) : (
                  <>
                    {(() => {
                      const rawSales = customerHistory.sales;

                      const filteredSales = rawSales.filter((sale) => {
                        if (!historySearchQuery.trim()) return true;
                        const q = historySearchQuery.toLowerCase().trim();
                        const inv = (sale.invoice_number || "").toLowerCase();
                        const itemsStr = JSON.stringify(sale.items || []).toLowerCase();
                        return inv.includes(q) || itemsStr.includes(q);
                      });

                      const sortedHistorySales = [...filteredSales].sort((a, b) => {
                        const dateA = new Date(a.created_at || 0).getTime();
                        const dateB = new Date(b.created_at || 0).getTime();
                        if (historySortBy === "newest") return dateB - dateA;
                        if (historySortBy === "oldest") return dateA - dateB;
                        if (historySortBy === "amount_desc") return parseFloat(b.total_amount || "0") - parseFloat(a.total_amount || "0");
                        return 0;
                      });

                      const totalHistoryItems = sortedHistorySales.length;
                      const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyItemsPerPage));
                      const validHistoryPage = Math.min(historyPage, totalHistoryPages);
                      const historyStartIndex = (validHistoryPage - 1) * historyItemsPerPage;
                      const historyEndIndex = Math.min(historyStartIndex + historyItemsPerPage, totalHistoryItems);
                      const paginatedHistorySales = sortedHistorySales.slice(historyStartIndex, historyEndIndex);

                      if (totalHistoryItems === 0) {
                        return (
                          <div className="p-6 text-center border border-dashed rounded-lg text-muted-foreground text-xs">
                            No orders found matching &quot;{historySearchQuery}&quot;
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {paginatedHistorySales.map((sale) => {
                            const items = Array.isArray(sale.items)
                              ? sale.items
                              : typeof sale.items === "string"
                              ? JSON.parse(sale.items)
                              : [];

                            return (
                              <Card
                                key={sale.id}
                                className="border-border/60 hover:border-primary/40 transition-all shadow-xs"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/40">
                                    <div>
                                      <span className="font-mono text-sm font-bold text-primary">
                                        {sale.invoice_number}
                                      </span>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(sale.created_at).toLocaleString(
                                          "en-IN",
                                          {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                          }
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                                        ₹{parseFloat(sale.total_amount || "0").toLocaleString("en-IN")}
                                      </div>
                                      <span className="text-[11px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                        {sale.payment_method}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Itemized List Summary */}
                                  <div className="pt-3 space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                      Purchased Items ({items.length}):
                                    </p>
                                    <div className="space-y-1">
                                      {items.map((item: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="text-xs flex items-center justify-between text-foreground/90"
                                        >
                                          <span className="truncate max-w-[240px]">
                                            {item.name || `Product #${item.productId}`} × {item.quantity}
                                          </span>
                                          <span className="font-mono font-medium">
                                            ₹{(parseFloat(item.price || "0") * item.quantity).toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-3 mt-3 border-t border-border/40 flex justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 text-xs h-8"
                                      onClick={() => handlePrintReceipt(sale)}
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                      Print Receipt
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}

                          {/* History Pagination Bar */}
                          {totalHistoryItems > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40 text-xs text-muted-foreground mt-4">
                              <div className="flex items-center gap-2">
                                <span>
                                  Showing <strong className="text-foreground">{totalHistoryItems === 0 ? 0 : historyStartIndex + 1}</strong> to{" "}
                                  <strong className="text-foreground">{historyEndIndex}</strong> of{" "}
                                  <strong className="text-foreground">{totalHistoryItems}</strong> orders
                                </span>
                                <select
                                  value={historyItemsPerPage}
                                  onChange={(e) => {
                                    setHistoryItemsPerPage(Number(e.target.value));
                                    setHistoryPage(1);
                                  }}
                                  className="bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer ml-1"
                                >
                                  <option value={2}>2 / page</option>
                                  <option value={5}>5 / page</option>
                                  <option value={10}>10 / page</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                  disabled={validHistoryPage <= 1}
                                >
                                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                                  Prev
                                </Button>
                                <span className="px-2 font-medium text-foreground">
                                  Page {validHistoryPage} of {totalHistoryPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                                  disabled={validHistoryPage >= totalHistoryPages}
                                >
                                  Next
                                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Unified Thank You Receipt Modal */}
      <ThankYouModal
        open={thankYouOpen}
        onOpenChange={setThankYouOpen}
        invoiceData={printInvoiceData}
        customerPhone={printCustomerPhone}
        disableAutomation
      />
    </div>
  );
}
