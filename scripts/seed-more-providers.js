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

function pointsToAll(points) {
  return Math.round(Math.max(0, points) * 10);
}

const newProviders = [
  {
    email: "spar@perx.ai",
    profile: {
      business_name: "SPAR",
      logo_url:
        "https://imageproxy.wolt.com/mes-image/8d7ba996-5d2a-402a-a70d-a5dcbba02e09/0fd90374-dfbb-47b8-bfba-bff41c8def9c",
      description:
        "SPAR supermarkets in Tirana — daily groceries, fresh produce, and household essentials. Shop in-store at Mine Peza, Juridiku, Kombinat, and more, or order delivery via Wolt.",
      category: "Food",
      city: "Tirana"
    },
    offers: [
      {
        title: "Weekly Essentials Basket",
        description:
          "PerX perk on a curated basket of SPAR staples — bread, milk, eggs, seasonal fruit, and pantry basics for the work week in Tirana.",
        discount: "10% off basket",
        pointsPrice: 55,
        imageUrl:
          "https://imageproxy.wolt.com/mes-image/8d7ba996-5d2a-402a-a70d-a5dcbba02e09/0fd90374-dfbb-47b8-bfba-bff41c8def9c",
        category: "Food",
        city: "Tirana"
      },
      {
        title: "Fresh Produce Bundle",
        description:
          "Seasonal fruit and vegetable bundle sourced through SPAR Albania's fresh supply chain — ideal for healthy lunches and family meals.",
        discount: "Bundle perk",
        pointsPrice: 45,
        imageUrl:
          "https://imageproxy.wolt.com/mes-image/8d7ba996-5d2a-402a-a70d-a5dcbba02e09/0fd90374-dfbb-47b8-bfba-bff41c8def9c",
        category: "Food",
        city: "Tirana"
      }
    ]
  },
  {
    email: "jumbo@perx.ai",
    profile: {
      business_name: "Jumbo",
      logo_url:
        "https://assets.gy.digital/wYcdTwJiyIr9dGZ1RQAdbc77nh0=/x/filters:fill(white)/s3.gy.digital%2Fjumbo_al%2Fuploads%2Fasset%2Fdata%2F6%2Flogo.png",
      description:
        "Jumbo Albania — home, organization, toys, school supplies, and seasonal décor at stores across Tirana and nationwide. Part of the Balfin Group retail network.",
      category: "Family",
      city: "Tirana"
    },
    offers: [
      {
        title: "Home Kitchen Starter Set",
        description:
          "PerX members save on Jumbo kitchen and dining picks — cookware, storage, and tableware essentials for setting up or refreshing your home.",
        discount: "15% off kitchen category",
        pointsPrice: 120,
        imageUrl: "https://s3.gy.digital/jumbo_al/storage/dclablh0fitq5qw34pc4ai4yba49-Kitchen.png",
        category: "Family",
        city: "Tirana"
      },
      {
        title: "Kids Toys & Games Pack",
        description:
          "Redeem points for a Jumbo toys bundle — puzzles, creative play, and family games from Albania's leading variety retailer.",
        discount: "Bundle perk",
        pointsPrice: 90,
        imageUrl: "https://s3.gy.digital/jumbo_al/storage/3sh4fyckr6m02nxktxuc7tnei8xs-Toys.png",
        category: "Family",
        city: "Tirana"
      }
    ]
  },
  {
    email: "raiffeisen@perx.ai",
    profile: {
      business_name: "Raiffeisen Bank",
      logo_url: "https://www.raiffeisen.al/apple-touch-icon.png",
      description:
        "Raiffeisen Bank Albania — personal and business banking, cards, loans, and digital services. One of the country's most established international banks, with branches across Tirana and Albania.",
      category: "Wellness",
      city: "Tirana"
    },
    offers: [
      {
        title: "Premium Debit Card Perk",
        description:
          "PerX employees qualify for reduced fees on Raiffeisen premium debit card packages — contactless payments, travel insurance add-ons, and mobile banking.",
        discount: "First year fee waived",
        pointsPrice: 200,
        imageUrl:
          "https://www.raiffeisen.al/content/dam/rbi/retail/eu/al/individuals/cards/Bej%20bankingun%20digjital%20realitet.png.transform.rbifw.png",
        category: "Wellness",
        city: "Tirana"
      },
      {
        title: "Personal Loan Rate Discount",
        description:
          "Preferential interest on Raiffeisen personal loans for PerX members — for home improvements, travel, or education with flexible repayment in ALL.",
        discount: "0.5% rate reduction",
        pointsPrice: 350,
        imageUrl:
          "https://www.raiffeisen.al/content/dam/rbi/retail/eu/al/individuals/cards/Bej%20bankingun%20digjital%20realitet.png.transform.rbifw.png",
        category: "Wellness",
        city: "Tirana"
      }
    ]
  },
  {
    email: "sportvision@perx.ai",
    profile: {
      business_name: "Sport Vision",
      logo_url: "https://www.sportvision.al/files/images/2019/9/24/SV-logo-crni-26-02-2019-drugi.png",
      description:
        "Sport Vision Albania — official retailer for Nike, adidas, Puma, New Balance, and more. Stores in Tirana, Durrës, Vlorë, and across the country for footwear, apparel, and sports gear.",
      category: "Fitness",
      city: "Tirana"
    },
    offers: [
      {
        title: "Nike Running Shoes Discount",
        description:
          "PerX perk on select Nike running and training shoes at Sport Vision — valid in-store and online at sportvision.al while stocks last.",
        discount: "20% off select Nike",
        pointsPrice: 180,
        imageUrl: "https://www.sportvision.al/files/files/logo/nike.png",
        category: "Fitness",
        city: "Tirana"
      },
      {
        title: "Gym Essentials Bundle",
        description:
          "Training tee, shorts, and gym bag bundle from Sport Vision's multi-brand floor — adidas, Puma, and Under Armour picks for your workout routine.",
        discount: "Bundle perk",
        pointsPrice: 150,
        imageUrl: "https://www.sportvision.al/files/images/2023/11/12/home.jpg",
        category: "Fitness",
        city: "Tirana"
      }
    ]
  },
  {
    email: "kfc@perx.ai",
    profile: {
      business_name: "KFC",
      logo_url: "https://imageproxy.wolt.com/assets/67335db7479a971266a710aa",
      description:
        "KFC Albania — Original Recipe chicken, buckets, burgers, and sides. It's Finger Lickin' Good at TEG and other Tirana locations, with delivery via Wolt and kfc.al.",
      category: "Food",
      city: "Tirana"
    },
    offers: [
      {
        title: "Zinger Burger Meal",
        description:
          "Spicy Zinger fillet burger with fries and a drink — one of KFC Albania's most popular meals, redeemable at participating restaurants.",
        discount: "Meal perk",
        pointsPrice: 85,
        imageUrl: "https://imageproxy.wolt.com/assets/67335db7479a971266a710aa",
        category: "Food",
        city: "Tirana"
      },
      {
        title: "Original Recipe Bucket (6 pc)",
        description:
          "Share a classic KFC bucket with six pieces of Original Recipe chicken — perfect for team lunches or family dinners in Tirana.",
        discount: "Bucket perk",
        pointsPrice: 130,
        imageUrl: "https://imageproxy.wolt.com/assets/67335db7479a971266a710aa",
        category: "Food",
        city: "Tirana"
      }
    ]
  },
  {
    email: "pizzahut@perx.ai",
    profile: {
      business_name: "Pizza Hut",
      logo_url: "https://imageproxy.wolt.com/assets/67335db3c59f3326de543d85",
      description:
        "Pizza Hut Albania — pan pizza, stuffed crust, pasta, and sides. For the Love of Pizza at TEG Tirana and delivery across the capital via Wolt.",
      category: "Food",
      city: "Tirana"
    },
    offers: [
      {
        title: "Medium Pan Pizza + Drink",
        description:
          "Choose any medium pan pizza plus a soft drink — Pizza Hut's classic combo for a quick team lunch or Friday perk in Tirana.",
        discount: "Combo perk",
        pointsPrice: 90,
        imageUrl: "https://imageproxy.wolt.com/assets/67335db3c59f3326de543d85",
        category: "Food",
        city: "Tirana"
      },
      {
        title: "Super Supreme Large Pizza",
        description:
          "Large Super Supreme loaded with pepperoni, beef, peppers, mushrooms, and mozzarella — Pizza Hut's signature feast pizza for sharing.",
        discount: "Large pizza perk",
        pointsPrice: 110,
        imageUrl: "https://imageproxy.wolt.com/assets/67335db3c59f3326de543d85",
        category: "Food",
        city: "Tirana"
      }
    ]
  },
  {
    email: "greencoast@perx.ai",
    profile: {
      business_name: "Green Coast",
      logo_url: "https://greencoast.al/wp-content/uploads/2024/05/cropped-Green-coast-logo-1-192x192.png",
      description:
        "Green Coast Resort & Residences — luxury villas and apartments on the Albanian Riviera near Vlorë. Mediterranean living with marina, beaches, restaurants, and wellness amenities.",
      category: "Wellness",
      city: "Vlorë"
    },
    offers: [
      {
        title: "Weekend Spa & Pool Day Pass",
        description:
          "Day access to Green Coast resort pools and spa facilities on the Ionian coast — a wellness escape for PerX employees from Tirana or Vlorë.",
        discount: "Day pass perk",
        pointsPrice: 220,
        imageUrl: "https://greencoast.al/wp-content/uploads/2024/10/Masterplan-GC123.jpg",
        category: "Wellness",
        city: "Vlorë"
      },
      {
        title: "Riviera Dining Experience",
        description:
          "PerX perk at Green Coast restaurants — Mediterranean seafood and Albanian coastal cuisine with sea views at the resort.",
        discount: "15% off dining",
        pointsPrice: 160,
        imageUrl: "https://greencoast.al/wp-content/uploads/2024/10/Masterplan-GC123.jpg",
        category: "Wellness",
        city: "Vlorë"
      }
    ]
  },
  {
    email: "era@perx.ai",
    profile: {
      business_name: "Era Restaurant",
      logo_url: "https://era.al/wp-content/uploads/2022/10/cropped-Logo-Converted-01-2-180x180.png",
      description:
        "Era — celebrated Tirana restaurant serving contemporary Albanian cuisine with local ingredients. A landmark dining destination on the capital's food scene since opening on Rruga Ibrahim Rugova.",
      category: "Food",
      city: "Tirana"
    },
    offers: [
      {
        title: "Traditional Albanian Lunch Menu",
        description:
          "Two-course lunch featuring Era's takes on tavë kosi, fërgesë, and seasonal salads — a taste of authentic Albanian hospitality in central Tirana.",
        discount: "Lunch perk",
        pointsPrice: 95,
        imageUrl: "https://era.al/wp-content/uploads/2023/07/restaurant-1.jpg",
        category: "Food",
        city: "Tirana"
      },
      {
        title: "Chef's Tasting Platter for Two",
        description:
          "Shared platter of Era signatures — grilled meats, house breads, and regional specialties paired for a memorable evening out in Tirana.",
        discount: "Platter perk",
        pointsPrice: 180,
        imageUrl: "https://era.al/wp-content/uploads/2023/07/restaurant-2.jpg",
        category: "Food",
        city: "Tirana"
      }
    ]
  },
  {
    email: "infinity@perx.ai",
    profile: {
      business_name: "Infinity Gym",
      logo_url: "https://www.sportvision.al/files/images/2023/11/12/home.jpg",
      description:
        "Infinity Gym — one of Albania's largest fitness chains with modern clubs in Tirana and beyond. Cardio, free weights, group classes, and personal training for every level.",
      category: "Fitness",
      city: "Tirana"
    },
    offers: [
      {
        title: "1-Month Gym Membership",
        description:
          "Full access to Infinity Gym facilities for one month — unlimited workouts, locker rooms, and open gym hours at participating Tirana locations.",
        discount: "Monthly perk",
        pointsPrice: 280,
        imageUrl: "https://www.sportvision.al/files/images/2023/11/12/home.jpg",
        category: "Fitness",
        city: "Tirana"
      },
      {
        title: "5 Personal Training Sessions",
        description:
          "Five one-on-one sessions with a certified Infinity Gym trainer — custom program for strength, weight loss, or mobility goals.",
        discount: "PT pack perk",
        pointsPrice: 350,
        imageUrl: "https://www.sportvision.al/files/images/2023/4/4/adidas_logo-new.png",
        category: "Fitness",
        city: "Tirana"
      }
    ]
  },
  {
    email: "albaniatourism@perx.ai",
    profile: {
      business_name: "Albania Tourism",
      logo_url: "https://akt.gov.al/wp-content/uploads/2025/10/Fshati_Lepushe_Shqiperi.webp",
      description:
        "Albania Tourism (AKT) — the official gateway to explore Albania. Discover the Riviera, Albanian Alps, UNESCO sites, and cultural itineraries from Tirana to the coast and highlands.",
      category: "Mobility",
      city: "Tirana"
    },
    offers: [
      {
        title: "Albanian Alps Day Tour",
        description:
          "Guided day trip to the Accursed Mountains — Theth or Valbonë viewpoints, traditional lunch, and transport from Tirana. An iconic Albanian outdoor experience.",
        discount: "Tour perk",
        pointsPrice: 300,
        imageUrl: "https://akt.gov.al/wp-content/uploads/2025/07/Theth-Desktoo-300x234.jpg",
        category: "Mobility",
        city: "Tirana"
      },
      {
        title: "Riviera & Ksamil Weekend Escape",
        description:
          "Two-day Albanian Riviera package — crystal beaches, Ksamil islands, and coastal dining along the Ionian Sea, curated through official Albania tourism partners.",
        discount: "Weekend perk",
        pointsPrice: 450,
        imageUrl: "https://akt.gov.al/wp-content/uploads/2025/07/albania-ksamil.jpg",
        category: "Mobility",
        city: "Vlorë"
      }
    ]
  }
];

