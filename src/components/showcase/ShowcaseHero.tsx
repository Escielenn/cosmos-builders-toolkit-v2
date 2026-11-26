import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/landing/marketing-ui";

/**
 * Features hero (finding 4, 5). Same voice as the landing: mono eyebrow,
 * MD Nichrome headline with one Lora accent line, a short lede, one primary
 * and one secondary action. No demo grid, no all-caps manifest.
 */
const ShowcaseHero = () => {
  return (
    <section aria-labelledby="features-title" className="pt-8 pb-12 md:pt-20 md:pb-16">
      <Eyebrow className="mb-6">How StellarForge works</Eyebrow>
      <h1
        id="features-title"
        className="mb-6 font-display text-[clamp(40px,6vw,72px)] font-light leading-[1.04] text-t1"
      >
        The world decides.
        <em className="block font-serif font-normal italic text-sf-primary-text">The page remembers.</em>
      </h1>
      <p className="mb-8 max-w-[60ch] font-sans text-[17px] leading-[1.6] text-t2 md:text-[19px]">
        Instruments for the physics, the planet, the life, the minds, the myths
        and the cultures of your universe, wired into one canon and one writing
        studio. Here is what that means in practice.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="sf-primary" size="sf-lg" className="gap-2" asChild>
          <Link to="/auth">
            Start writing free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button variant="sf-ghost" size="sf-lg" asChild>
          <Link to="/pricing">See pricing</Link>
        </Button>
      </div>
    </section>
  );
};

export default ShowcaseHero;
