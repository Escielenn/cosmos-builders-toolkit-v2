import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, ShoppingCart, Search } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { SectionHero } from "@/components/ui/section-hero";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BOOKSHELF_DATA,
  getAmazonUrl,
  getBookshopUrl,
  getOpenLibraryCover,
} from "@/lib/bookshelf-data";
import type { BookEntry } from "@/lib/bookshelf-data";
import { PageBursts } from "@/components/ui/data-burst";
import { BOOKSHELF_BURSTS } from "@/lib/data-bursts";

const CoverFallback = ({ title, author }: { title: string; author: string }) => (
  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex flex-col items-center justify-center p-3 text-center">
    <BookOpen className="w-8 h-8 text-primary/40 mb-2" />
    <p className="text-xs font-heading font-medium text-t2 leading-tight">
      {title}
    </p>
    <p className="text-[12px] text-t3 mt-1">{author}</p>
  </div>
);

const BookCard = ({ book }: { book: BookEntry }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <GlassPanel id={book.isbn} className="overflow-hidden flex flex-col h-full scroll-mt-24">
      {/* Cover */}
      <div className="aspect-[2/3] w-full bg-muted/30 relative">
        {!imgError ? (
          <img
            src={book.coverUrl || getOpenLibraryCover(book.isbn, "L")}
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <CoverFallback title={book.title} author={book.author} />
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-medium leading-tight">
          <em>{book.title}</em>
        </h3>
        <p className="text-sm text-t3 mt-1">
          {book.author} ({book.year})
        </p>

        <p className="text-xs text-t3 mt-3 leading-relaxed flex-1">
          {book.description}
        </p>

        {/* Tool references */}
        <div className="flex flex-wrap gap-1 mt-3">
          {book.toolsReferenced.map((tool) => (
            <Link key={tool.path} to={tool.path}>
              <Badge
                variant="secondary"
                className="text-[12px] hover:bg-primary/20 transition-colors cursor-pointer"
              >
                {tool.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Store links */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-sf-line-interactive">
          <ShoppingCart className="w-3.5 h-3.5 text-t3 shrink-0" />
          <a
            href={getAmazonUrl(book.title, book.author)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Amazon <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href={getBookshopUrl(book.title, book.author, book.isbn)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Bookshop <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </GlassPanel>
  );
};

const Bookshelf = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBooks = useMemo(() => {
    if (searchTerm.length < 2) return BOOKSHELF_DATA;
    const q = searchTerm.toLowerCase();
    return BOOKSHELF_DATA.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q) ||
        book.toolsReferenced.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [searchTerm]);

  return (
    <div className="relative min-h-screen bg-background">
      <Header />
      <PageBursts bursts={BOOKSHELF_BURSTS} />
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Hero */}
        <div className="mb-12">
          <SectionHero
            eyebrow={`// CATALOG · ${searchTerm.length >= 2 ? `${filteredBooks.length} OF ${BOOKSHELF_DATA.length}` : `${BOOKSHELF_DATA.length} WORKS`}`}
            title={<>The StellarForge <span className="text-sf-teal">bookshelf.</span></>}
            subtitle="The science fiction novels that inspired our worldbuilding tools. Each book demonstrates how a single constraint (environmental, biological, technological, or political) cascades through an entire world."
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
          <Input
            placeholder="Search by title, author, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Book Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.isbn} book={book} />
            ))}
          </div>
        ) : (
          <p className="text-center text-t3 py-12">
            No books found for &ldquo;{searchTerm}&rdquo;
          </p>
        )}

        {/* Footer note */}
        <div className="text-center mt-12">
          <p className="text-xs text-t3">
            Links may include affiliate referrals that help support StellarForge
            at no extra cost to you.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Bookshelf;
