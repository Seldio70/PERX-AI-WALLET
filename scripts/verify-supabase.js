require("dotenv").config({ path: ".env" });

const { createClient } = require("@supabase/supabase-js");

const requiredTables = [
  { name: "companies", select: "id,monthly_budget_per_employee" },
  { name: "users", select: "id,auth_user_id,role,company_id,invited_by_user_id,points_balance" },
  { name: "provider_profiles", select: "id,user_id,business_name,category,is_approved" },
  { name: "benefits", select: "id,provider_id,business_id,points_price,is_active" },
  { name: "employer_invites", select: "id,employee_id,invite_code,status" },
  { name: "selection_requests", select: "id,employee_id,employer_id,total_points,status" },
  { name: "selection_items", select: "id,selection_request_id,benefit_id,provider_id,points_price" },
  { name: "employer_wallet_cards", select: "id,employer_id,points" },
  { name: "points_ledger", select: "id,user_id,points_delta,source" },
  { name: "challenges", select: "id,employee_id,employer_id,reward_points,status" },
  { name: "redemptions", select: "id,benefit_id,provider_id,selection_request_id,points_spent,status" }
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.includes("your-") || value.includes("your_")) {
    throw new Error(`${name} is missing or still looks like a placeholder`);
  }
  return value;
}

