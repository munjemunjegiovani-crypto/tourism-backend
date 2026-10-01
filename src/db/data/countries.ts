/**
 * Countries and their main cities.
 * Coordinates are approximate (good enough for maps and distances, not navigation).
 * Practical details (visas, safety) change: the site tells travellers to check official sources.
 */

export type CitySeed = { slug: string; name: string; region?: string; lat: number; lng: number; popular?: boolean };

export type CountrySeed = {
  slug: string;
  iso: string;
  name: string;
  flag: string;
  africaRegion: "West" | "Central" | "East" | "Southern" | "North" | "Indian Ocean";
  tagline: string;
  intro: string;
  capital: string;
  currency: string;
  languages: string[];
  bestTime: string;
  duration: string;
  budget: string;
  culture: string;
  cuisine: { name: string; description: string }[];
  tips: string[];
  safety: string;
  featured?: boolean;
  sortOrder?: number;
  lat: number;
  lng: number;
  cities: CitySeed[];
};

const CHECK = "Check your government's current travel advice before booking, as conditions can change.";

export const countriesData: CountrySeed[] = [
  {
    slug: "cameroon",
    iso: "CM",
    name: "Cameroon",
    flag: "🇨🇲",
    africaRegion: "Central",
    tagline: "Land of breathtaking landscapes, wildlife and diverse cultures.",
    intro:
      "Often called “Africa in miniature”, Cameroon packs volcanoes, rainforest, savanna, highlands and Atlantic beaches into one country. You can climb Mount Cameroon in the morning of one trip and swim at Kribi a few days later, with royal palaces, primate sanctuaries and more than 250 ethnic groups in between.",
    capital: "Yaoundé",
    currency: "Central African CFA franc (XAF)",
    languages: ["French", "English", "Over 250 local languages"],
    bestTime: "November – February (dry season in the south)",
    duration: "10–14 days",
    budget: "$50 – $150 per day",
    culture:
      "Cameroon is officially bilingual in French and English and home to hundreds of ethnic groups. Traditional chiefdoms and kingdoms, such as the Bamoun sultanate in Foumban, still play an important role, and music styles like makossa and bikutsi started here.",
    cuisine: [
      { name: "Ndolé", description: "Bitterleaf stew with peanuts, often served with fish or meat and plantains." },
      { name: "Poulet DG", description: "“Director General” chicken fried with plantains and vegetables." },
      { name: "Grilled fish", description: "Whole fish grilled with spices, a favourite at Kribi and Limbe beaches." },
      { name: "Eru", description: "Finely sliced leaves cooked with waterleaf and palm oil, eaten with garri or fufu." },
    ],
    tips: [
      "Carry cash in CFA francs; cards work mainly in big hotels in Douala and Yaoundé.",
      "French is more common in most regions, English in the North-West and South-West.",
      "Book a licensed guide and porters for Mount Cameroon in Buea.",
      "Keep a copy of your passport and visa with you; ID checks are common on roads.",
    ],
    safety: `${CHECK} Many governments advise against travel to the Far North region and to the North-West and South-West regions outside main towns.`,
    featured: true,
    sortOrder: 1,
    lat: 5.7,
    lng: 12.3,
    cities: [
      { slug: "yaounde", name: "Yaoundé", region: "Centre", lat: 3.848, lng: 11.502, popular: true },
      { slug: "douala", name: "Douala", region: "Littoral", lat: 4.0511, lng: 9.7679, popular: true },
      { slug: "kribi", name: "Kribi", region: "South", lat: 2.9395, lng: 9.91, popular: true },
      { slug: "limbe", name: "Limbe", region: "South-West", lat: 4.0167, lng: 9.2, popular: true },
      { slug: "buea", name: "Buea", region: "South-West", lat: 4.156, lng: 9.241, popular: true },
      { slug: "bamenda", name: "Bamenda", region: "North-West", lat: 5.9631, lng: 10.1591 },
      { slug: "foumban", name: "Foumban", region: "West", lat: 5.727, lng: 10.9 },
      { slug: "maroua", name: "Maroua", region: "Far North", lat: 10.5956, lng: 14.3247 },
      { slug: "waza", name: "Waza", region: "Far North", lat: 11.39, lng: 14.57 },
      { slug: "rhumsiki", name: "Rhumsiki", region: "Far North", lat: 10.514, lng: 13.597 },
      { slug: "somalomo", name: "Somalomo", region: "East", lat: 3.37, lng: 12.73 },
      { slug: "mfou", name: "Mfou", region: "Centre", lat: 3.72, lng: 11.64 },
    ],
  },
  {
    slug: "kenya",
    iso: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    africaRegion: "East",
    tagline: "Discover iconic wildlife, beaches and unforgettable safaris.",
    intro:
      "Kenya is the classic safari country: the Maasai Mara's great migration, elephants under Kilimanjaro at Amboseli and flamingo-pink lakes in the Rift Valley. Add Swahili towns and white-sand beaches on the Indian Ocean and it's easy to see why so many first trips to Africa start here.",
    capital: "Nairobi",
    currency: "Kenyan shilling (KES)",
    languages: ["Swahili", "English"],
    bestTime: "July – October for the migration; January – February is also dry",
    duration: "8–12 days",
    budget: "$100 – $300 per day (safaris cost more)",
    culture:
      "More than 40 communities live in Kenya, including the Maasai and Samburu known for their beadwork, and the Swahili of the coast with their centuries of Indian Ocean trade.",
    cuisine: [
      { name: "Nyama choma", description: "Grilled meat, usually goat or beef, shared with friends." },
      { name: "Ugali and sukuma wiki", description: "Maize meal with sautéed collard greens, the everyday staple." },
      { name: "Pilau", description: "Spiced rice from the coast, cooked with meat and whole spices." },
    ],
    tips: [
      "M-Pesa mobile money is used almost everywhere; cards work in cities and lodges.",
      "Park fees are paid electronically at most national parks.",
      "Pack layers: mornings on safari are cold even near the equator.",
    ],
    safety: `${CHECK} Some areas near the Somali border are subject to advisories.`,
    featured: true,
    sortOrder: 2,
    lat: 0.0,
    lng: 37.9,
    cities: [
      { slug: "nairobi", name: "Nairobi", lat: -1.2921, lng: 36.8219, popular: true },
      { slug: "mombasa", name: "Mombasa", lat: -4.0435, lng: 39.6682, popular: true },
      { slug: "diani", name: "Diani", lat: -4.3167, lng: 39.5833 },
      { slug: "narok", name: "Narok", lat: -1.0833, lng: 35.8667 },
      { slug: "nakuru", name: "Nakuru", lat: -0.3031, lng: 36.08, popular: true },
      { slug: "nanyuki", name: "Nanyuki", lat: 0.0167, lng: 37.0667 },
      { slug: "lamu", name: "Lamu", lat: -2.2717, lng: 40.902 },
      { slug: "amboseli", name: "Amboseli", lat: -2.65, lng: 37.25 },
    ],
  },
  {
    slug: "tanzania",
    iso: "TZ",
    name: "Tanzania",
    flag: "🇹🇿",
    africaRegion: "East",
    tagline: "Explore Serengeti, Zanzibar and Mount Kilimanjaro.",
    intro:
      "Tanzania has Africa's highest mountain, its most famous savanna and an island whose name sounds like spice. Climb Kilimanjaro, watch the wildebeest cross the Serengeti, descend into the Ngorongoro Crater, then recover on the beaches of Zanzibar.",
    capital: "Dodoma",
    currency: "Tanzanian shilling (TZS)",
    languages: ["Swahili", "English"],
    bestTime: "June – October (dry season)",
    duration: "10–14 days",
    budget: "$120 – $350 per day (safaris and climbs cost more)",
    culture:
      "Swahili culture shapes the coast and Zanzibar, while the north is home to Maasai, Chagga and many other communities. Tanzania's unity is often credited to Swahili as a shared national language.",
    cuisine: [
      { name: "Zanzibar pizza", description: "Stuffed and folded street snack cooked on a hot plate at Forodhani Gardens." },
      { name: "Mishkaki", description: "Marinated meat skewers grilled over charcoal." },
      { name: "Urojo", description: "Tangy Zanzibari soup with bhajia, potatoes and chutney." },
    ],
    tips: [
      "US dollars are widely used for park fees, safaris and climbs.",
      "Choose a licensed Kilimanjaro operator that treats porters fairly.",
      "Dress modestly in Stone Town and other Muslim communities.",
    ],
    safety: `${CHECK} Areas near the Mozambique border are subject to advisories.`,
    featured: true,
    sortOrder: 3,
    lat: -6.4,
    lng: 34.9,
    cities: [
      { slug: "arusha", name: "Arusha", lat: -3.3869, lng: 36.683, popular: true },
      { slug: "moshi", name: "Moshi", lat: -3.3349, lng: 37.3404, popular: true },
      { slug: "stone-town", name: "Stone Town", region: "Zanzibar", lat: -6.163, lng: 39.188, popular: true },
      { slug: "nungwi", name: "Nungwi", region: "Zanzibar", lat: -5.7264, lng: 39.2981 },
      { slug: "dar-es-salaam", name: "Dar es Salaam", lat: -6.7924, lng: 39.2083, popular: true },
      { slug: "serengeti", name: "Serengeti", lat: -2.3333, lng: 34.8333 },
      { slug: "karatu", name: "Karatu", lat: -3.3383, lng: 35.6719 },
    ],
  },
  {
    slug: "south-africa",
    iso: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    africaRegion: "Southern",
    tagline: "Experience vibrant cities, dramatic landscapes and incredible wildlife.",
    intro:
      "From Table Mountain above Cape Town to the Big Five in Kruger, South Africa makes big landscapes easy to reach. Good roads, winelands, penguin beaches and the Drakensberg mountains make it ideal for a self-drive trip.",
    capital: "Pretoria (executive)",
    currency: "South African rand (ZAR)",
    languages: ["11 official languages, including Zulu, Xhosa, Afrikaans and English"],
    bestTime: "September – May for the Cape; May – September for Kruger safaris",
    duration: "10–16 days",
    budget: "$80 – $220 per day",
    culture:
      "The “Rainbow Nation” brings together Zulu, Xhosa, Sotho, Afrikaner, Indian and many other cultures. Robben Island and the Apartheid Museum tell the story of the long fight for democracy.",
    cuisine: [
      { name: "Braai", description: "The South African barbecue, with boerewors sausage and grilled meat." },
      { name: "Bobotie", description: "Spiced minced meat baked with an egg topping, from Cape Malay cooking." },
      { name: "Bunny chow", description: "Durban curry served in a hollowed-out loaf of bread." },
    ],
    tips: [
      "Hire a car for the Garden Route and Winelands; drive on the left.",
      "Book Robben Island ferry tickets in advance.",
      "Use registered taxis or ride-hailing apps in cities at night.",
    ],
    safety: `${CHECK} Take normal big-city precautions, especially after dark.`,
    featured: true,
    sortOrder: 4,
    lat: -30.6,
    lng: 24.0,
    cities: [
      { slug: "cape-town", name: "Cape Town", region: "Western Cape", lat: -33.9249, lng: 18.4241, popular: true },
      { slug: "johannesburg", name: "Johannesburg", region: "Gauteng", lat: -26.2041, lng: 28.0473, popular: true },
      { slug: "durban", name: "Durban", region: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218, popular: true },
      { slug: "skukuza", name: "Skukuza", region: "Mpumalanga", lat: -24.9964, lng: 31.5924 },
      { slug: "simons-town", name: "Simon's Town", region: "Western Cape", lat: -34.1923, lng: 18.4335 },
      { slug: "bergville", name: "Bergville", region: "KwaZulu-Natal", lat: -28.73, lng: 29.36 },
    ],
  },
  {
    slug: "morocco",
    iso: "MA",
    name: "Morocco",
    flag: "🇲🇦",
    africaRegion: "North",
    tagline: "Discover ancient cities, deserts, mountains and rich traditions.",
    intro:
      "Morocco is a feast for the senses: the labyrinth medinas of Fes and Marrakech, the blue streets of Chefchaouen, kasbahs in the Atlas foothills and the Sahara's orange dunes at Erg Chebbi. Mint tea and hospitality come with every stop.",
    capital: "Rabat",
    currency: "Moroccan dirham (MAD)",
    languages: ["Arabic", "Tamazight (Berber)", "French widely spoken"],
    bestTime: "March – May and September – November",
    duration: "8–12 days",
    budget: "$50 – $150 per day",
    culture:
      "Amazigh (Berber), Arab, Andalusian and African influences meet in Morocco's music, architecture and crafts, from zellige tilework to woven carpets.",
    cuisine: [
      { name: "Tagine", description: "Slow-cooked stew of meat or vegetables with spices and preserved lemon." },
      { name: "Couscous", description: "Traditionally served on Fridays with seven vegetables." },
      { name: "Mint tea", description: "Green tea with fresh mint and sugar, poured from a height." },
    ],
    tips: [
      "Agree on prices before taxi rides and guided tours.",
      "Riads inside the medina are a memorable place to stay.",
      "Dress modestly, especially when visiting religious sites and rural areas.",
    ],
    safety: CHECK,
    featured: true,
    sortOrder: 5,
    lat: 31.8,
    lng: -7.1,
    cities: [
      { slug: "marrakech", name: "Marrakech", lat: 31.6295, lng: -7.9811, popular: true },
      { slug: "fes", name: "Fes", lat: 34.0331, lng: -5.0003, popular: true },
      { slug: "chefchaouen", name: "Chefchaouen", lat: 35.1688, lng: -5.2636, popular: true },
      { slug: "merzouga", name: "Merzouga", lat: 31.0802, lng: -4.0134 },
      { slug: "essaouira", name: "Essaouira", lat: 31.5085, lng: -9.7595 },
      { slug: "ouarzazate", name: "Ouarzazate", lat: 30.9189, lng: -6.8934 },
      { slug: "casablanca", name: "Casablanca", lat: 33.5731, lng: -7.5898, popular: true },
    ],
  },
  {
    slug: "egypt",
    iso: "EG",
    name: "Egypt",
    flag: "🇪🇬",
    africaRegion: "North",
    tagline: "Walk among pharaohs, temples and the timeless Nile.",
    intro:
      "Egypt holds some of humanity's oldest wonders: the Pyramids of Giza, the temples of Luxor and Karnak, and Abu Simbel on the edge of Lake Nasser. Between monuments, sail the Nile on a felucca or dive the coral reefs of the Red Sea.",
    capital: "Cairo",
    currency: "Egyptian pound (EGP)",
    languages: ["Arabic", "English widely spoken in tourism"],
    bestTime: "October – April",
    duration: "8–12 days",
    budget: "$40 – $140 per day",
    culture:
      "Five thousand years of history sit alongside a lively modern Egyptian culture of cafés, music and film. Cairo is one of the great cities of the Arab world.",
    cuisine: [
      { name: "Koshari", description: "Rice, lentils, pasta and crispy onions with tomato sauce." },
      { name: "Ful medames", description: "Slow-cooked fava beans, the classic Egyptian breakfast." },
      { name: "Ta'ameya", description: "Egyptian falafel made with fava beans." },
    ],
    tips: [
      "Buy a combined ticket or hire an Egyptologist guide for Luxor's West Bank.",
      "Carry small notes for tips (baksheesh).",
      "Start early: sites are cooler and quieter in the morning.",
    ],
    safety: `${CHECK} Some border areas and parts of North Sinai are subject to advisories.`,
    featured: true,
    sortOrder: 6,
    lat: 26.8,
    lng: 30.8,
    cities: [
      { slug: "cairo", name: "Cairo", lat: 30.0444, lng: 31.2357, popular: true },
      { slug: "giza", name: "Giza", lat: 30.0131, lng: 31.2089, popular: true },
      { slug: "luxor", name: "Luxor", lat: 25.6872, lng: 32.6396, popular: true },
      { slug: "aswan", name: "Aswan", lat: 24.0889, lng: 32.8998, popular: true },
      { slug: "abu-simbel", name: "Abu Simbel", lat: 22.3372, lng: 31.6258 },
      { slug: "sharm-el-sheikh", name: "Sharm El Sheikh", lat: 27.9158, lng: 34.33 },
    ],
  },
  {
    slug: "rwanda",
    iso: "RW",
    name: "Rwanda",
    flag: "🇷🇼",
    africaRegion: "East",
    tagline: "Meet mountain gorillas in the land of a thousand hills.",
    intro:
      "Rwanda is small, green and easy to travel. Its headline experience is trekking to mountain gorillas in Volcanoes National Park, but chimpanzees in Nyungwe, savanna safaris in Akagera and the lakeshore towns of Lake Kivu make it worth a longer stay.",
    capital: "Kigali",
    currency: "Rwandan franc (RWF)",
    languages: ["Kinyarwanda", "English", "French", "Swahili"],
    bestTime: "June – September and December – February",
    duration: "6–9 days",
    budget: "$100 – $250 per day (gorilla permits extra)",
    culture:
      "Rwanda's shared language Kinyarwanda, intore dance and the monthly community work day (umuganda) are part of everyday life. The Kigali Genocide Memorial is an essential, sobering visit.",
    cuisine: [
      { name: "Brochettes", description: "Goat or beef skewers, often with grilled plantains." },
      { name: "Isombe", description: "Cassava leaves cooked with aubergine and spinach." },
      { name: "Rwandan coffee", description: "Highland-grown arabica, best tasted at a washing station visit." },
    ],
    tips: [
      "Book gorilla permits months ahead through the official channel or a tour operator.",
      "Plastic bags are banned; don't pack them.",
      "Kigali is very walkable and clean; moto-taxis are cheap for short rides.",
    ],
    safety: `${CHECK} Areas near the border with the DR Congo may be subject to advisories.`,
    featured: true,
    sortOrder: 7,
    lat: -1.94,
    lng: 29.87,
    cities: [
      { slug: "kigali", name: "Kigali", lat: -1.9441, lng: 30.0619, popular: true },
      { slug: "musanze", name: "Musanze", lat: -1.4998, lng: 29.6347, popular: true },
      { slug: "gisenyi", name: "Rubavu (Gisenyi)", lat: -1.7027, lng: 29.2563 },
      { slug: "nyamasheke", name: "Nyamasheke", lat: -2.3333, lng: 29.0833 },
      { slug: "kayonza", name: "Kayonza", lat: -1.9, lng: 30.5 },
    ],
  },
  {
    slug: "ghana",
    iso: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    africaRegion: "West",
    tagline: "Warm welcomes, coastal castles and vibrant markets.",
    intro:
      "Ghana is known for its hospitality and its history. The coastal castles of Cape Coast and Elmina tell the story of the transatlantic slave trade, Kakum's canopy walkway floats above the rainforest, and Accra's music and markets never slow down.",
    capital: "Accra",
    currency: "Ghanaian cedi (GHS)",
    languages: ["English", "Akan (Twi)", "Ewe", "Ga and others"],
    bestTime: "November – March",
    duration: "7–10 days",
    budget: "$50 – $140 per day",
    culture:
      "Kente cloth, Ashanti royal traditions in Kumasi, highlife music and adinkra symbols are part of a proud and lively culture.",
    cuisine: [
      { name: "Jollof rice", description: "Tomato-rich spiced rice, the subject of a friendly West African rivalry." },
      { name: "Fufu with light soup", description: "Pounded cassava and plantain with a spicy broth." },
      { name: "Kelewele", description: "Spicy fried plantain cubes sold at night by street vendors." },
    ],
    tips: [
      "Mobile money (MoMo) is widely used alongside cash.",
      "Hire a local guide at Cape Coast and Elmina castles; their stories matter.",
      "Trotros are cheap shared minibuses for short trips.",
    ],
    safety: `${CHECK} Some northern border areas are subject to advisories.`,
    featured: true,
    sortOrder: 8,
    lat: 7.9,
    lng: -1.0,
    cities: [
      { slug: "accra", name: "Accra", lat: 5.6037, lng: -0.187, popular: true },
      { slug: "cape-coast", name: "Cape Coast", lat: 5.1053, lng: -1.2466, popular: true },
      { slug: "elmina", name: "Elmina", lat: 5.0847, lng: -1.3509 },
      { slug: "kumasi", name: "Kumasi", lat: 6.6885, lng: -1.6244, popular: true },
      { slug: "tamale", name: "Tamale", lat: 9.4008, lng: -0.8393 },
      { slug: "hohoe", name: "Hohoe", lat: 7.1519, lng: 0.4736 },
    ],
  },
  {
    slug: "nigeria",
    iso: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    africaRegion: "West",
    tagline: "Africa's creative powerhouse, from Lagos beats to sacred groves.",
    intro:
      "Nigeria is the continent's most populous country and its cultural engine, home of Afrobeats and Nollywood. Beyond Lagos, discover the sacred Osun-Osogbo grove, Olumo Rock, the hot springs of Yankari and the cool plateau at Obudu.",
    capital: "Abuja",
    currency: "Nigerian naira (NGN)",
    languages: ["English", "Hausa", "Yoruba", "Igbo and 500+ others"],
    bestTime: "November – February",
    duration: "7–10 days",
    budget: "$60 – $180 per day",
    culture:
      "Hundreds of ethnic groups, festivals like the Osun-Osogbo festival, and a huge film, music and fashion scene make Nigeria endlessly creative.",
    cuisine: [
      { name: "Jollof rice", description: "Smoky party jollof, the centrepiece of every celebration." },
      { name: "Suya", description: "Spiced grilled beef skewers with yaji pepper." },
      { name: "Egusi soup", description: "Melon seed soup with leafy greens, eaten with pounded yam." },
    ],
    tips: [
      "Use reputable ride-hailing apps in Lagos and Abuja.",
      "Lagos traffic is heavy: allow extra time to get anywhere.",
      "Travel with a trusted local contact or operator outside main cities.",
    ],
    safety: `${CHECK} Several states are subject to advisories; plan routes with up-to-date local advice.`,
    featured: true,
    sortOrder: 9,
    lat: 9.1,
    lng: 8.7,
    cities: [
      { slug: "lagos", name: "Lagos", lat: 6.5244, lng: 3.3792, popular: true },
      { slug: "abuja", name: "Abuja", lat: 9.0765, lng: 7.3986, popular: true },
      { slug: "abeokuta", name: "Abeokuta", lat: 7.1475, lng: 3.3619 },
      { slug: "osogbo", name: "Osogbo", lat: 7.7827, lng: 4.5418 },
      { slug: "bauchi", name: "Bauchi", lat: 10.3158, lng: 9.8442 },
      { slug: "obudu", name: "Obudu", lat: 6.6667, lng: 9.1667 },
      { slug: "erin-ijesha", name: "Erin-Ijesha", lat: 7.5667, lng: 4.9 },
    ],
  },
  {
    slug: "namibia",
    iso: "NA",
    name: "Namibia",
    flag: "🇳🇦",
    africaRegion: "Southern",
    tagline: "Endless deserts, red dunes and star-filled skies.",
    intro:
      "Namibia is space and silence: the red dunes of Sossusvlei, the white salt pan of Etosha full of wildlife, and the fog-wrapped Skeleton Coast. It's one of Africa's best road-trip countries, with dark skies made for stargazing.",
    capital: "Windhoek",
    currency: "Namibian dollar (NAD); South African rand also accepted",
    languages: ["English", "Afrikaans", "Oshiwambo and others"],
    bestTime: "May – October (cool, dry, best for wildlife)",
    duration: "10–14 days",
    budget: "$80 – $200 per day",
    culture:
      "Himba, Herero, San and Owambo communities, German colonial towns like Swakopmund, and a strong conservation tradition shape Namibia.",
    cuisine: [
      { name: "Kapana", description: "Street-grilled beef cut into bite-sized pieces, eaten with spicy salsa." },
      { name: "Potjiekos", description: "Stew slow-cooked in a cast-iron pot over coals." },
      { name: "Game meat", description: "Oryx and kudu steaks, common on lodge menus." },
    ],
    tips: [
      "Rent a 4x4 and carry extra water and fuel on gravel roads.",
      "Distances are long: don't plan more than 400 km of gravel per day.",
      "Enter Sossusvlei at gate opening to see the dunes at sunrise.",
    ],
    safety: CHECK,
    featured: true,
    sortOrder: 10,
    lat: -22.6,
    lng: 17.1,
    cities: [
      { slug: "windhoek", name: "Windhoek", lat: -22.5609, lng: 17.0658, popular: true },
      { slug: "swakopmund", name: "Swakopmund", lat: -22.6792, lng: 14.5272, popular: true },
      { slug: "sesriem", name: "Sesriem", lat: -24.4858, lng: 15.8008 },
      { slug: "okaukuejo", name: "Okaukuejo", lat: -19.1833, lng: 15.9167 },
      { slug: "keetmanshoop", name: "Keetmanshoop", lat: -26.5833, lng: 18.1333 },
      { slug: "usakos", name: "Usakos", lat: -22.0, lng: 15.6 },
    ],
  },
  {
    slug: "senegal",
    iso: "SN",
    name: "Senegal",
    flag: "🇸🇳",
    africaRegion: "West",
    tagline: "Teranga hospitality, island history and Atlantic light.",
    intro:
      "Senegal welcomes visitors with teranga, the country's famous hospitality. Explore Dakar's art and music, the poignant island of Gorée, the pink waters of Lac Rose, colonial Saint-Louis and the mangrove channels of the Sine-Saloum Delta.",
    capital: "Dakar",
    currency: "West African CFA franc (XOF)",
    languages: ["French", "Wolof", "Pulaar, Serer and others"],
    bestTime: "November – May (dry season)",
    duration: "7–10 days",
    budget: "$50 – $140 per day",
    culture:
      "Mbalax music, wrestling (laamb), Sufi brotherhoods and a strong arts scene, from the Dak'Art biennale to colourful fishing pirogues.",
    cuisine: [
      { name: "Thieboudienne", description: "Fish and rice cooked with vegetables, Senegal's national dish." },
      { name: "Yassa", description: "Chicken or fish marinated in lemon and onions." },
      { name: "Bissap", description: "Hibiscus drink served chilled." },
    ],
    tips: [
      "Ferries to Gorée leave from Dakar port throughout the day.",
      "Sept-place shared taxis are the classic way between towns.",
      "Greetings matter: take time to say hello before asking anything.",
    ],
    safety: `${CHECK} The Casamance region has had advisories in the past.`,
    featured: true,
    sortOrder: 11,
    lat: 14.5,
    lng: -14.45,
    cities: [
      { slug: "dakar", name: "Dakar", lat: 14.7167, lng: -17.4677, popular: true },
      { slug: "saint-louis", name: "Saint-Louis", lat: 16.0179, lng: -16.4896, popular: true },
      { slug: "toubab-dialaw", name: "Toubab Dialaw", lat: 14.6, lng: -17.15 },
      { slug: "foundiougne", name: "Foundiougne", lat: 14.1333, lng: -16.4667 },
      { slug: "rufisque", name: "Rufisque", lat: 14.7154, lng: -17.2733 },
    ],
  },

  /* ---------- Countries with fewer listings for now ---------- */
  light("uganda", "UG", "Uganda", "🇺🇬", "East", "The Pearl of Africa, home of gorillas and the Nile.", "Uganda combines mountain gorillas in Bwindi, chimpanzees in Kibale and the thundering Murchison Falls, where the Nile squeezes through a narrow gorge.", "Kampala", "Ugandan shilling (UGX)", ["English", "Swahili", "Luganda"], "June – August, December – February", 1.37, 32.29, [
    { slug: "kampala", name: "Kampala", lat: 0.3476, lng: 32.5825, popular: true },
    { slug: "buhoma", name: "Buhoma", lat: -0.99, lng: 29.61 },
    { slug: "masindi", name: "Masindi", lat: 1.6744, lng: 31.715 },
  ]),
  light("ethiopia", "ET", "Ethiopia", "🇪🇹", "East", "Ancient churches, highland peaks and the birthplace of coffee.", "Ethiopia has its own calendar, alphabet and church tradition. See Lalibela's rock-hewn churches and trek the Simien Mountains among gelada monkeys.", "Addis Ababa", "Ethiopian birr (ETB)", ["Amharic", "Oromo", "Tigrinya and others"], "October – March", 9.15, 40.49, [
    { slug: "addis-ababa", name: "Addis Ababa", lat: 8.9806, lng: 38.7578, popular: true },
    { slug: "lalibela", name: "Lalibela", lat: 12.0317, lng: 39.0411 },
    { slug: "debark", name: "Debark", lat: 13.1333, lng: 37.9 },
  ]),
  light("cote-divoire", "CI", "Côte d'Ivoire", "🇨🇮", "West", "Lagoons, colonial towns and the energy of Abidjan.", "Côte d'Ivoire mixes Abidjan's skyline and nightlife with the colonial heritage town of Grand-Bassam and the rainforest of Taï National Park.", "Yamoussoukro", "West African CFA franc (XOF)", ["French", "Dioula and 60+ others"], "November – March", 7.54, -5.55, [
    { slug: "abidjan", name: "Abidjan", lat: 5.36, lng: -4.0083, popular: true },
    { slug: "grand-bassam", name: "Grand-Bassam", lat: 5.2, lng: -3.7333 },
  ]),
  light("botswana", "BW", "Botswana", "🇧🇼", "Southern", "Wild waterways and some of Africa's largest elephant herds.", "Botswana focuses on low-impact, high-quality safaris. Glide through the Okavango Delta by mokoro and watch elephants along the Chobe River.", "Gaborone", "Botswana pula (BWP)", ["English", "Setswana"], "May – October", -22.33, 24.68, [
    { slug: "maun", name: "Maun", lat: -19.9833, lng: 23.4167, popular: true },
    { slug: "kasane", name: "Kasane", lat: -17.8167, lng: 25.15 },
  ]),
  light("zambia", "ZM", "Zambia", "🇿🇲", "Southern", "The home of the walking safari.", "Zambia shares Victoria Falls with Zimbabwe and is famous for walking safaris in South Luangwa, where guides lead you on foot through leopard country.", "Lusaka", "Zambian kwacha (ZMW)", ["English", "Bemba, Nyanja and others"], "June – October", -13.13, 27.85, [
    { slug: "livingstone", name: "Livingstone", lat: -17.8419, lng: 25.8543, popular: true },
    { slug: "mfuwe", name: "Mfuwe", lat: -13.2667, lng: 31.9333 },
  ]),
  light("zimbabwe", "ZW", "Zimbabwe", "🇿🇼", "Southern", "The smoke that thunders and a great stone city.", "Zimbabwe is home to the main viewpoints of Victoria Falls and to Great Zimbabwe, the stone ruins that gave the country its name.", "Harare", "Zimbabwe Gold (ZiG); US dollars widely used", ["English", "Shona", "Ndebele and others"], "April – October", -19.02, 29.15, [
    { slug: "victoria-falls-town", name: "Victoria Falls", lat: -17.9318, lng: 25.8307, popular: true },
    { slug: "masvingo", name: "Masvingo", lat: -20.0744, lng: 30.8328 },
  ]),
  light("mauritius", "MU", "Mauritius", "🇲🇺", "Indian Ocean", "Turquoise lagoons, mountains and a melting-pot culture.", "Mauritius is ringed by coral reef and calm lagoons, with volcanic peaks inland. Le Morne Brabant is both a natural landmark and a symbol of resistance to slavery.", "Port Louis", "Mauritian rupee (MUR)", ["English", "French", "Mauritian Creole"], "May – December", -20.35, 57.55, [
    { slug: "port-louis", name: "Port Louis", lat: -20.1609, lng: 57.5012, popular: true },
    { slug: "le-morne", name: "Le Morne", lat: -20.4667, lng: 57.3333 },
  ]),
  light("seychelles", "SC", "Seychelles", "🇸🇨", "Indian Ocean", "Granite boulders, white sand and rare palms.", "The Seychelles islands are known for sculpted granite beaches like Anse Source d'Argent and the Vallée de Mai, home of the giant coco de mer palm.", "Victoria", "Seychellois rupee (SCR)", ["Seychellois Creole", "English", "French"], "April – May, October – November", -4.68, 55.49, [
    { slug: "la-digue", name: "La Digue", lat: -4.3583, lng: 55.8333, popular: true },
    { slug: "praslin", name: "Praslin", lat: -4.3167, lng: 55.7333, popular: true },
  ]),
  light("tunisia", "TN", "Tunisia", "🇹🇳", "North", "Blue-and-white villages and the ruins of Carthage.", "Tunisia packs Roman and Punic history, Saharan oases and Mediterranean beaches into a compact country. Start with Carthage and the cliff-top village of Sidi Bou Said.", "Tunis", "Tunisian dinar (TND)", ["Arabic", "French"], "March – June, September – November", 33.89, 9.54, [
    { slug: "tunis", name: "Tunis", lat: 36.8065, lng: 10.1815, popular: true },
    { slug: "sidi-bou-said", name: "Sidi Bou Said", lat: 36.8708, lng: 10.3417 },
  ]),
  light("algeria", "DZ", "Algeria", "🇩🇿", "North", "Africa's largest country and its most dramatic Sahara.", "Algeria's Sahara holds the rock-art plateau of Tassili n'Ajjer, while Algiers' whitewashed Casbah rises above the Mediterranean.", "Algiers", "Algerian dinar (DZD)", ["Arabic", "Tamazight", "French widely spoken"], "October – April", 28.03, 1.66, [
    { slug: "algiers", name: "Algiers", lat: 36.7538, lng: 3.0588, popular: true },
    { slug: "djanet", name: "Djanet", lat: 24.555, lng: 9.4847 },
  ]),
  light("madagascar", "MG", "Madagascar", "🇲🇬", "Indian Ocean", "Baobabs, lemurs and landscapes found nowhere else.", "Most of Madagascar's wildlife lives nowhere else on Earth. Walk the Avenue of the Baobabs at sunset and explore the limestone needles of the Tsingy.", "Antananarivo", "Malagasy ariary (MGA)", ["Malagasy", "French"], "April – November", -18.77, 46.87, [
    { slug: "antananarivo", name: "Antananarivo", lat: -18.8792, lng: 47.5079, popular: true },
    { slug: "morondava", name: "Morondava", lat: -20.2833, lng: 44.2833 },
  ]),
  light("mozambique", "MZ", "Mozambique", "🇲🇿", "Southern", "Island archipelagos and Indian Ocean coastline.", "Mozambique's long coast has dugong-filled archipelagos, dhow sailing and historic Island of Mozambique, a UNESCO World Heritage town.", "Maputo", "Mozambican metical (MZN)", ["Portuguese", "Makhuwa, Sena and others"], "May – November", -18.67, 35.53, [
    { slug: "maputo", name: "Maputo", lat: -25.9692, lng: 32.5732, popular: true },
    { slug: "vilankulo", name: "Vilankulo", lat: -22.0, lng: 35.3167 },
    { slug: "ilha-de-mocambique-town", name: "Ilha de Moçambique", lat: -15.0347, lng: 40.7358 },
  ]),
  light("malawi", "MW", "Malawi", "🇲🇼", "Southern", "The warm heart of Africa and its great lake.", "Malawi is friendly and relaxed, with a lake so large it feels like a sea. Lake Malawi National Park protects hundreds of colourful cichlid fish species.", "Lilongwe", "Malawian kwacha (MWK)", ["English", "Chichewa"], "May – October", -13.25, 34.3, [
    { slug: "lilongwe", name: "Lilongwe", lat: -13.9626, lng: 33.7741, popular: true },
    { slug: "cape-maclear", name: "Cape Maclear", lat: -14.0283, lng: 34.8458 },
  ]),
  light("dr-congo", "CD", "Democratic Republic of Congo", "🇨🇩", "Central", "Vast rainforests, volcanoes and mountain gorillas.", "The DR Congo holds a huge share of Africa's rainforest. Virunga, Africa's oldest national park, is home to mountain gorillas and active volcanoes.", "Kinshasa", "Congolese franc (CDF); US dollars widely used", ["French", "Lingala", "Swahili and others"], "June – September", -4.04, 21.76, [
    { slug: "kinshasa", name: "Kinshasa", lat: -4.4419, lng: 15.2663, popular: true },
    { slug: "goma", name: "Goma", lat: -1.6585, lng: 29.2205 },
  ]),
  light("congo", "CG", "Republic of Congo", "🇨🇬", "Central", "Pristine forests and lowland gorillas.", "The Republic of Congo protects large blocks of Central African rainforest, including Odzala-Kokoua, known for western lowland gorillas and forest elephants.", "Brazzaville", "Central African CFA franc (XAF)", ["French", "Lingala", "Kituba"], "June – September", -0.23, 15.83, [
    { slug: "brazzaville", name: "Brazzaville", lat: -4.2634, lng: 15.2429, popular: true },
    { slug: "mbomo", name: "Mbomo", lat: 0.42, lng: 14.68 },
  ]),
];

/** Short entries for countries with fewer listings; details can be filled in later. */
function light(
  slug: string,
  iso: string,
  name: string,
  flag: string,
  africaRegion: CountrySeed["africaRegion"],
  tagline: string,
  intro: string,
  capital: string,
  currency: string,
  languages: string[],
  bestTime: string,
  lat: number,
  lng: number,
  cities: CitySeed[],
): CountrySeed {
  return {
    slug,
    iso,
    name,
    flag,
    africaRegion,
    tagline,
    intro,
    capital,
    currency,
    languages,
    bestTime,
    duration: "7–10 days",
    budget: "Varies by season and style",
    culture: "",
    cuisine: [],
    tips: [],
    safety: CHECK,
    lat,
    lng,
    cities,
  };
}
