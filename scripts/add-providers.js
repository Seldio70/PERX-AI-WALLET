require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const PASSWORD = "PerxStart2026!";

const providers = [
  { name: "Mon Cheri", email: "moncheri@perx.ai" },
  { name: "Raiffeisen Bank", email: "raiffeisen@perx.ai" },
  { name: "Infinity Gym", email: "infinitygym@perx.ai" },
  { name: "Neptune", email: "neptune@perx.ai" }
];

async function main() {
  for (const provider of providers) {
    const { data: existing } = await client
      .from("users")
      .select("id")
      .eq("email", provider.email)
      .maybeSingle();

    if (existing) {
      console.log(`${provider.name} already exists — skipping.`);
      continue;
    }

    const { data: authData, error: authErr } = await client.auth.admin.createUser({
      email: provider.email,
      password: PASSWORD,
      email_confirm: true
    });

    if (authErr) {
      console.error(`Failed to create auth for ${provider.name}:`, authErr.message);
      continue;
    }

    const { error: insertErr } = await client.from("users").insert({
      auth_user_id: authData.user.id,
      name: provider.name,
      email: provider.email,
      role: "business",
      points_balance: 0
    });

    if (insertErr) {
      console.error(`Failed to insert ${provider.name}:`, insertErr.message);
    } else {
      console.log(`Created ${provider.name} (${provider.email})`);
    }
  }

  console.log("\nDone. Credentials:");
  for (const p of providers) {
    console.log(`  ${p.email} / ${PASSWORD}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
