import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

/**
 * Validates that a URL uses a safe protocol (http or https only).
 * Blocks javascript:, file:, data:, and other dangerous protocols.
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    // Block URLs pointing to internal/private IP ranges
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export interface MoodboardImage {
  id: string;
  url: string;
  caption?: string;
  source: "upload" | "url";
  createdAt: string;
}

interface UseMoodboardOptions {
  worksheetId: string;
  currentImages: MoodboardImage[];
  onUpdate: (images: MoodboardImage[]) => void;
}

export function useMoodboard({ worksheetId, currentImages, onUpdate }: UseMoodboardOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadImage = useMutation({
    mutationFn: async (file: File): Promise<MoodboardImage> => {
      if (!user) throw new Error("Not authenticated");

      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be less than 5MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${worksheetId}/${uuidv4()}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("moodboard-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("moodboard-images")
        .getPublicUrl(data.path);

      const newImage: MoodboardImage = {
        id: uuidv4(),
        url: publicUrl,
        source: "upload",
        createdAt: new Date().toISOString(),
      };

      return newImage;
    },
    onSuccess: (newImage) => {
      const updatedImages = [...currentImages, newImage];
      onUpdate(updatedImages);
      toast({
        title: "Image uploaded",
        description: "Your image has been added to the moodboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addImageFromUrl = useMutation({
    mutationFn: async (url: string): Promise<MoodboardImage> => {
      if (!user) throw new Error("Not authenticated");

      // Validate URL with protocol and domain checks
      if (!isValidImageUrl(url)) {
        throw new Error("Invalid URL. Please use a valid http:// or https:// image URL.");
      }

      const newImage: MoodboardImage = {
        id: uuidv4(),
        url,
        source: "url",
        createdAt: new Date().toISOString(),
      };

      return newImage;
    },
    onSuccess: (newImage) => {
      const updatedImages = [...currentImages, newImage];
      onUpdate(updatedImages);
      toast({
        title: "Image added",
        description: "Your image has been added to the moodboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add image",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCaption = useMutation({
    mutationFn: async ({ imageId, caption }: { imageId: string; caption: string }) => {
      return { imageId, caption };
    },
    onSuccess: ({ imageId, caption }) => {
      const updatedImages = currentImages.map((img) =>
        img.id === imageId ? { ...img, caption } : img
      );
      onUpdate(updatedImages);
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const imageToDelete = currentImages.find((img) => img.id === imageId);

      // Only try to delete from storage if it was an upload
      if (imageToDelete?.source === "upload" && user) {
        // Extract the path from the URL
        const url = new URL(imageToDelete.url);
        const pathParts = url.pathname.split("/");
        const bucketIndex = pathParts.indexOf("moodboard-images");
        if (bucketIndex !== -1) {
          const filePath = pathParts.slice(bucketIndex + 1).join("/");
          await supabase.storage.from("moodboard-images").remove([filePath]);
        }
      }

      return imageId;
    },
    onSuccess: (imageId) => {
      const updatedImages = currentImages.filter((img) => img.id !== imageId);
      onUpdate(updatedImages);
      toast({
        title: "Image removed",
        description: "The image has been removed from the moodboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove image",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reorderImages = (newOrder: MoodboardImage[]) => {
    onUpdate(newOrder);
  };

  return {
    uploadImage,
    addImageFromUrl,
    updateCaption,
    deleteImage,
    reorderImages,
    isUploading: uploadImage.isPending,
    isAddingUrl: addImageFromUrl.isPending,
  };
}
