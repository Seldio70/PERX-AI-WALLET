require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const client = createClient(url, serviceKey);
  const { data: existing, error: listError } = await client.storage.listBuckets();

  if (listError) {
    console.error("Could not list buckets:", listError.message);
    process.exit(1);
  }

  const bucketExists = existing.some((bucket) => bucket.id === "offer-images");
  if (bucketExists) {
    const { error } = await client.storage.updateBucket("offer-images", { public: true });
    if (error) {
      console.error("Could not update bucket:", error.message);
      process.exit(1);
    }
    console.log("Storage bucket offer-images already exists (set to public).");
  } else {
    const { error } = await client.storage.createBucket("offer-images", {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
    });
    if (error) {
      console.error("Could not create bucket:", error.message);
      process.exit(1);
    }
    console.log("Created public storage bucket offer-images.");
  }

  console.log("If uploads still fail, also run supabase/storage-setup.sql for storage RLS policies.");
  console.log("For web dev, you can also run npm run server and uploads will use the service-role API fallback.");
}

main();