async function clearProviderOffers(businessId, profileId) {
  const { data: benefits } = await client
    .from("benefits")
    .select("id")
    .or(`business_id.eq.${businessId},provider_id.eq.${profileId}`);

  const benefitIds = (benefits ?? []).map((row) => row.id);
  if (!benefitIds.length) return;

  await client.from("redemptions").delete().in("benefit_id", benefitIds);
  await client.from("selection_items").delete().in("benefit_id", benefitIds);
  await client.from("employer_enabled_benefits").delete().in("benefit_id", benefitIds);
  await client.from("benefits").delete().in("id", benefitIds);
}

async function ensureProviderAccount(entry) {
  const { data: existing } = await client
    .from("users")
    .select("id")
    .eq("email", entry.email)
    .eq("role", "business")
    .maybeSingle();

  if (existing) return existing.id;

  const { data: authData, error: authErr } = await client.auth.admin.createUser({
    email: entry.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: entry.profile.business_name,
      role: "business"
    }
  });

  if (authErr) throw new Error(`auth ${entry.email}: ${authErr.message}`);

  const { data: userRow, error: userErr } = await client
    .from("users")
    .insert({
      auth_user_id: authData.user.id,
      name: entry.profile.business_name,
      email: entry.email,
      role: "business",
      points_balance: 0
    })
    .select("id")
    .single();

  if (userErr) throw new Error(`user ${entry.email}: ${userErr.message}`);

  const { error: profileErr } = await client.from("provider_profiles").insert({
    user_id: userRow.id,
    business_name: entry.profile.business_name,
    logo_url: entry.profile.logo_url,
    description: entry.profile.description,
    category: entry.profile.category,
    city: entry.profile.city,
    is_approved: true
  });

  if (profileErr) throw new Error(`profile ${entry.profile.business_name}: ${profileErr.message}`);

  console.log(`Created account: ${entry.profile.business_name} (${entry.email})`);
  return userRow.id;
}

