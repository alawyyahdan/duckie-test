import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderNumberSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Search, Plus, Trash2 } from "lucide-react";

export default function SellerDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const createOrderForm = useForm({
    resolver: zodResolver(orderNumberSchema),
    defaultValues: {
      orderNumber: "",
    },
  });

  const createOrder = useMutation({
    mutationFn: async (data: { orderNumber: string }) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      createOrderForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (orderNumber: string) => {
      await apiRequest("DELETE", `/api/orders/${orderNumber}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter((order: any) =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Welcome, {user?.username}</h1>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Order</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...createOrderForm}>
                <form onSubmit={createOrderForm.handleSubmit((data) => createOrder.mutate(data))} className="space-y-4">
                  <FormField
                    control={createOrderForm.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Order Number</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Enter order number" {...field} />
                          </FormControl>
                          <Button type="submit" disabled={createOrder.isPending}>
                            <Plus className="h-4 w-4 mr-2" />
                            {createOrder.isPending ? "..." : "Create"}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-muted-foreground">No orders found</p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Order: {order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {order.hasUploaded ? "Files Uploaded" : "Pending Upload"}
                      </p>
                      {order.songRequest && (
                        <p className="text-sm text-muted-foreground">Song: {order.songRequest}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {order.hasUploaded && (
                        <>
                          {order.videoUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={order.videoUrl} download>
                                <FileDown className="h-4 w-4 mr-2" />
                                Video
                              </a>
                            </Button>
                          )}
                          {order.imageUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={order.imageUrl} download>
                                <FileDown className="h-4 w-4 mr-2" />
                                Image
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteOrder.mutate(order.orderNumber)}
                            disabled={deleteOrder.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}