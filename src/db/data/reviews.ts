/**
 * SAMPLE reviews so pages look complete during development. Every one is stored with
 * is_sample = true and the website labels them "Sample review". Delete them before launch:
 *   DELETE FROM reviews WHERE is_sample = true;
 */
import { rng } from "./places.js";
import type { DestinationSeed } from "./types.js";

type Template = { rating: number; title: string; body: string };

const byCategory: Record<string, Template[]> = {
  wildlife: [
    { rating: 5, title: "Better than any documentary", body: "Our guide spotted animals we would never have seen ourselves. Seeing them so close at {name} was the highlight of the whole trip." },
    { rating: 5, title: "Go early, stay late", body: "The first and last hours of the day were magical. Bring binoculars and plenty of patience." },
    { rating: 4, title: "Amazing, but plan ahead", body: "Wonderful wildlife at {name}. Book permits and transport early in high season, and pack warm layers for the mornings." },
  ],
  mountains: [
    { rating: 5, title: "Hard work, worth every step", body: "The climb was tough but our guide and porters were brilliant. The views from the top of {name} are unforgettable." },
    { rating: 4, title: "Check the weather", body: "Clouds came in by midday, so start as early as you can. Good boots and rain gear are essential." },
    { rating: 5, title: "A trip highlight", body: "Changing landscapes the whole way. Take your time and drink lots of water." },
  ],
  beaches: [
    { rating: 5, title: "Pure relaxation", body: "Soft sand, warm water and the freshest grilled fish. We extended our stay at {name} by two days." },
    { rating: 4, title: "Beautiful and calm", body: "Lovely beach, best on weekdays when it's quieter. Bring cash for the small restaurants." },
    { rating: 5, title: "Sunsets to remember", body: "Every evening the sky put on a show. Perfect after a busy week of travelling." },
  ],
  nature: [
    { rating: 5, title: "Breathtaking", body: "Photos don't do {name} justice. Go with a local guide who can tell you the stories behind the place." },
    { rating: 4, title: "Worth the journey", body: "The road there is long but the scenery makes up for it. Wear good shoes." },
    { rating: 5, title: "Peaceful and beautiful", body: "We spent a whole day and didn't want to leave. Mornings are the best time to visit." },
  ],
  historical: [
    { rating: 5, title: "History comes alive", body: "Our guide at {name} was passionate and knowledgeable. It's one thing to read about it and another to be there." },
    { rating: 5, title: "Moving and important", body: "A place everyone should visit. Give yourself time to take it all in." },
    { rating: 4, title: "Go early", body: "Fascinating, but it gets hot and busy by late morning. Arrive at opening time." },
  ],
  culture: [
    { rating: 5, title: "Full of life", body: "Colours, sounds, food and friendly people everywhere. {name} was the most memorable part of our trip." },
    { rating: 4, title: "Take a local guide", body: "Easy to get lost, which is half the fun, but a guide helped us understand what we were seeing." },
    { rating: 5, title: "Unique atmosphere", body: "We loved wandering without a plan and stopping for tea and snacks." },
  ],
  adventure: [
    { rating: 5, title: "Adrenaline and views", body: "One of the most exciting things we've done. The team at {name} took safety seriously." },
    { rating: 5, title: "Unforgettable nights", body: "The silence and the stars were incredible. Bring a warm layer for the evening." },
    { rating: 4, title: "Plan your logistics", body: "Remote and spectacular. Organise transport in advance and carry extra water." },
  ],
  cities: [
    { rating: 4, title: "Energetic and friendly", body: "Busy streets, great food and plenty to see. Two days in {name} felt about right." },
    { rating: 5, title: "Great food scene", body: "We ate our way through the city. Ask locals where they eat, not the hotel." },
    { rating: 4, title: "Traffic but worth it", body: "Traffic can be heavy, so plan your days by neighbourhood. Markets and museums were highlights." },
  ],
  art: [
    { rating: 5, title: "World-class collection", body: "We could have spent a whole day at {name}. Plan at least half a day." },
    { rating: 4, title: "Impressive", body: "Beautifully presented. Go early to avoid the crowds." },
    { rating: 5, title: "Don't miss it", body: "A perfect introduction to the history of the region." },
  ],
};

const reviewers = [
  ["Amara N.", "Nigeria"], ["Lukas M.", "Germany"], ["Chloé R.", "France"], ["Daniel K.", "Kenya"], ["Grace T.", "Cameroon"],
  ["Hiroshi S.", "Japan"], ["Fatou D.", "Senegal"], ["James O.", "United Kingdom"], ["Sofia L.", "Spain"], ["Kwame A.", "Ghana"],
  ["Emily W.", "United States"], ["Youssef B.", "Morocco"], ["Thandiwe M.", "South Africa"], ["Marco P.", "Italy"], ["Aisha H.", "Tanzania"],
];

const visited = ["November 2025", "December 2025", "January 2026", "February 2026", "March 2026", "July 2025", "August 2025", "October 2025"];

export function sampleReviewsFor(d: DestinationSeed) {
  const r = rng(`reviews-${d.slug}`);
  const templates = byCategory[d.category] ?? byCategory.nature;
  // Popular places get a few more sample reviews
  const count = (d.popularity ?? 50) >= 80 ? 3 : 2;
  const used = new Set<number>();
  return Array.from({ length: count }, (_, i) => {
    const t = templates[i % templates.length];
    let who = Math.floor(r() * reviewers.length);
    while (used.has(who)) who = (who + 1) % reviewers.length;
    used.add(who);
    const daysAgo = Math.floor(r() * 300) + 10;
    return {
      authorName: reviewers[who][0],
      authorCountry: reviewers[who][1],
      rating: t.rating,
      title: t.title,
      body: t.body.replaceAll("{name}", d.name),
      visitedOn: visited[Math.floor(r() * visited.length)],
      createdAt: new Date(Date.now() - daysAgo * 86_400_000),
    };
  });
}
