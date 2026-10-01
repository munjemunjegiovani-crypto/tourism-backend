import type { ArticleBlock } from "../schema.js";

type ArticleSeed = {
  slug: string;
  section: "essentials" | "tips";
  title: string;
  emoji: string;
  summary: string;
  readingMinutes: number;
  country?: string;
  cover?: string; // destination slug
  body: ArticleBlock[];
};

const officialAdvice =
  "Rules and conditions change, so always confirm with official government sources or your embassy before you travel.";

export const articlesData: ArticleSeed[] = [
  /* ---------- Before you travel ---------- */
  {
    slug: "visa-information",
    section: "essentials",
    title: "Visa information",
    emoji: "🛂",
    summary: "How African visas usually work, from e-visas to visas on arrival.",
    readingMinutes: 3,
    cover: "goree-island",
    body: [
      { type: "p", text: "Visa rules depend on your nationality and change often. Many African countries now offer e-visas online, some offer visas on arrival, and several have visa-free entry for certain passports." },
      { type: "h2", text: "What to check before you book" },
      { type: "list", items: ["Whether you need a visa, and if it's an e-visa, visa on arrival or embassy visa", "How long processing takes", "Passport validity (often 6 months beyond your stay) and blank pages", "Yellow fever vaccination certificate requirements", "Regional visas, such as the East Africa Tourist Visa for Kenya, Rwanda and Uganda"] },
      { type: "p", text: officialAdvice },
    ],
  },
  {
    slug: "currency-and-money",
    section: "essentials",
    title: "Currency and money",
    emoji: "💱",
    summary: "Cash, cards and mobile money across the continent.",
    readingMinutes: 3,
    cover: "marrakech-medina",
    body: [
      { type: "p", text: "Each country has its own currency, but two are shared: the Central African CFA franc (XAF), used in Cameroon and Congo among others, and the West African CFA franc (XOF), used in Senegal and Côte d'Ivoire." },
      { type: "list", items: ["Carry some cash for markets, taxis and small towns", "Cards work best in cities, hotels and safari lodges", "Mobile money like M-Pesa (Kenya) and MoMo (Ghana) is widespread", "US dollars are common for park fees and safaris in East and Southern Africa", "Tell your bank before you travel"] },
    ],
  },
  {
    slug: "languages",
    section: "essentials",
    title: "Language",
    emoji: "🗣️",
    summary: "English, French, Arabic, Portuguese and a few local greetings.",
    readingMinutes: 2,
    body: [
      { type: "p", text: "Africa has more than 2,000 languages. English, French, Arabic and Portuguese are widely used for travel, and Swahili is spoken across East Africa." },
      { type: "list", items: ["Cameroon: French and English (both official)", "Kenya and Tanzania: Swahili and English", "Morocco and Egypt: Arabic, with French or English", "Senegal and Côte d'Ivoire: French", "Mozambique: Portuguese"] },
      { type: "p", text: "Learning a greeting in the local language, like “Jambo” in Swahili, always earns a smile." },
    ],
  },
  {
    slug: "weather-and-seasons",
    section: "essentials",
    title: "Weather and seasons",
    emoji: "🌦️",
    summary: "Dry and rainy seasons, and when to visit each region.",
    readingMinutes: 3,
    body: [
      { type: "p", text: "Much of tropical Africa has dry and rainy seasons rather than summer and winter. Dry seasons are usually best for safaris and hiking." },
      { type: "list", items: ["Central and West Africa: November – February is usually driest", "East Africa: June – October and January – February", "Southern Africa: May – October for safaris", "North Africa: spring and autumn are most comfortable", "Indian Ocean islands: avoid cyclone season (roughly January – March)"] },
    ],
  },
  {
    slug: "transportation",
    section: "essentials",
    title: "Getting around",
    emoji: "🚐",
    summary: "Flights, buses, shared taxis and self-drive.",
    readingMinutes: 3,
    body: [
      { type: "p", text: "Distances are big, so regional flights save a lot of time. On the ground, options range from long-distance coaches to shared minibuses and private drivers." },
      { type: "list", items: ["Domestic flights for long distances", "Coaches between major cities", "Shared taxis and minibuses for short trips (cheap but crowded)", "Self-drive works well in South Africa, Namibia and Botswana", "Hire a driver-guide for safaris and remote areas"] },
    ],
  },
  {
    slug: "internet-and-sim-cards",
    section: "essentials",
    title: "Internet and SIM cards",
    emoji: "📶",
    summary: "Staying connected with local SIMs and eSIMs.",
    readingMinutes: 2,
    body: [
      { type: "p", text: "Mobile data is usually the easiest way to stay online. Local SIM cards are cheap and available at airports and phone shops (bring your passport to register)." },
      { type: "list", items: ["Buy a local SIM or an eSIM for data", "Coverage is good in cities, weaker in parks and remote areas", "Download offline maps before long trips", "Many lodges have Wi-Fi only in common areas"] },
    ],
  },
  {
    slug: "safety",
    section: "essentials",
    title: "Safety",
    emoji: "🛡️",
    summary: "Practical habits for a safe and relaxed trip.",
    readingMinutes: 3,
    body: [
      { type: "p", text: "Most trips to Africa are trouble-free. Like anywhere, a few habits help." },
      { type: "list", items: ["Check your government's travel advice for each region you plan to visit", "Use registered taxis or ride-hailing apps at night", "Keep valuables out of sight in busy places", "Follow your guide's instructions around wildlife", "Get travel insurance that covers medical evacuation", "Talk to a travel clinic about vaccines and malaria prevention"] },
      { type: "p", text: officialAdvice },
    ],
  },
  {
    slug: "local-customs",
    section: "essentials",
    title: "Local customs",
    emoji: "🤝",
    summary: "Greetings, dress and photography etiquette.",
    readingMinutes: 2,
    body: [
      { type: "p", text: "Respect goes a long way. Customs vary, but some habits are welcome almost everywhere." },
      { type: "list", items: ["Greet people before asking a question", "Dress modestly in religious sites and rural areas", "Ask before photographing people", "Use your right hand to give and receive", "Bargain politely in markets; it's expected"] },
    ],
  },

  /* ---------- Travel tips ---------- */
  {
    slug: "10-things-to-know-before-visiting-cameroon",
    section: "tips",
    title: "10 Things to Know Before Visiting Cameroon",
    emoji: "🇨🇲",
    summary: "Practical advice for your first trip to “Africa in miniature”.",
    readingMinutes: 5,
    country: "cameroon",
    cover: "mount-cameroon",
    body: [
      { type: "p", text: "Cameroon rewards curious travellers with volcanoes, beaches, rainforest and an incredible mix of cultures. These tips will help your first trip go smoothly." },
      { type: "list", items: [
        "It's bilingual: French in most regions, English in the North-West and South-West.",
        "Carry cash in CFA francs (XAF); cards work mainly in big hotels.",
        "You'll usually need a visa and a yellow fever vaccination certificate.",
        "The dry season (November – February) is best for most of the country.",
        "Climb Mount Cameroon with a licensed guide from Buea.",
        "Kribi and Limbe are your beach options: golden sand or black volcanic sand.",
        "Try ndolé, poulet DG and grilled fish with plantains.",
        "Roads can be slow; allow more time than the map suggests.",
        "Check current travel advice for the Far North, North-West and South-West regions.",
        "Greetings matter: always say hello before asking for anything.",
      ] },
      { type: "h2", text: "Where to start" },
      { type: "destinations", slugs: ["mount-cameroon", "kribi", "lobe-falls", "limbe", "foumban-royal-palace"] },
    ],
  },
  {
    slug: "best-african-countries-for-first-time-travelers",
    section: "tips",
    title: "Best African Countries for First-Time Travelers",
    emoji: "🧭",
    summary: "Easy, rewarding places to start exploring Africa.",
    readingMinutes: 4,
    cover: "table-mountain",
    body: [
      { type: "p", text: "If it's your first trip to Africa, these countries combine great experiences with good infrastructure and plenty of tourism support." },
      { type: "h2", text: "South Africa" },
      { type: "p", text: "Good roads, Cape Town, the Winelands and self-drive safaris in Kruger make it easy to plan independently." },
      { type: "h2", text: "Kenya" },
      { type: "p", text: "The classic safari country, with the Maasai Mara and easy add-ons to the coast." },
      { type: "h2", text: "Morocco" },
      { type: "p", text: "Close to Europe, with medinas, mountains and the Sahara in one trip." },
      { type: "h2", text: "Rwanda" },
      { type: "p", text: "Small, clean and safe-feeling, with gorilla trekking as an unforgettable highlight." },
      { type: "h2", text: "Ghana" },
      { type: "p", text: "Known for its warm welcome, English-speaking and rich in history." },
      { type: "destinations", slugs: ["table-mountain", "maasai-mara", "marrakech-medina", "volcanoes-national-park", "cape-coast-castle"] },
    ],
  },
  {
    slug: "best-safari-destinations-in-africa",
    section: "tips",
    title: "Best Safari Destinations in Africa",
    emoji: "🦓",
    summary: "Where to go for the Great Migration, the Big Five and walking safaris.",
    readingMinutes: 5,
    cover: "serengeti",
    body: [
      { type: "p", text: "Every safari region has its own character. Here's how they compare." },
      { type: "h2", text: "For the Great Migration" },
      { type: "p", text: "Tanzania's Serengeti and Kenya's Maasai Mara share the migration. River crossings usually peak from July to September." },
      { type: "h2", text: "For self-drive" },
      { type: "p", text: "Kruger in South Africa and Etosha in Namibia have good roads and affordable camps." },
      { type: "h2", text: "For a water safari" },
      { type: "p", text: "Botswana's Okavango Delta and Chobe River offer mokoro and boat safaris." },
      { type: "h2", text: "For walking safaris" },
      { type: "p", text: "Zambia's South Luangwa is where walking safaris began." },
      { type: "destinations", slugs: ["serengeti", "maasai-mara", "kruger-national-park", "etosha-national-park", "okavango-delta", "south-luangwa"] },
    ],
  },
  {
    slug: "10-beautiful-african-beaches",
    section: "tips",
    title: "10 Beautiful African Beaches You Should Visit",
    emoji: "🏝️",
    summary: "From Indian Ocean islands to Atlantic surf towns.",
    readingMinutes: 4,
    cover: "anse-source-dargent",
    body: [
      { type: "p", text: "Africa's coastline is more than 30,000 km long. These beaches stand out." },
      { type: "list", items: [
        "Anse Source d'Argent, Seychelles: granite boulders and turquoise water",
        "Nungwi, Zanzibar: swimming at any tide and dhow sunsets",
        "Diani Beach, Kenya: white sand protected by a reef",
        "Kribi, Cameroon: palms, rainforest and fresh seafood",
        "Limbe, Cameroon: black volcanic sand below Mount Cameroon",
        "Bazaruto Archipelago, Mozambique: dunes and coral reefs",
        "Boulders Beach, South Africa: swim near African penguins",
        "Le Morne, Mauritius: lagoon below a UNESCO mountain",
        "Essaouira, Morocco: wind, ramparts and kitesurfing",
        "Cape Maclear, Malawi: a freshwater beach on Lake Malawi",
      ] },
      { type: "destinations", slugs: ["anse-source-dargent", "nungwi-beach", "diani-beach", "kribi", "bazaruto-archipelago"] },
    ],
  },
  {
    slug: "best-time-to-visit-east-africa",
    section: "tips",
    title: "Best Time to Visit East Africa",
    emoji: "📅",
    summary: "Month-by-month guide for Kenya, Tanzania, Rwanda and Uganda.",
    readingMinutes: 4,
    cover: "ngorongoro-crater",
    body: [
      { type: "p", text: "East Africa has two dry seasons and two rainy seasons. Timing your trip makes a real difference." },
      { type: "list", items: [
        "January – February: short dry season, calving in the southern Serengeti",
        "March – May: long rains, lush landscapes, fewer visitors and lower prices",
        "June – October: long dry season, peak safari time and migration river crossings",
        "November – December: short rains, green and quieter",
      ] },
      { type: "p", text: "Gorilla trekking in Rwanda and Uganda is possible all year, but trails are easier in the dry months." },
      { type: "destinations", slugs: ["serengeti", "maasai-mara", "volcanoes-national-park", "zanzibar-stone-town"] },
    ],
  },
];
