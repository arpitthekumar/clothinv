"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tag, Sparkles, CheckCircle2 } from "lucide-react";
import { useProductDefaultPrefs } from "@/hooks/use-product-default-prefs";
import { useToast } from "@/hooks/use-toast";

export function ProductDefaultSettings() {
  const { prefs, updatePrefs } = useProductDefaultPrefs();
  const { toast } = useToast();

  const handleToggleBargainable = (checked: boolean) => {
    updatePrefs({ defaultIsBargainable: checked });
    toast({
      title: "Default Setting Saved",
      description: `New products will now default to Bargainable = ${checked ? "ON (True)" : "OFF (False)"}`,
    });
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center text-lg gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Product Creation Defaults
            </CardTitle>
            <CardDescription>
              Configure default values automatically pre-filled when adding a new product to inventory.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            Auto-Applied
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Default Bargainable Item Status
              </p>
              <Badge
                variant={prefs.defaultIsBargainable ? "default" : "secondary"}
                className={
                  prefs.defaultIsBargainable
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
                    : "text-xs"
                }
              >
                {prefs.defaultIsBargainable ? "True (Enabled by default)" : "False (Disabled by default)"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Controls whether the <span className="font-semibold text-foreground">"Bargainable Item"</span> switch in the Add Product form opens turned <span className="font-semibold">{prefs.defaultIsBargainable ? "ON" : "OFF"}</span> by default.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs text-muted-foreground font-medium">
              {prefs.defaultIsBargainable ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={prefs.defaultIsBargainable}
              onCheckedChange={handleToggleBargainable}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/30 p-3 rounded-lg border border-border/40">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>
            Changes take effect immediately. Next time you click <strong>"+ Add Product"</strong>, the form will pre-load your default preferences.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
