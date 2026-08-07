/**
 * AI text generation — titles, descriptions, hashtags, keywords.
 *
 * Default: the built-in Viral Intelligence engine (deterministic, offline).
 * Set AI_PROVIDER=openai + OPENAI_API_KEY to use GPT-class models instead.
 */

import { pick, seededRng, truncate } from "@/lib/utils";
import type { Analysis, ContentPack, DescriptionOption, HashtagSet, TitleOption } from "@/types";
import { CREDIT_COSTS } from "@/lib/config";

export type GenerateKind = "titles" | "descriptions" | "hashtags" | "keywords" | "content pack";

// ---------------- Local engine ----------------

const TITLE_PATTERNS = {
  viral: [
    "I Can't Believe This Actually Worked",
    "Nobody Expected This To Happen",
    "The Internet Is Losing It Over This",
    "Wait For The End…",
    "This Went Viral For A Reason",
    "You'll Watch This More Than Once",
    "The Moment Everyone Is Talking About",
    "This Just Broke The Internet",
    "People Can't Stop Watching This",
    "The Most Insane Thing You'll See Today"
  ],
  seo: [
    "How To {topic} In 2026",
    "{topic}: The Complete Guide",
    "5 Things You Didn't Know About {topic}",
    "Why {topic} Matters More Than Ever",
    "The Truth About {topic}",
    "{topic} Explained In 60 Seconds",
    "Best {topic} Moments Compilation",
    "What Nobody Tells You About {topic}",
    "The Science Behind {topic}",
    "Ultimate {topic} Breakdown"
  ],
  clickable: [
    "Watch This Before You Scroll Past",
    "Stop Scrolling. This Is Important",
    "You Have To See This",
    "This Changes Everything",
    "1 Minute That Will Change Your Mind",
    "Don't Skip This Video",
    "This Is What Everyone Is Missing",
    "Brace Yourself For This One",
    "The Video Everyone Needs To See",
    "This Is Genius. Here's Why"
  ],
  trending: [
    "Trending: {topic} Moments",
    "Why Is {topic} Everywhere Right Now?",
    "The {topic} Trend Explained",
    "Everyone Is Doing This With {topic}",
    "{topic} Is Taking Over The Internet",
    "New {topic} Trend You Can't Miss",
    "The Viral {topic} Challenge",
    "{topic} Went Viral — Here's The Full Story",
    "This {topic} Trend Is Actually Smart",
    "The Real Story Behind The {topic} Trend"
  ]
};

const DESCRIPTION_TEMPLATES = {
  seo: `Watch the full {topic} breakdown in this short. From the opening hook to the final moment, every second is packed with value. If you enjoy {topic} content, hit subscribe and turn on notifications so you never miss an upload. Like, comment and share with a friend who needs to see this. #shorts #viralshorts #{topicTag}`,
  short: `The best {topic} moment, in 60 seconds. 🚀`,
  long: `Welcome back to the channel! In today's short we break down everything you need to know about {topic}. We cover the key moments, the biggest surprises, and exactly why this went viral. Chapters of this short highlight the strongest segments so you can jump straight to your favorite part. If you want more {topic} content, check the playlist linked below. Drop your thoughts in the comments — we read every single one. Don't forget to like, subscribe and share this video with someone who loves {topic} as much as you do.`,
  cta: `Loved this? ❤️ Follow for daily shorts. Comment your favorite part below. Share this with a friend who needs to see it. Turn on notifications — new shorts drop every day.`
};

const HASHTAG_POOL = [
  "shorts", "viralshorts", "fyp", "foryou", "viral", "trending", "mustwatch",
  "reels", "reelsinstagram", "tiktok", "youtubeshorts", "shortsfeed",
  "creator", "contentcreator", "content", "video", "explore", "discover"
];

const NICHE_TAGS: Record<string, string[]> = {
  tech: ["technology", "tech", "ai", "innovation", "gadgets", "coding", "startup"],
  fitness: ["fitness", "gym", "workout", "health", "motivation", "training"],
  food: ["food", "cooking", "recipe", "foodie", "chef", "delicious"],
  travel: ["travel", "adventure", "wanderlust", "explore", "nature", "vacation"],
  gaming: ["gaming", "gamer", "gameplay", "streamer", "esports", "videogames"],
  education: ["education", "learning", "facts", "knowledge", "tips", "howto"],
  entertainment: ["entertainment", "funny", "comedy", "celebrity", "movies"],
  business: ["business", "marketing", "money", "entrepreneur", "success", "growth"],
  default: ["tips", "howto", "mustknow", "insider", "bts", "asmr"]
};

