import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const uploadSchema = z.object({
  songRequest: z.string().min(1, "Song request is required"),
});

export default function CustomerUpload() {
  const { orderNumber } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      songRequest: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/upload/${orderNumber}`, {
        method: "POST",
        body: data,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: () => {
      setLocation("/success");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (formData: z.infer<typeof uploadSchema>) => {
    const videoInput = document.querySelector<HTMLInputElement>('input[name="video"]');
    const imageInput = document.querySelector<HTMLInputElement>('input[name="image"]');

    if (!videoInput?.files?.[0] || !imageInput?.files?.[0]) {
      toast({
        title: "Missing files",
        description: "Please select both video and image files",
        variant: "destructive",
      });
      return;
    }

    const video = videoInput.files[0];
    const image = imageInput.files[0];

    if (video.size > 100 * 1024 * 1024 || image.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 100MB and image must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("video", video);
    data.append("image", image);
    data.append("songRequest", formData.songRequest);

    uploadMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Files for Order {orderNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormItem>
                <FormLabel>Video File (max 100MB)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    name="video"
                    accept="video/*"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Image File (max 10MB)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    name="image"
                    accept="image/*"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="songRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Request</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the song you want..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}