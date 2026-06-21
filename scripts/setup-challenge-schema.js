require("dotenv").config({ path: ".env" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const challengeTables = [
  "challenge_definitions",
  "challenge_progress",
  "employee_login_days",
  "employer_disabled_challenge_templates"
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.includes("your-") || value.includes("your_")) {
    throw new Error(`${name} is missing or still looks like a placeholder`);
  }
  return value;
}

async function tableExists(client, tableName) {
  const result = await client.from(tableName).select("*").limit(1);
  if (!result.error) return true;
  if (result.error.code === "PGRST205") return false;
  throw new Error(`table ${tableName}: ${result.error.message}`);
}

async function runSqlWithPg(sql) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) return false;

  let pg;
  try {
    pg = require("pg");
  } catch {
    console.error("Install pg to run SQL automatically: npm install --save-dev pg");
    return false;
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    return true;
  } finally {
    await client.end();
  }
}

async function main() {
  const url = requireEnv("EXPO_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const sqlPath = path.join(__dirname, "..", "supabase", "challenge-schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  console.log("Checking challenge tables...");
  const missing = [];
  for (const table of challengeTables) {
    const exists = await tableExists(client, table);
    console.log(`${exists ? "ok" : "missing"} ${table}`);
    if (!exists) missing.push(table);
  }

  if (!missing.length) {
    console.log("Challenge schema is already installed.");
    return;
  }

  console.log("\nMissing tables:", missing.join(", "));
  const migrated = await runSqlWithPg(sql);
  if (!migrated) {
    console.log("\nAutomatic migration needs SUPABASE_DB_URL (postgres connection string) in .env.");
    console.log("Or paste this file into Supabase SQL Editor and run it:");
    console.log(sqlPath);
    process.exitCode = 1;
    return;
  }

  console.log("SQL migration applied. Re-checking tables...");
  for (const table of challengeTables) {
    const exists = await tableExists(client, table);
    if (!exists) {
      throw new Error(`Table ${table} is still missing after migration.`);
    }
    console.log(`ok ${table}`);
  }

  console.log("Challenge schema is ready.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
