import { describe, expect, it } from "vitest";
import {
  ALL_ARTICLE_PHOTOS,
  ARTICLE_PHOTOS,
  CATEGORY_PHOTO_POOLS,
  DEFAULT_PHOTO_POOL,
  photoForArticle,
  photoSrc,
  photoSrcSet,
} from "../article-photos";

const REFERRAL = "utm_source=stellarforge&utm_medium=referral";

describe("article photos", () => {
  it("matches the known articles by slug prefix, whatever follows", () => {
    const drake = photoForArticle(
      "the-most-important-question-you-can-write-on-a-chalkboard-an-introduction-to-the-drake-equation",
      "basics",
    );
    expect(drake.alt).toMatch(/blackboard/i);
    const cascade = photoForArticle("the-cascade-framework-why-your-alien-s-biology-determines-their-gods-and-more");
    expect(cascade).toBe(photoForArticle("the-cascade-framework"));
    expect(photoForArticle("drake-equation", "science").alt).toMatch(/radio telescope/i);
  });

  it("gives every hand-picked article a different photograph", () => {
    const ids = ARTICLE_PHOTOS.map((row) => row.photo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("picks from the category pool, the same photo every time", () => {
    const a = photoForArticle("a-new-article-nobody-has-mapped", "craft");
    expect(CATEGORY_PHOTO_POOLS.craft).toContain(a);
    expect(photoForArticle("a-new-article-nobody-has-mapped", "craft")).toBe(a);
  });

  it("falls back to the default pool for an unknown or missing category", () => {
    expect(DEFAULT_PHOTO_POOL).toContain(photoForArticle("something", "a-category-from-the-future"));
    expect(DEFAULT_PHOTO_POOL).toContain(photoForArticle("something"));
  });

  it("uses every photo in a pool across enough slugs", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(photoForArticle(`slug-${i}`, "science").id);
    expect(seen.size).toBe(CATEGORY_PHOTO_POOLS.science.length);
  });

  it("hotlinks images.unsplash.com and credits with referral params", () => {
    expect(ALL_ARTICLE_PHOTOS.length).toBeGreaterThanOrEqual(20);
    const ids = new Set<string>();
    for (const p of ALL_ARTICLE_PHOTOS) {
      expect(p.url.startsWith("https://images.unsplash.com/photo-"), p.id).toBe(true);
      expect(p.url).toContain("ixid=");
      expect(p.photographerUrl).toMatch(/^https:\/\/unsplash\.com\/@[\w-]+\?/);
      expect(p.photographerUrl.endsWith(REFERRAL)).toBe(true);
      expect(p.photoUrl.startsWith("https://unsplash.com/photos/")).toBe(true);
      expect(p.photoUrl).toContain(p.id);
      expect(p.photoUrl.endsWith(REFERRAL)).toBe(true);
      expect(p.photographer.length).toBeGreaterThan(0);
      expect(p.alt.length, `${p.id} alt`).toBeGreaterThan(30);
      expect(p.alt.endsWith(".")).toBe(true);
      expect(p.width).toBeGreaterThan(p.height);
      ids.add(p.id);
    }
    expect(ids.size).toBe(ALL_ARTICLE_PHOTOS.length);
  });

  it("builds sized URLs with the parameters Unsplash asks for", () => {
    const p = ALL_ARTICLE_PHOTOS[0];
    const src = photoSrc(p, { w: 960, h: 400 });
    expect(src).toContain("&w=960&h=400");
    expect(src).toContain("&q=70");
    expect(src).toContain("&auto=format");
    expect(src).toContain("&fit=crop");
    expect(new URL(src).hostname).toBe("images.unsplash.com");
    const set = photoSrcSet(p, [480, 960], 0.5);
    expect(set.split(", ")).toHaveLength(2);
    expect(set).toContain("&w=480&h=240");
    expect(set).toContain(" 960w");
  });
});
