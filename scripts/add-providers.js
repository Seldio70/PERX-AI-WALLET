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

const PASSWORD = "perx123";

const providers = [
  { name: "MonCheri", email: "moncheri@perx.ai", category: "Food" },
  { name: "Albsig", email: "albsig@perx.ai", category: "Health" },
  { name: "Burger King", email: "burgerking@perx.ai", category: "Food" },
  { name: "FireHouse Subs", email: "firehousesubs@perx.ai", category: "Food" },
  { name: "Neptun", email: "neptun@perx.ai", category: "Learning" },
  { name: "Cineplexx", email: "cineplexx@perx.ai", category: "Family" }
];

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const result = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) throw new Error(result.error.message);
    users.push(...result.data.users);
    if (result.data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function deleteExistingProviders() {
  const { data: businessUsers, error: usersError } = await client
    .from("users")
    .select("id, auth_user_id, email, name")
    .eq("role", "business");

  if (usersError) throw usersError;

  const businessIds = (businessUsers ?? []).map((user) => user.id);
  if (!businessIds.length) {
    console.log("No existing provider accounts to remove.");
    return;
  }

  const { data: profiles } = await client
    .from("provider_profiles")
    .select("id")
    .in("user_id", businessIds);

  const profileIds = (profiles ?? []).map((profile) => profile.id);
  const { data: benefitsByBusiness } = await client
    .from("benefits")
    .select("id")
    .in("business_id", businessIds);
  const { data: benefitsByProfile } = profileIds.length
    ? await client.from("benefits").select("id").in("provider_id", profileIds)
    : { data: [] };

  const benefitIds = [
    ...new Set([...(benefitsByBusiness ?? []), ...(benefitsByProfile ?? [])].map((row) => row.id))
  ];

  if (benefitIds.length) {
    await client.from("redemptions").delete().in("benefit_id", benefitIds);
    await client.from("selection_items").delete().in("benefit_id", benefitIds);
    await client.from("employer_enabled_benefits").delete().in("benefit_id", benefitIds);
    await client.from("benefits").delete().in("id", benefitIds);
  }

  await client.from("provider_profiles").delete().in("user_id", businessIds);
  await client.from("users").delete().in("id", businessIds);

  const authUsers = await listAllAuthUsers();
  const authIds = new Set(
    (businessUsers ?? [])
      .map((user) => user.auth_user_id)
      .filter(Boolean)
  );

  for (const authUser of authUsers) {
    if (!authIds.has(authUser.id)) continue;
    const { error } = await client.auth.admin.deleteUser(authUser.id);
    if (error) throw new Error(`delete auth ${authUser.email}: ${error.message}`);
    console.log(`Removed auth user: ${authUser.email}`);
  }

  for (const user of businessUsers ?? []) {
    console.log(`Removed provider account: ${user.name} (${user.email})`);
  }
}

async function createProvider(provider) {
  const { data: authData, error: authErr } = await client.auth.admin.createUser({
    email: provider.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: provider.name,
      role: "business"
    }
  });

  if (authErr) {
    throw new Error(`auth ${provider.email}: ${authErr.message}`);
  }

  const { data: userRow, error: userErr } = await client
    .from("users")
    .insert({
      auth_user_id: authData.user.id,
      name: provider.name,
      email: provider.email,
      role: "business",
      points_balance: 0
    })
    .select("id")
    .single();

  if (userErr) {
    throw new Error(`user ${provider.email}: ${userErr.message}`);
  }

  const { error: profileErr } = await client.from("provider_profiles").insert({
    user_id: userRow.id,
    business_name: provider.name,
    logo_url: "",
    description: `${provider.name} partner on PerX.`,
    category: provider.category,
    city: "Tirana",
    is_approved: true
  });

  if (profileErr) {
    throw new Error(`profile ${provider.name}: ${profileErr.message}`);
  }

  console.log(`Created ${provider.name} (${provider.email})`);
}

async function main() {
  console.log("Removing existing provider profiles...");
  await deleteExistingProviders();

  console.log("\nCreating provider profiles...");
  for (const provider of providers) {
    await createProvider(provider);
  }

  console.log("\nProvider credentials (password for all: perx123):");
  for (const provider of providers) {
    console.log(`  ${provider.email}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