async function seedProvider(entry) {
  const userId = await ensureProviderAccount(entry);

  const { data: profile, error: profileError } = await client
    .from("provider_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error(`No provider profile for ${entry.email}`);

  const { error: updateError } = await client
    .from("provider_profiles")
    .update({
      business_name: entry.profile.business_name,
      logo_url: entry.profile.logo_url,
      description: entry.profile.description,
      category: entry.profile.category,
      city: entry.profile.city,
      is_approved: true
    })
    .eq("id", profile.id);

  if (updateError) throw updateError;

  await clearProviderOffers(userId, profile.id);

  for (const offer of entry.offers) {
    const { error: insertError } = await client.from("benefits").insert({
      provider_id: profile.id,
      business_id: userId,
      provider_name: entry.profile.business_name,
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      price: pointsToAll(offer.pointsPrice),
      points_price: offer.pointsPrice,
      image_url: offer.imageUrl,
      type: "nfc",
      category: offer.category,
      city: offer.city,
      is_active: true
    });

    if (insertError) throw insertError;
  }

  console.log(`Seeded ${entry.profile.business_name}: profile + ${entry.offers.length} offers`);
}

async function main() {
  console.log("Adding 10 new Albanian providers (existing 6 unchanged)...\n");
  for (const entry of newProviders) {
    await seedProvider(entry);
  }
  console.log("\nNew provider logins (password for all: perx123):");
  for (const entry of newProviders) {
    console.log(`  ${entry.email}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
