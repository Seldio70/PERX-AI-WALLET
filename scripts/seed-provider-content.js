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

function pointsToAll(points) {
  return Math.round(Math.max(0, points) * 10);
}

const providerContent = [
  {
    email: "moncheri@perx.ai",
    profile: {
      business_name: "MonCheri",
      logo_url:
        "https://i0.wp.com/moncheri.al/wp-content/uploads/2021/11/cropped-logo.png?fit=192%2C192&ssl=1",
      description:
        "MonCheri is one of Tirana's best-known coffee chains, serving specialty coffee, fresh pastries, sandwiches, and desserts since 2008. Baristas craft drinks to order across locations on Rruga e Kavajës and throughout the capital.",
      category: "Food",
      city: "Tirana"
    },
    offers: [
      {
        title: "Cappuccino & Croissant Set",
        description:
          "Employee perk: one medium cappuccino paired with a butter croissant, made fresh in-store. Valid at participating MonCheri cafés in Tirana.",
        discount: "15% off in-store",
        pointsPrice: 35,
        imageUrl:
          "https://i0.wp.com/moncheri.al/wp-content/uploads/2021/10/Home_2.jpg?fit=900%2C600&ssl=1",
        category: "Food",
        city: "Tirana"
      },
      {
        title: "Iced Latte + Muffin Combo",
        description:
          "Cool down with a classic iced latte and your choice of daily muffin or donut — a popular MonCheri pick for afternoon breaks in Tirana.",
        discount: "Combo perk",
        pointsPrice: 40,
        imageUrl: "https://imageproxy.wolt.com/assets/68540ae49910a649af7d7405",
        category: "Food",
        city: "Tirana"
      }
    ]
  },
  {
    email: "albsig@perx.ai",
    profile: {
      business_name: "Albsig",
      logo_url: "https://www.albsig.al/wp-content/uploads/2025/10/albsig-favicon.png",
      description:
        "Albsig is Albania's leading non-life insurer, operating since 2004 with 31 branches nationwide. Part of Kastrati Group, HQ at Bulevardi Bajram Curri, Tirana — covering health, auto, property, and business insurance.",
      category: "Health",
      city: "Tirana"
    },
    offers: [
      {
        title: "Student Accident Insurance Perk",
        description:
          "PerX members receive a discounted Student Accident Insurance policy for pupils and university students — coverage for medical emergencies anytime, anywhere in Albania.",
        discount: "15% off annual premium",
        pointsPrice: 250,
        imageUrl:
          "https://www.albsig.al/wp-content/uploads/2025/11/Sigurimi-nga-Aksidentet-i-nxenesve-dhe-studenteve-856x570px.jpg",
        category: "Health",
        city: "Tirana"
      },
      {
        title: "Kasko (Casco) Auto Insurance",
        description:
          "Drive with peace of mind: PerX perk on Albsig Kasko comprehensive car insurance — protection against collision, theft, and accidental damage across Albania.",
        discount: "10% off first policy",
        pointsPrice: 400,
        imageUrl:
          "https://www.albsig.al/wp-content/uploads/2025/11/Sigurimi-Kasko-856x570px.jpg",
        category: "Health",
        city: "Tirana"
      }
    ]
  },
  {
    email: "burgerking@perx.ai",
    profile: {
      business_name: "Burger King",
      logo_url: "https://imageproxy.wolt.com/assets/67ecf6562c96b3d9664b7ceb",
      description:
        "Burger King Albania — flame-grilled burgers, chicken, and sides. Have it your way at Tirana locations including Piazza, Bllok, TEG, and Liqeni, with delivery via the BK Albania app and Wolt.",
      category: "Food",
      city: "Tirana"
    },
    offers: [
      {
        title: "Whopper Meal",
        description:
          "The iconic flame-grilled Whopper with medium fries and a drink — Burger King's signature combo, redeemable at participating Tirana restaurants.",
        discount: "Meal perk",
        pointsPrice: 115,
        imageUrl: "https://imageproxy.wolt.com/assets/67ecf6562c96b3d9664b7ceb",
        category: "Food",
        city: "Tirana"
      },
      {
        title: "Chicken Royale Meal",
        description:
          "Crispy chicken fillet topped with lettuce and mayo, served as a full meal with fries and a soft drink — one of the most ordered combos on the Albanian menu.",
        discount: "Meal perk",
        pointsPrice: 95,
        imageUrl: "https://imageproxy.wolt.com/assets/67ecf6562c96b3d9664b7ceb",
        category: "Food",
        city: "Tirana"
      }
    ]
  },
  {
    email: "firehousesubs@perx.ai",
    profile: {
      business_name: "FireHouse Subs",
      logo_url: "https://imageproxy.wolt.com/assets/67a34c20d7bace4d9052bb19",
      description:
        "Firehouse Subs Albania opened its first restaurant at TEG in December 2024. Premium subs with steamed meats and cheeses, generous portions, and an open-kitchen experience — The Hero of all Subs!",
      category: "Food",
      city: "Tirana"
    },
    offers: [
      {
        title: "Hook & Ladder Sub (Regular)",
        description:
          "Smoked turkey breast, Virginia honey ham, and melted provolone with lettuce, tomato, and onion — Firehouse Subs' classic hero sub, steamed hot and served on toasted bread.",
        discount: "Regular size perk",
        pointsPrice: 65,
        imageUrl:
          "https://static.wixstatic.com/media/c5bf0b_56755ba46da44e37976148a1002ece71~mv2.jpg/v1/crop/x_18,y_0,w_1202,h_723/fill/w_900,h_540,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/hook%20%26%20ladder.jpg",
        category: "Food",
        city: "Tirana"
      },
      {
        title: "Steak & Cheese Sub (Regular)",
        description:
          "Premium steak with melted provolone, mayo, and Firehouse Subs seasoning — steamed hot in their signature steam oven for a juicy, flavorful sub at TEG Tirana.",
        discount: "Regular size perk",
        pointsPrice: 70,
        imageUrl:
          "https://static.wixstatic.com/media/c5bf0b_9dca53d6aa0c4966a6c57b68bd9f5670~mv2.jpg/v1/crop/x_0,y_87,w_607,h_365/fill/w_900,h_540,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/STEAK%20%26%20CHEESE%20M.jpg",
        category: "Food",
        city: "Tirana"
      }
    ]
  },
  {
    email: "neptun@perx.ai",
    profile: {
      business_name: "Neptun",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Neptun.png",
      description:
        "Neptun is Albania's largest consumer electronics retailer — TVs, phones, laptops, home appliances, and gaming — with 31 stores nationwide. Part of Balfin Group since 1993, with flagship locations at TEG, QTU, and across Tirana.",
      category: "Learning",
      city: "Tirana"
    },
    offers: [
      {
        title: "Samsung QLED TV Season Offer",
        description:
          "PerX perk on select Samsung QLED and Crystal UHD TVs during Neptun's seasonal campaign — valid in-store at TEG, QTU, Don Bosko, and online at neptun.al.",
        discount: "Up to 15% off select models",
        pointsPrice: 500,
        imageUrl: "https://www.neptun.al/2026/06/19/oferta-tv-bn-6a3514b24a07a.webp",
        category: "Learning",
        city: "Tirana"
      },
      {
        title: "Gaming Console & Accessories Bundle",
        description:
          "Save on gaming consoles, games, and peripherals from brands like Sony, Microsoft, and Nintendo — part of Neptun's dedicated gaming range available across Albania.",
        discount: "Bundle perk",
        pointsPrice: 180,
        imageUrl: "https://www.neptun.al/2026/05/08/gaming-banner-69fde452bc1b2.webp",
        category: "Learning",
        city: "Tirana"
      }
    ]
  },
  {
    email: "cineplexx@perx.ai",
    profile: {
      business_name: "Cineplexx",
      logo_url: "https://www.cineplexx.al/favicon-144.png",
      description:
        "Cineplexx multiplex cinemas in Albania — 7 screens at TEG (≈1,000 seats) and 4 screens at QTU (≈600 seats). Book tickets online at cineplexx.al or via the Cineplexx AL app for the latest Hollywood and European releases.",
      category: "Family",
      city: "Tirana"
    },
    offers: [
      {
        title: "2D Movie Ticket (Any Day)",
        description:
          "One standard 2D cinema ticket redeemable at Cineplexx TEG or QTU — valid for regular screenings, subject to seat availability. Book ahead on cineplexx.al.",
        discount: "1 ticket perk",
        pointsPrice: 70,
        imageUrl: "https://www.cineplexx.al/favicon-144.png",
        category: "Family",
        city: "Tirana"
      },
      {
        title: "Premium Combo (Ticket + Snacks)",
        description:
          "Movie night bundle: one 2D ticket plus popcorn and a medium soft drink — the classic Cineplexx experience at TEG or QTU in Tirana.",
        discount: "Combo perk",
        pointsPrice: 120,
        imageUrl: "https://www.cineplexx.al/favicon-144.png",
        category: "Family",
        city: "Tirana"
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

async function seedProvider(entry) {
  const { data: user, error: userError } = await client
    .from("users")
    .select("id, name")
    .eq("email", entry.email)
    .eq("role", "business")
    .maybeSingle();

  if (userError) throw userError;
  if (!user) {
    console.warn(`Skipped ${entry.email} — business user not found. Run add-providers.js first.`);
    return;
  }

  const { data: profile, error: profileError } = await client
    .from("provider_profiles")
    .select("id")
    .eq("user_id", user.id)
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

  await clearProviderOffers(user.id, profile.id);

  for (const offer of entry.offers) {
    const { error: insertError } = await client.from("benefits").insert({
      provider_id: profile.id,
      business_id: user.id,
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

  console.log(`Updated ${entry.profile.business_name}: profile + ${entry.offers.length} offers`);
}

async function main() {
  console.log("Seeding Albanian provider profiles and offers...\n");
  for (const entry of providerContent) {
    await seedProvider(entry);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
