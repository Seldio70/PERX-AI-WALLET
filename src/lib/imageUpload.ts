import { createClient } from "@supabase/supabase-js";
import { readAsStringAsync } from "expo-file-system/legacy";
import { Platform } from "react-native";
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

const LOCAL_URI_PREFIXES = ["blob:", "file:", "content:", "ph://", "assets-library:"];

export function isLocalImageUri(uri: string) {
  if (!uri) return false;
  if (LOCAL_URI_PREFIXES.some((prefix) => uri.startsWith(prefix))) return true;
  return Platform.OS !== "web" && uri.startsWith("/");
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

function contentTypeForUri(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/jpeg";
  return "image/jpeg";
}

function decodeBase64(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  throw new Error("Base64 decoding is unavailable in this environment.");
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

async function readLocalImageBytes(
  uri: string
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const normalizedUri = uri.startsWith("/") ? `file://${uri}` : uri;
  const contentType = contentTypeForUri(normalizedUri);

  if (Platform.OS === "web") {
    const response = await fetch(normalizedUri);
    if (!response.ok) {
      throw new Error(`Failed to read image (${response.status})`);
    }
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return { bytes: new Uint8Array(arrayBuffer), contentType: blob.type || contentType };
  }

  const base64 = await readAsStringAsync(normalizedUri, {
    encoding: "base64"
  });
  if (!base64) {
    throw new Error("Could not read the selected photo.");
  }
  return { bytes: decodeBase64(base64), contentType };
}

async function uploadViaApiServer(
  localUri: string,
  folder: "offers" | "logos"
): Promise<string | null> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) return null;

  try {
    const { bytes, contentType } = await readLocalImageBytes(localUri);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = typeof btoa === "function" ? btoa(binary) : null;
    if (!base64) return null;

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
    const { bytes, contentType } = await readLocalImageBytes(localUri);
    const ext = extensionForContentType(contentType);
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await client.storage.from(BUCKET).upload(path, bytes, {
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
