/** SF Quotes — rotating literary epigraphs for homepage and tool pages. */

import { getAmazonUrl, getBookshopUrl } from "@/lib/bookshelf-data";

// ─── Types ──────────────────────────────────────────────────────────────

export interface SFQuote {
  text: string;
  author: string;
  source: string;   // Book or story title
  isbn: string;     // For affiliate links
}

export interface SFQuoteWithLinks extends SFQuote {
  amazonUrl: string;
  bookshopUrl: string;
}

// ─── General Quotes (Homepage) ──────────────────────────────────────────

export const GENERAL_QUOTES: SFQuote[] = [
  {
    text: "The highest function of ecology is the understanding of consequences.",
    author: "Frank Herbert",
    source: "Dune",
    isbn: "9780441172719",
  },
  {
    text: "The sky above the port was the color of television, tuned to a dead channel.",
    author: "William Gibson",
    source: "Neuromancer",
    isbn: "9780441569595",
  },
  {
    text: "We are a way for the cosmos to know itself.",
    author: "Carl Sagan",
    source: "Cosmos",
    isbn: "9780345539434",
  },
];

// ─── Tool-Specific Quotes ───────────────────────────────────────────────
// Keyed by tool slug (same IDs as tools-config.ts).
// Each tool maps to an array; one is chosen randomly per page load.
// Tools without an entry here gracefully render nothing.

export const TOOL_QUOTES: Record<string, SFQuote[]> = {
  "drake-equation-calculator": [
    {
      text: "The universe is a dark forest. Every civilization is an armed hunter stalking through the trees.",
      author: "Liu Cixin",
      source: "The Dark Forest",
      isbn: "9780765386694",
    },
  ],
  "planetary-profile": [
    {
      text: "Arrakis teaches the attitude of the knife\u2014chopping off what\u2019s incomplete and saying: \u2018Now, it\u2019s complete because it\u2019s ended here.\u2019",
      author: "Frank Herbert",
      source: "Dune",
      isbn: "9780441172719",
    },
  ],
  "evolutionary-biology": [
    {
      text: "Evolution has no foresight. Complex machinery develops its own agendas.",
      author: "Peter Watts",
      source: "Blindsight",
      isbn: "9780765312839",
    },
  ],
  "spacecraft-designer": [
    {
      text: "The ship hung in the sky in much the same way that bricks don\u2019t.",
      author: "Douglas Adams",
      source: "The Hitchhiker\u2019s Guide to the Galaxy",
      isbn: "9780345391803",
    },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────

function pickRandom<T>(items: T[]): T | null {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function enrichWithLinks(quote: SFQuote): SFQuoteWithLinks {
  return {
    ...quote,
    amazonUrl: getAmazonUrl(quote.source, quote.author),
    bookshopUrl: getBookshopUrl(quote.source, quote.author, quote.isbn),
  };
}

/** Get a random general quote for the homepage. */
export function getHomepageQuote(): SFQuoteWithLinks | null {
  const quote = pickRandom(GENERAL_QUOTES);
  return quote ? enrichWithLinks(quote) : null;
}

/** Get a random tool-specific quote, enriched with affiliate links. */
export function getToolQuote(toolId: string): SFQuoteWithLinks | null {
  const quotes = TOOL_QUOTES[toolId];
  if (!quotes) return null;
  const quote = pickRandom(quotes);
  return quote ? enrichWithLinks(quote) : null;
}
