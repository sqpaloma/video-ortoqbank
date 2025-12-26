import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { uploadVideoToBunny } from "@/app/actions/bunny";

interface UploadProgress {
  stage: "idle" | "creating" | "uploading" | "complete";
  percentage: number;
}

interface BunnyUploadResult {
  videoId: string;
  libraryId: string;
}

export function useBunnyUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    stage: "idle",
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Convex action to create video in Bunny
  const createVideo = useAction(api.bunny.videos.createVideo);

  const uploadVideo = async (
    file: File,
    title: string,
    createdBy: string
  ): Promise<BunnyUploadResult> => {
    setIsUploading(true);
    setError(null);
    setProgress({ stage: "creating", percentage: 25 });

    try {
      // Step 1: Create video in Bunny via Convex action
      const { videoId, libraryId } = await createVideo({ title, createdBy });

      setProgress({ stage: "uploading", percentage: 50 });

      // Step 2: Upload file via Next.js Server Action
      const formData = new FormData();
      formData.append("videoId", videoId);
      formData.append("libraryId", libraryId);
      formData.append("file", file);

      const result = await uploadVideoToBunny(formData);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setProgress({ stage: "complete", percentage: 100 });
      return { videoId, libraryId };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setProgress({ stage: "idle", percentage: 0 });
      }, 1000);
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress({ stage: "idle", percentage: 0 });
    setError(null);
  };

  return {
    uploadVideo,
    isUploading,
    progress,
    error,
    reset,
  };
}
