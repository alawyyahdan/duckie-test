import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderNumberSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function HomePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const form = useForm({
    resolver: zodResolver(orderNumberSchema),
    defaultValues: {
      orderNumber: "",
    },
  });

  const verifyOrder = useMutation({
    mutationFn: async (orderNumber: string) => {
      const res = await apiRequest("POST", "/api/verify-order", { orderNumber });
      return res.json();
    },
    onSuccess: (_, variables) => {
      setLocation(`/upload/${variables}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Upload Files</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => verifyOrder.mutate(data.orderNumber))} className="space-y-4">
            <FormField
              control={form.control}
              name="orderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your order number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={verifyOrder.isPending}
            >
              {verifyOrder.isPending ? "Verifying..." : "Continue"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
