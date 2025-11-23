"use client";

import { Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SalesSearchBar({ searchTerm, setSearchTerm, showTrash, setShowTrash }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Sales</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by invoice, amount, or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant={showTrash ? "destructive" : "outline"}
            onClick={() => setShowTrash(!showTrash)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {showTrash ? "Active Sales" : "Trash"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