async function assertNoError(label, result) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.code || "unknown"} ${result.error.message}`);
  }
  return result.data;
}

async function main() {
  const url = requireEnv("EXPO_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log("Checking Supabase connection...");
  const health = await fetch(`${url}/rest/v1/`);
  if (!health.ok && health.status !== 401) {
    throw new Error(`Supabase REST endpoint returned ${health.status}`);
  }

  console.log("Checking required tables...");
  for (const table of requiredTables) {
    await assertNoError(
      `table ${table.name}`,
      await client.from(table.name).select(table.select).limit(1)
    );
    console.log(`ok ${table.name}`);
  }

  const stamp = Date.now();
  const created = {
    users: [],
    companies: [],
    profiles: [],
    benefits: [],
    requests: [],
    items: [],
    wallets: [],
    challenges: [],
    invites: []
  };

  try {
    console.log("Running disposable end-to-end write test...");
    const employer = await assertNoError(
      "insert employer",
      await client
        .from("users")
        .insert({
          name: "Smoke Employer",
          email: `employer-${stamp}@perx.test`,
          role: "employer",
          points_balance: 100
        })
        .select("id")
        .single()
    );
    created.users.push(employer.id);

    const company = await assertNoError(
      "insert company",
      await client
        .from("companies")
        .insert({
          name: `Smoke Co ${stamp}`,
          employer_id: employer.id,
          monthly_budget_per_employee: 6000
        })
        .select("id")
        .single()
    );
    created.companies.push(company.id);

    const employee = await assertNoError(
      "insert employee",
      await client
        .from("users")
        .insert({
          name: "Smoke Employee",
          email: `employee-${stamp}@perx.test`,
          role: "employee",
          company_id: company.id,
          years_employed: 1
        })
        .select("id")
        .single()
    );
    created.users.push(employee.id);

    const providerUser = await assertNoError(
      "insert provider user",
      await client
        .from("users")
        .insert({
          name: "Smoke Provider",
          email: `provider-${stamp}@perx.test`,
          role: "business"
        })
        .select("id")
        .single()
    );
    created.users.push(providerUser.id);

    const invite = await assertNoError(
      "insert invite",
      await client
        .from("employer_invites")
        .insert({
          employee_id: employee.id,
          employer_email: `employer-${stamp}@perx.test`,
          company_name: `Smoke Co ${stamp}`,
          invite_code: `SMOKE-${stamp}`,
          status: "accepted",
          accepted_by_user_id: employer.id
        })
        .select("id")
        .single()
    );
    created.invites.push(invite.id);

    await assertNoError(
      "accept invite",
      await client
        .from("employer_invites")
        .update({
          status: "accepted",
          accepted_by_user_id: employer.id,
          accepted_at: new Date().toISOString()
        })
        .eq("id", invite.id)
    );

    const profile = await assertNoError(
      "insert provider profile",
      await client
        .from("provider_profiles")
        .insert({
          user_id: providerUser.id,
          business_name: "Smoke Provider",
          description: "Disposable provider profile smoke test.",
          category: "Wellness",
          city: "Tirana"
        })
        .select("id")
        .single()
    );
    created.profiles.push(profile.id);

    const offer = await assertNoError(
      "insert benefit",
      await client
        .from("benefits")
        .insert({
          provider_id: profile.id,
          business_id: providerUser.id,
          provider_name: "Smoke Provider",
          title: "Disposable offer",
          description: "Smoke test offer.",
          discount: "test",
          price: 99,
          points_price: 9,
          image_url: "https://example.com/test.jpg",
          type: "qr",
          category: "Wellness",
          city: "Tirana"
        })
        .select("id")
        .single()
    );
    created.benefits.push(offer.id);

    const request = await assertNoError(
      "insert selection request",
      await client
        .from("selection_requests")
        .insert({
          employee_id: employee.id,
          employer_id: employer.id,
          company_id: company.id,
          total: 99,
          total_points: 9,
          status: "approved",
          approved_at: new Date().toISOString()
        })
        .select("id")
        .single()
    );
    created.requests.push(request.id);

    const item = await assertNoError(
      "insert selection item",
      await client
        .from("selection_items")
        .insert({
          selection_request_id: request.id,
          benefit_id: offer.id,
          provider_id: profile.id,
          price: 99,
          points_price: 9
        })
        .select("id")
        .single()
    );
    created.items.push(item.id);

    const wallet = await assertNoError(
      "insert wallet",
      await client
        .from("employer_wallet_cards")
        .insert({
          employer_id: employer.id,
          title: "Smoke Wallet",
          description: "Disposable test card.",
          points: 1,
          accent: "#FFFFFF"
        })
        .select("id")
        .single()
    );
    created.wallets.push(wallet.id);

    const challenge = await assertNoError(
      "insert challenge",
      await client
        .from("challenges")
        .insert({
          employee_id: employee.id,
          employer_id: employer.id,
          title: "Smoke challenge",
          description: "Disposable test challenge.",
          reward_points: 1
        })
        .select("id")
        .single()
    );
    created.challenges.push(challenge.id);

    const ledger = await assertNoError(
      "insert ledger",
      await client
        .from("points_ledger")
        .insert({
          user_id: employer.id,
          source: "employee_redemption",
          points_delta: -9,
          description: "Smoke redemption spend"
        })
        .select("id")
        .single()
    );

    const redemption = await assertNoError(
      "insert redemption",
      await client
        .from("redemptions")
        .insert({
          benefit_id: offer.id,
          provider_id: profile.id,
          employee_id: employee.id,
          employer_id: employer.id,
          selection_request_id: request.id,
          amount: 99,
          points_spent: 9,
          qr_code: `SMOKE-${stamp}`,
          status: "paid",
          redeemed_at: new Date().toISOString()
        })
        .select("id")
        .single()
    );

    console.log("Supabase schema and CRUD are ready.");
  } finally {
    await client.from("redemptions").delete().like("qr_code", `SMOKE-%`);
    await client.from("points_ledger").delete().eq("description", "Smoke approval spend");
    for (const id of created.challenges) await client.from("challenges").delete().eq("id", id);
    for (const id of created.wallets) await client.from("employer_wallet_cards").delete().eq("id", id);
    for (const id of created.items) await client.from("selection_items").delete().eq("id", id);
    for (const id of created.requests) await client.from("selection_requests").delete().eq("id", id);
    for (const id of created.benefits) await client.from("benefits").delete().eq("id", id);
    for (const id of created.profiles) await client.from("provider_profiles").delete().eq("id", id);
    for (const id of created.invites) await client.from("employer_invites").delete().eq("id", id);
    for (const id of created.users) await client.from("users").delete().eq("id", id);
    for (const id of created.companies) await client.from("companies").delete().eq("id", id);
  }
}

main().catch((error) => {
  console.error(error.message);
  if (String(error.message).includes("PGRST205")) {
    console.error("Run the latest supabase/test-schema.sql in the Supabase SQL Editor, then retry npm run verify:supabase.");
  } else if (String(error.message).includes("PGRST204") || String(error.message).includes("42703")) {
    console.error("Your Supabase project has an older schema. Run supabase/upgrade-schema.sql, then retry npm run verify:supabase.");
  }
  process.exitCode = 1;
});