export function generateContentPack(projectName: string, analysis: Analysis, creatorName: string, niche = "default"): Omit<ContentPack, "id" | "projectId" | "userId" | "generatedAt"> {
  const rng = seededRng(projectName + analysis.projectId + creatorName);
  const topic = topicFromProject(projectName, analysis);
  const topicTag = topic.replace(/\s+/g, "").toLowerCase();
  const nicheTags = NICHE_TAGS[niche] ?? NICHE_TAGS.default!;

  const titles: TitleOption[] = [];
  const categories = Object.keys(TITLE_PATTERNS) as (keyof typeof TITLE_PATTERNS)[];
  for (const cat of categories) {
    const pool = TITLE_PATTERNS[cat].map((t) => t.replace(/\{topic\}/g, topic));
    const chosen = shuffle2(rng, pool).slice(0, 10);
    for (const title of chosen) {
      titles.push({
        title,
        category: cat as TitleOption["category"],
        score: Math.round(62 + rng() * 34),
        hook: title.split(/[.!?]/)[0]!.slice(0, 60)
      });
    }
  }

  const descriptions: DescriptionOption[] = (Object.keys(DESCRIPTION_TEMPLATES) as (keyof typeof DESCRIPTION_TEMPLATES)[]).map((cat) => ({
    label: cat === "seo" ? "SEO Description" : cat === "short" ? "Short Description" : cat === "long" ? "Long Description" : "Call To Action",
    category: cat === "seo" ? "seo" : cat === "short" ? "short" : cat === "long" ? "long" : "cta",
    text: DESCRIPTION_TEMPLATES[cat].replace(/\{topic\}/g, topic).replace(/\{topicTag\}/g, topicTag)
  }));

  const hashtags: HashtagSet[] = [
    { label: "Trending", category: "trending", tags: pickN(rng, HASHTAG_POOL, 8) },
    { label: "Niche", category: "niche", tags: pickN(rng, nicheTags, 6) },
    { label: "SEO", category: "seo", tags: [`#${topicTag}`, "#contentcreator", "#shortform", "#editing", "#ai", "#learn"] },
    { label: "Platform", category: "platform", tags: ["#youtubeshorts", "#tiktok", "#reels", "#shorts", "#fyp"] }
  ];

  const keywords = [topic, topicTag, "viral moments", "short form video", creatorName, "ai shorts", ...pickN(rng, nicheTags, 4)];

  return { titles, descriptions, hashtags, keywords };
}

function topicFromProject(name: string, analysis: Analysis): string {
  const cleaned = truncate(name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(), 40);
  if (cleaned.length > 2) return cleaned;
  return "content";
}

function shuffle2<T>(rng: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(rng: () => number, arr: T[], n: number): T[] {
  return shuffle2(rng, arr).slice(0, Math.min(n, arr.length));
}

// ---------------- Provider (OpenAI) ----------------

async function openaiChat(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.9
    })
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]!.message.content;
}

export async function generateWithProvider(kind: GenerateKind, input: Record<string, unknown>): Promise<unknown> {
  const topic = String(input.topic ?? "content");
  const prompt = `You are a viral short-form content strategist. Generate ${kind} for a short video about "${topic}".
Return strict JSON. No markdown, no commentary.`;
  const raw = await openaiChat([{ role: "system", content: prompt }, { role: "user", content: JSON.stringify(input) }]);
  try {
    return JSON.parse(raw.replace(/```json|```/g, ""));
  } catch {
    return null;
  }
}

export async function generatePackWithProvider(projectName: string, analysis: Analysis, creatorName: string, niche: string): Promise<Omit<ContentPack, "id" | "projectId" | "userId" | "generatedAt">> {
  const out = await generateWithProvider("content pack", {
    topic: topicFromProject(projectName, analysis),
    titlesCount: 40,
    descriptionCount: 4,
    hashtagCount: 24
  });
  if (out && typeof out === "object" && "titles" in out) {
    return out as Omit<ContentPack, "id" | "projectId" | "userId" | "generatedAt">;
  }
  return generateContentPack(projectName, analysis, creatorName, niche);
}

export async function generateContent(projectName: string, analysis: Analysis, creatorName: string, niche: string): Promise<Omit<ContentPack, "id" | "projectId" | "userId" | "generatedAt">> {
  const useOpenAI = process.env.AI_PROVIDER === "openai" && !!process.env.OPENAI_API_KEY;
  if (useOpenAI) {
    try {
      return await generatePackWithProvider(projectName, analysis, creatorName, niche);
    } catch (e) {
      console.warn("Provider generation failed, using local engine:", e);
    }
  }
  return generateContentPack(projectName, analysis, creatorName, niche);
}

export const aiCreditCost = CREDIT_COSTS;
