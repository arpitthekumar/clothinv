"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { tailwindColorMap } from "@/lib/colors";

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: {
    id: string;
    name: string;
    description?: string | null;
    color: string;
  } | null;
}

const schema = insertCategorySchema;

export function EditCategoryModal({
  open,
  onClose,
  category,
}: EditCategoryModalProps) {
  const { toast } = useToast();
  const handleClose = () => {
    form.reset();
    onClose();
  };

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      color: category?.color ?? "white",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!category) return; // TS safe

    const res = await apiRequest("PUT", "/api/categories", {
      id: category.id,
      ...values,
    });

    if (!res.ok) {
      const error = await res.json();
      toast({
        title: "Error",
        description: error.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Category Updated",
      description: `"${values.name}" updated successfully.`,
    });

    queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update your category details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Category name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      placeholder="Optional description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>

                  <Select
                    value={field.value || "white"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category-color">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-4 w-4 rounded-full border ${
                              tailwindColorMap[field.value || "white"].bg
                            }`}
                          />
                          <span className="capitalize">
                            {field.value || "white"}
                          </span>
                        </div>
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {Object.keys(tailwindColorMap).map((color) => (
                        <SelectItem
                          key={color}
                          value={color}
                          className="pl-8 flex items-center gap-2 capitalize"
                        >
                          <div
                            className={`h-4 w-4 rounded-full border ${tailwindColorMap[color].bg}`}
                          />
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end  space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-add-product"
              >
                Cancel
              </Button>{" "}
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
