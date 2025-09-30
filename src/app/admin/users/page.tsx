"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { username: string; fullName: string; password: string; role: string }) => {
      await apiRequest("POST", `/api/register`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created" });
    },
  });

  let newUser = { username: "", fullName: "", password: "", role: "employee" };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Full name" onChange={(e) => (newUser.fullName = e.target.value)} />
            <Input placeholder="Username" onChange={(e) => (newUser.username = e.target.value)} />
            <Input type="password" placeholder="Password" onChange={(e) => (newUser.password = e.target.value)} />
            <Input placeholder="Role (employee/admin)" onChange={(e) => (newUser.role = e.target.value)} />
            <Button onClick={() => addMutation.mutate(newUser)}>Add</Button>
          </div>
          <div className="space-y-2">
            {Array.isArray(usersQuery.data) && usersQuery.data.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 border rounded p-2">
                <div className="flex-1">
                  <div className="font-medium">{u.fullName} ({u.username})</div>
                  <div className="text-xs text-muted-foreground">{u.role}</div>
                </div>
                <Button variant="outline" onClick={() => deleteMutation.mutate(u.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


