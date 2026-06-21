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

const PASSWORD = "perx2026";

async function main() {
  // Find the employer and their company
  const { data: employer, error: empErr } = await client
    .from("users")
    .select("id, company_id, name")
    .eq("role", "employer")
    .single();

  if (empErr || !employer) {
    console.error("Could not find employer:", empErr?.message ?? "no rows");
    process.exit(1);
  }

  const companyId = employer.company_id;
  if (!companyId) {
    console.error("Employer has no company_id. Run setup-clean-accounts.js first.");
    process.exit(1);
  }

  console.log(`Found employer: ${employer.name}, company_id: ${companyId}`);

  const demoEmployees = [
    {
      name: "employee1",
      email: "employee1@perx.ai",
      years_employed: 1
    },
    {
      name: "employee2",
      email: "employee2@perx.ai",
      years_employed: 1
    }
  ];

  for (const demo of demoEmployees) {
    // Check if user already exists
    const { data: existing } = await client
      .from("users")
      .select("id")
      .eq("email", demo.email)
      .maybeSingle();

    if (existing) {
      // Update company_id just in case
      await client.from("users").update({ company_id: companyId }).eq("id", existing.id);
      console.log(`${demo.name} already exists — ensured company link.`);
      continue;
    }

    // Create auth user
    const { data: authData, error: authErr } = await client.auth.admin.createUser({
      email: demo.email,
      password: PASSWORD,
      email_confirm: true
    });

    if (authErr) {
      console.error(`Failed to create auth for ${demo.name}:`, authErr.message);
      continue;
    }

    // Insert into users table
    const { error: insertErr } = await client.from("users").insert({
      auth_user_id: authData.user.id,
      name: demo.name,
      email: demo.email,
      role: "employee",
      company_id: companyId,
      years_employed: demo.years_employed,
      points_balance: 0
    });

    if (insertErr) {
      console.error(`Failed to insert ${demo.name}:`, insertErr.message);
    } else {
      console.log(`Created ${demo.name} (${demo.email}) with ${demo.years_employed} years employed.`);
    }
  }

  console.log("\nDone. Credentials:");
  for (const demo of demoEmployees) {
    console.log(`  ${demo.email} / ${PASSWORD}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
