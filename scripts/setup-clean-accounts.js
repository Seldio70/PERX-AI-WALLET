require("dotenv").config({ path: ".env" });

const { createClient } = require("@supabase/supabase-js");

const password = "perx2026";
const accounts = [
  {
    name: "PerX Employee",
    email: "employee@perx.ai",
    role: "employee",
    years_employed: 0,
    points_balance: 0
  },
  {
    name: "PerX Employer",
    email: "employer@perx.ai",
    role: "employer",
    years_employed: 0,
    points_balance: 0
  }
];

const demoEmailPatterns = [
  /@novaworks\.test$/i,
  /@flexgym\.test$/i,
  /@mulliri\.test$/i,
  /@littlesteps\.test$/i,
  /@tumo\.test$/i,
  /@explorealbania\.test$/i,
  /@perx\.test$/i,
  /@perx\.ai$/i
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

async function listAllAuthUsers(client) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const result = await client.auth.admin.listUsers({ page, perPage });
    if (result.error) throw new Error(`list auth users: ${result.error.message}`);
    users.push(...result.data.users);
    if (result.data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

async function deleteDemoAuthUsers(client) {
  const authUsers = await listAllAuthUsers(client);
  const demoUsers = authUsers.filter((user) =>
    demoEmailPatterns.some((pattern) => pattern.test(user.email ?? ""))
  );

  for (const user of demoUsers) {
    await assertNoError(
      `delete auth user ${user.email}`,
      await client.auth.admin.deleteUser(user.id)
    );
  }
}

async function deleteAllRows(client, table) {
  const result = await client.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (result.error) {
    const message = result.error.message ?? "";
    if (result.error.code === "42P01" || message.includes("does not exist")) {
      console.log(`Skip ${table} (table missing)`);
      return;
    }
    throw new Error(`delete ${table}: ${result.error.code || "unknown"} ${message}`);
  }
}

async function deleteAllRowsCompositeKey(client, table, keyColumn) {
  const result = await client.from(table).delete().neq(keyColumn, "00000000-0000-0000-0000-000000000000");
  if (result.error) {
    const message = result.error.message ?? "";
    if (result.error.code === "42P01" || message.includes("does not exist")) {
      console.log(`Skip ${table} (table missing)`);
      return;
    }
    throw new Error(`delete ${table}: ${result.error.code || "unknown"} ${message}`);
  }
}

async function clearAppRows(client) {
  await deleteAllRows(client, "redemptions");
  await deleteAllRows(client, "points_ledger");
  await deleteAllRows(client, "selection_items");
  await deleteAllRows(client, "challenge_progress");
  await deleteAllRowsCompositeKey(client, "employee_login_days", "employee_id");
  await deleteAllRowsCompositeKey(client, "employer_disabled_challenge_templates", "employer_id");
  await deleteAllRows(client, "selection_requests");
  await deleteAllRows(client, "challenges");
  await deleteAllRows(client, "challenge_definitions");
  await deleteAllRowsCompositeKey(client, "employer_enabled_benefits", "employer_id");
  await deleteAllRows(client, "employer_wallet_cards");
  await deleteAllRows(client, "employer_invites");
  await deleteAllRows(client, "benefits");
  await deleteAllRows(client, "provider_profiles");
  await deleteAllRows(client, "users");
  await deleteAllRows(client, "companies");
}

async function createAuthUser(client, account) {
  const result = await client.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: {
      name: account.name,
      role: account.role
    }
  });

  return assertNoError(`create auth user ${account.email}`, result);
}

async function main() {
  const url = requireEnv("EXPO_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log("Clearing demo app rows...");
  await clearAppRows(client);

  console.log("Clearing demo auth users...");
  await deleteDemoAuthUsers(client);

  console.log("Creating accounts...");
  const authByEmail = {};
  for (const account of accounts) {
    const authUser = await createAuthUser(client, account);
    authByEmail[account.email] = authUser.user.id;
  }

  const employer = await assertNoError(
    "insert employer",
    await client
      .from("users")
      .insert({
        auth_user_id: authByEmail["employer@perx.ai"],
        name: "PerX Employer",
        email: "employer@perx.ai",
        role: "employer",
        points_balance: 0
      })
      .select("id")
      .single()
  );

  const company = await assertNoError(
    "insert company",
    await client
      .from("companies")
      .insert({
        name: "PerX Company",
        country: "Albania",
        city: "Tirana",
        currency: "ALL",
        employer_id: employer.id,
        monthly_budget_per_employee: 0
      })
      .select("id")
      .single()
  );

  await assertNoError(
    "connect employer company",
    await client.from("users").update({ company_id: company.id }).eq("id", employer.id)
  );

  await assertNoError(
    "insert employee",
    await client
      .from("users")
      .insert({
        auth_user_id: authByEmail["employee@perx.ai"],
        name: "PerX Employee",
        email: "employee@perx.ai",
        role: "employee",
        company_id: company.id,
        years_employed: 0,
        points_balance: 0
      })
  );

  console.log("Accounts ready:");
  for (const account of accounts) {
    console.log(`${account.role}: ${account.email} / ${password}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
