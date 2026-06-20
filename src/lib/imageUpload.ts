import { createClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

const BUCKET = "offer-images";

function getStorageClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY;
  if (url && serviceKey) {
    return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return getSupabaseClient();
}

const LOCAL_URI_PREFIXES = ["blob:", "file:", "content:", "ph://"];

export function isLocalImageUri(uri: string) {
  return LOCAL_URI_PREFIXES.some((prefix) => uri.startsWith(prefix));
}

export function improveRemoteImageUrl(uri: string) {
  if (!uri || isLocalImageUri(uri)) return uri;

  try {
    const url = new URL(uri);
    if (url.hostname.includes("googleusercontent.com")) {
      url.searchParams.delete("sz");
      url.searchParams.delete("w");
      url.searchParams.delete("h");
      return url.toString().replace(/=w\d+-h\d+(-[a-z]+)?$/i, "=s1600");
    }
  } catch {
    return uri;
  }

  return uri;
}

function extensionForContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  throw new Error("Base64 encoding is unavailable in this environment.");
}

async function uriToBlob(uri: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read image (${response.status})`);
  }
  const blob = await response.blob();
  return { blob, contentType: blob.type || "image/jpeg" };
}

async function uploadViaApiServer(
  localUri: string,
  folder: "offers" | "logos"
): Promise<string | null> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) return null;

  try {
    const { blob, contentType } = await uriToBlob(localUri);
    const base64 = await blobToBase64(blob);
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, contentType, folder })
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { url?: string };
    return payload.url ?? null;
  } catch (error) {
    console.warn("Server image upload failed", error);
    return null;
  }
}

async function uploadDirectToSupabase(
  localUri: string,
  folder: "offers" | "logos"
): Promise<string | null> {
  const client = getStorageClient();
  if (!client) return null;

  try {
    const { blob, contentType } = await uriToBlob(localUri);
    const ext = extensionForContentType(contentType);
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await client.storage.from(BUCKET).upload(path, blob, {
      contentType,
      cacheControl: "3600",
      upsert: false
    });

    if (error) throw error;

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.warn("Direct Supabase image upload failed", error);
    return null;
  }
}

export async function uploadImageToStorage(
  localUri: string,
  folder: "offers" | "logos"
): Promise<string | null> {
  if (!localUri || !isLocalImageUri(localUri)) {
    return localUri || null;
  }

  const direct = await uploadDirectToSupabase(localUri, folder);
  if (direct) return direct;

  return uploadViaApiServer(localUri, folder);
}

export async function ensurePublicImageUrl(
  uri: string,
  folder: "offers" | "logos"
): Promise<string | null> {
  if (!uri) return null;
  if (!isLocalImageUri(uri)) return improveRemoteImageUrl(uri);
  return uploadImageToStorage(uri, folder);
}
