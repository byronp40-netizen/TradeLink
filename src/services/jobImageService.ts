import { supabase } from "@/lib/supabaseClient";

export type JobImage = {
  id: string;
  job_id: string;
  storage_path: string;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
};

export async function uploadJobImage(jobId: string, file: File): Promise<JobImage> {
  const safeName = file.name.replace(/\s+/g, "-");
  const storagePath = `jobs/${jobId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("job-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error } = await supabase
    .from("job_images")
    .insert({
      job_id: jobId,
      storage_path: storagePath,
      filename: file.name
,
      content_type: file.type || null,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as JobImage;
}

export async function getJobImages(jobId: string): Promise<JobImage[]> {
  const { data, error } = await supabase
    .from("job_images")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as JobImage[];
}

export async function getJobImageSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("job-images")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function getJobImageSignedUrls(
  images: JobImage[],
  expiresInSeconds = 3600
): Promise<Record<string, string>> {
    const pairs = await Promise.all(
      images.map(async (image) => {
        const signedUrl = await getJobImageSignedUrl(image.storage_path, expiresInSeconds);
        return [image.id, signedUrl] as const;
      })
    );

    return Object.fromEntries(pairs);
}

export async function deleteJobImage(imageId: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from("job-images")
    .remove([storagePath]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error: dbError } = await supabase
    .from("job_images")
    .delete()
    .eq("id", imageId);

  if (dbError) {
    throw new Error(dbError.message);
  }
}
