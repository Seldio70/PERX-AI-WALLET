import { ImageURISource } from "react-native";
import { improveRemoteImageUrl, isLocalImageUri } from "./imageUpload";

type OfferImagePreset = "hero" | "detail" | "card" | "thumb";

const presets: Record<OfferImagePreset, { width: number; height?: number; quality: number }> = {
  hero: { width: 1600, height: 1200, quality: 92 },
  detail: { width: 1400, height: 900, quality: 92 },
  card: { width: 720, height: 520, quality: 88 },
  thumb: { width: 360, height: 360, quality: 86 }
};

export function offerImageUrl(uri: string, preset: OfferImagePreset = "card") {
  if (!uri || isLocalImageUri(uri)) return uri;

  const base = improveRemoteImageUrl(uri);
  const imagePreset = presets[preset];

  try {
    const url = new URL(base);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("images.unsplash.com")) {
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("w", String(imagePreset.width));
      if (imagePreset.height) url.searchParams.set("h", String(imagePreset.height));
      url.searchParams.set("q", String(imagePreset.quality));
      url.searchParams.set("dpr", "2");
      return url.toString();
    }

    if (hostname.includes("images.pexels.com")) {
      url.searchParams.set("auto", "compress");
      url.searchParams.set("cs", "tinysrgb");
      url.searchParams.set("w", String(imagePreset.width));
      if (imagePreset.height) url.searchParams.set("h", String(imagePreset.height));
      url.searchParams.set("dpr", "2");
      return url.toString();
    }

    if (hostname.includes("res.cloudinary.com") && !url.pathname.includes("/upload/f_auto")) {
      url.pathname = url.pathname.replace(
        "/upload/",
        `/upload/f_auto,q_${imagePreset.quality},c_fill,w_${imagePreset.width}${imagePreset.height ? `,h_${imagePreset.height}` : ""}/`
      );
      return url.toString();
    }
  } catch {
    return base;
  }

  return base;
}

export function offerImageSource(uri: string, preset: OfferImagePreset = "card"): ImageURISource {
  return {
    uri: offerImageUrl(uri, preset),
    cache: "force-cache"
  };
}
