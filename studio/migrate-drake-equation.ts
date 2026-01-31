/**
 * Migration script to import the Drake Equation article into Sanity
 * Run with: npx ts-node migrate-drake-equation.ts
 * Or: npx sanity exec migrate-drake-equation.ts --with-user-token
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "74gy5txg",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_TOKEN, // Need write token
});

// Helper to create a unique key for blocks
const key = () => Math.random().toString(36).substring(2, 10);

// Portable Text content converted from MDX
const drakeEquationContent = [
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "In 1961, astronomer Frank Drake wrote an equation on a chalkboard that would become one of the most famous formulas in science—not because it gave us an answer, but because it gave us the right questions.",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "For worldbuilders, the Drake Equation isn't just about calculating alien civilizations. It's a ",
      },
      {
        _type: "span",
        _key: key(),
        text: "framework for thinking systematically",
        marks: ["strong"],
      },
      {
        _type: "span",
        _key: key(),
        text: " about what makes intelligent life possible.",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h2",
    children: [{ _type: "span", _key: key(), text: "The Equation" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "The Drake Equation looks like this:" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "blockquote",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "N = R* × fp × ne × fl × fi × fc × L",
        marks: ["strong"],
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [{ _type: "span", _key: key(), text: "Where:" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "N", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " = Number of civilizations we might communicate with",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "R*", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " = Rate of star formation in our galaxy",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "fp", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " = Fraction of stars with planetary systems",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "ne", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " = Number of planets that could support life per system",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "fl", marks: ["strong"] },
      { _type: "span", _key: key(), text: " = Fraction where life actually develops" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "fi", marks: ["strong"] },
      { _type: "span", _key: key(), text: " = Fraction where intelligence evolves" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "fc", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " = Fraction that develop detectable technology",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "L", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " = Length of time such civilizations release signals",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h2",
    children: [
      { _type: "span", _key: key(), text: "Why This Matters for Worldbuilding" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Each variable in the Drake Equation represents a ",
      },
      {
        _type: "span",
        _key: key(),
        text: "worldbuilding decision point",
        marks: ["strong"],
      },
      { _type: "span", _key: key(), text: ":" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Star Formation (R*)" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "How old is your galaxy? Is star formation active or winding down? What does this mean for the \"age\" of civilizations?",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Planetary Systems (fp)" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Are planets common or rare in your setting? What types of planetary systems exist? How does this affect interstellar travel and colonization?",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Habitable Worlds (ne)" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "What counts as \"habitable\" in your universe? How strict are the requirements for life? Are habitable worlds clustered or spread out?",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Life (fl)" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "How easily does life arise? Is the origin of life a common event or a miracle? What are the minimum requirements?",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Intelligence (fi)" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Is intelligence an evolutionary inevitability or a fluke? What forms can intelligence take? How does this affect your alien species designs?",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Technology (fc)" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Do all intelligent species develop technology? What kinds of technology count? Are there \"inevitable\" technologies?",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Longevity (L)" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "How long do civilizations typically last? What kills them off? What allows some to persist?",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h2",
    children: [
      { _type: "span", _key: key(), text: "Using the Drake Equation in Your Fiction" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "The Fermi Paradox Connection" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "If you set your Drake Equation variables to optimistic values, you get a crowded galaxy. If those values are even slightly accurate, ",
      },
      { _type: "span", _key: key(), text: "where is everyone?", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " This is the Fermi Paradox, and resolving it is one of the richest sources of science fiction stories.",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Your universe's answer to the Fermi Paradox shapes everything:",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "\"They're hiding\"", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " → Dark forest theory, cosmic horror, ancient threats",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "\"They're too far\"", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " → Hard SF, isolation, generation ships",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "\"We're first\"", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " → Responsibility, loneliness, manifest destiny",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "\"They're everywhere\"", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " → Space opera, galactic community, culture clash",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "\"They're already here\"",
        marks: ["strong"],
      },
      {
        _type: "span",
        _key: key(),
        text: " → First contact, infiltration, uplifting",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "\"They died out\"", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " → Great Filter, existential risk, archaeology",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h3",
    children: [{ _type: "span", _key: key(), text: "Practical Application" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "When designing your galaxy, assign rough values to each variable. You don't need precise numbers—just orders of magnitude:",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Example: A Crowded Galaxy",
        marks: ["strong"],
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "R* = High (lots of new stars), fp = High (most stars have planets), ne = Moderate (some habitable zones), fl = High (life is easy), fi = Moderate (intelligence is less common), fc = High (tech is natural), L = Long (civilizations persist)",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "Result:", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " Millions of civilizations, multiple per sector. Your story is about ",
      },
      { _type: "span", _key: key(), text: "navigating complexity", marks: ["strong"] },
      { _type: "span", _key: key(), text: "." },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Example: A Lonely Galaxy",
        marks: ["strong"],
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "R* = Moderate, fp = High, ne = Low (habitability is rare), fl = Low (life is hard to start), fi = Very low (intelligence is a fluke), fc = Low (tech isn't inevitable), L = Short (civilizations burn out)",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "Result:", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " Maybe a handful of civilizations in the entire galaxy. Your story is about ",
      },
      { _type: "span", _key: key(), text: "finding each other", marks: ["strong"] },
      { _type: "span", _key: key(), text: "." },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h2",
    children: [{ _type: "span", _key: key(), text: "The Great Filter" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "One particularly useful concept from Drake Equation thinking is the ",
      },
      { _type: "span", _key: key(), text: "Great Filter", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: "—some step in the equation that's incredibly difficult to pass.",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "If the filter is " },
      { _type: "span", _key: key(), text: "behind us", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " (maybe life starting is nearly impossible), then we're special and rare.",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "If the filter is " },
      { _type: "span", _key: key(), text: "ahead of us", marks: ["strong"] },
      {
        _type: "span",
        _key: key(),
        text: " (maybe civilizations destroy themselves), then we're doomed.",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "As a worldbuilder, deciding where you place the Great Filter fundamentally shapes your setting's tone:",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      { _type: "span", _key: key(), text: "Filter at fl (life)", marks: ["strong"] },
      { _type: "span", _key: key(), text: " → Lonely universe, we're a miracle" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Filter at fi (intelligence)",
        marks: ["strong"],
      },
      { _type: "span", _key: key(), text: " → Animals everywhere, thinkers rare" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Filter at fc (technology)",
        marks: ["strong"],
      },
      {
        _type: "span",
        _key: key(),
        text: " → Many intelligent species never industrialize",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "Filter at L (longevity)",
        marks: ["strong"],
      },
      {
        _type: "span",
        _key: key(),
        text: " → Ruins everywhere, living civilizations rare",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "h2",
    children: [{ _type: "span", _key: key(), text: "Further Reading" }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "\"Rare Earth\" by Ward & Brownlee",
        marks: ["strong"],
      },
      { _type: "span", _key: key(), text: " — The case for a lonely universe" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "\"The Eerie Silence\" by Paul Davies",
        marks: ["strong"],
      },
      {
        _type: "span",
        _key: key(),
        text: " — Deep dive into SETI and the Fermi Paradox",
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "\"If the Universe Is Teeming with Aliens... Where Is Everybody?\" by Stephen Webb",
        marks: ["strong"],
      },
      { _type: "span", _key: key(), text: " — 75 solutions to the Fermi Paradox" },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: "The Drake Equation doesn't give us an answer. It gives us a vocabulary for asking the right questions—and for science fiction writers, the questions are where the stories live.",
        marks: ["em"],
      },
    ],
    markDefs: [],
  },
];

const article = {
  _type: "article",
  title: "The Drake Equation: A Worldbuilder's Tool",
  slug: { _type: "slug", current: "drake-equation" },
  description:
    "How the famous equation for estimating extraterrestrial civilizations can help you design believable alien worlds and galactic settings.",
  category: "science",
  publishedDate: "2026-01-22",
  featured: true,
  content: drakeEquationContent,
};

async function migrate() {
  console.log("Creating Drake Equation article in Sanity...");

  try {
    const result = await client.create(article);
    console.log("✓ Article created successfully!");
    console.log("  ID:", result._id);
    console.log("  View at: https://stellarforge.sanity.studio/structure/article;", result._id);
  } catch (error) {
    console.error("Error creating article:", error);
  }
}

migrate();
