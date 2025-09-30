"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Gate on client; server gate should be added if needed later
    if (user && user.role !== "admin") {
      window.location.href = "/";
    }
  }, [user]);

  const usersQuery = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const totalUsers = useMemo(() => (Array.isArray(usersQuery.data) ? usersQuery.data.length : 0), [usersQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { username: string; fullName: string; password: string; role: string }) => {
      await apiRequest("POST", "/api/admin/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created" });
    },
  });

  let newUser = { username: "", fullName: "", password: "", role: "employee" };

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; username?: string; fullName?: string; role?: string; password?: string }) => {
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
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">User Management</CardTitle>
              <p className="text-sm text-muted-foreground">Create, view, and manage users</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total</span>
              <Badge>{totalUsers}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-5">
            <Input className="md:col-span-2" placeholder="Full name" onChange={(e) => (newUser.fullName = e.target.value)} />
            <Input placeholder="Username" onChange={(e) => (newUser.username = e.target.value)} />
            <Input type="password" placeholder="Password" onChange={(e) => (newUser.password = e.target.value)} />
            <Select onValueChange={(v) => (newUser.role = v)} defaultValue={newUser.role}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-5 flex justify-end">
              <Button onClick={() => addMutation.mutate(newUser)}>Add user</Button>
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
                usersQuery.data.map((u: any) => (
                  <div key={u.id} className="grid grid-cols-6 gap-2 items-center p-3">
                    <div className="col-span-2 font-medium">{u.fullName}</div>
                    <div className="text-muted-foreground">{u.username}</div>
                    <div>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingUser(u); setEditOpen(true); }}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(u.id)}>Delete</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">No users found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Input defaultValue={editingUser.fullName} onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })} />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input defaultValue={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <Select onValueChange={(v) => setEditingUser({ ...editingUser, role: v })} defaultValue={editingUser.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>New password (optional)</Label>
                  <Input type="password" onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={() => editMutation.mutate({ id: editingUser.id, username: editingUser.username, fullName: editingUser.fullName, role: editingUser.role, password: editingUser.password })}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


