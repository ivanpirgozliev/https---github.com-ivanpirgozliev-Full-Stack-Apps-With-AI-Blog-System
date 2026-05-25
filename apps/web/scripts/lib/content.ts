/**
 * Tiny English content generator for seed data. Combines fixed word lists +
 * sentence templates to produce realistic blog-ish prose without external
 * services or copyrighted text dumps. Output is varied enough that 10k posts
 * don't look identical at a glance, but it is obviously fake — don't ship this
 * to production users.
 */

const TOPICS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Postgres",
  "Drizzle ORM",
  "Tailwind CSS",
  "Expo",
  "React Native",
  "GraphQL",
  "REST APIs",
  "serverless functions",
  "edge computing",
  "WebAssembly",
  "Docker",
  "Kubernetes",
  "CI/CD pipelines",
  "feature flags",
  "design systems",
  "remote work",
  "monorepos",
  "open source",
  "DevOps",
  "observability",
  "performance budgets",
  "accessibility",
  "test-driven development",
  "microservices",
  "event sourcing",
  "domain-driven design",
];

const ADJECTIVES = [
  "modern",
  "scalable",
  "minimal",
  "production-ready",
  "robust",
  "elegant",
  "pragmatic",
  "type-safe",
  "battle-tested",
  "hands-on",
  "thoughtful",
  "opinionated",
  "lightweight",
  "expressive",
  "boring",
  "clever",
  "practical",
  "performant",
  "reliable",
  "delightful",
];

const VERBS = [
  "ship",
  "build",
  "design",
  "refactor",
  "deploy",
  "test",
  "monitor",
  "scale",
  "maintain",
  "document",
  "review",
  "automate",
  "rewrite",
  "instrument",
  "profile",
  "secure",
];

const NOUNS = [
  "team",
  "service",
  "app",
  "system",
  "pipeline",
  "stack",
  "platform",
  "codebase",
  "workflow",
  "project",
  "infrastructure",
  "module",
  "feature",
  "rollout",
  "migration",
];

const TITLE_TEMPLATES = [
  "How to ship {topic} like a {adj} team",
  "A {adj} guide to {topic}",
  "Why {topic} matters in 2026",
  "{topic}: a deep dive",
  "Building production apps with {topic}",
  "Lessons learned from scaling {topic}",
  "The complete handbook to {topic}",
  "{topic} for {adj} developers",
  "Five takes on {topic}",
  "{topic} vs {topic2}: which should you pick?",
  "What I wish I knew about {topic}",
  "Getting started with {topic} the right way",
  "From zero to production with {topic}",
  "Refactoring legacy code using {topic}",
  "A tour of {topic} in practice",
  "How we cut {noun} costs with {topic}",
  "Notes on {topic} after a year in production",
  "The case for {topic}",
  "Stop overthinking {topic}",
  "A weekend project with {topic}",
];

const SENTENCE_TEMPLATES = [
  "When you start working with {topic}, the first thing to understand is how it interacts with the rest of your {noun}.",
  "Most teams reach for {topic} when their {noun} gets large enough to need real discipline.",
  "There's a temptation to over-engineer this, but a {adj} approach usually wins.",
  "It pays to {verb} small slices first and watch how the {noun} behaves in production.",
  "The hardest part isn't writing the code — it's deciding what not to write.",
  "On paper, {topic} and {topic2} look interchangeable; in practice they fit very different problems.",
  "I used to {verb} every change end-to-end; now I trust the tests and the rollout pipeline to catch what I miss.",
  "If you take only one thing from this article, let it be this: keep the boring parts boring.",
  "After six months of running {topic} in production, our biggest win was cutting cold-start latency in half.",
  "We rewrote the {noun} three times before landing on something we were happy to maintain.",
  "Reviewers caught two issues that would have been painful to debug at 3am.",
  "The migration took longer than expected, but the new shape of the {noun} makes future changes much easier.",
  "Don't underestimate the value of a {adj} runbook when something goes wrong at the worst possible moment.",
  "Tooling matters far less than the team's willingness to {verb} small improvements every week.",
  "Once we wired up proper metrics, the underlying problem became obvious.",
  "Pair programming sped this up by about a day — well worth the calendar overlap.",
  "Tests caught a regression that staging didn't, which sold the whole team on {topic}.",
  "The documentation needed a lot of love before anyone outside the original authors could contribute.",
  "We picked {topic} for its ecosystem; we stayed because the upgrade path kept being smooth.",
  "There's a fine line between premature abstraction and useful indirection.",
  "Reading the source code of {topic} taught me more than any tutorial ever did.",
  "A senior engineer once told me to write the {noun} you wish you had when you started — that advice still holds.",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function fillTemplate(template: string): string {
  return template
    .replace(/\{topic2\}/g, () => pick(TOPICS))
    .replace(/\{topic\}/g, () => pick(TOPICS))
    .replace(/\{adj\}/g, () => pick(ADJECTIVES))
    .replace(/\{verb\}/g, () => pick(VERBS))
    .replace(/\{noun\}/g, () => pick(NOUNS));
}

export function makeTitle(): string {
  return fillTemplate(pick(TITLE_TEMPLATES));
}

export function makeSentence(): string {
  return fillTemplate(pick(SENTENCE_TEMPLATES));
}

export function makeExcerpt(): string {
  return `${makeSentence()} ${makeSentence()}`.slice(0, 480);
}

export function makeParagraph(): string {
  const len = 3 + Math.floor(Math.random() * 4); // 3–6 sentences
  return Array.from({ length: len }, makeSentence).join(" ");
}

export function makeContent(): string {
  const paragraphs = 3 + Math.floor(Math.random() * 3); // 3–5 paragraphs
  return Array.from({ length: paragraphs }, makeParagraph).join("\n\n");
}

export function makeComment(): string {
  const len = 1 + Math.floor(Math.random() * 3); // 1–3 sentences
  return Array.from({ length: len }, makeSentence).join(" ");
}
