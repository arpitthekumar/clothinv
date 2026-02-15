"use client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "../shared/sidebar";
import { Header } from "../shared/header";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Auto-close sidebar on mobile on first load
  const router = useRouter();



  return (
    <div className="min-h-screen w-full flex items-center justify-center ">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold">404 Page Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Did you forget to add the page to the router?
            </p>
            {/* ACTIONS */}
            <div className="mt-6 items-center flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => router.push("/")}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
