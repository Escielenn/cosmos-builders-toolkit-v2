import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./marketing-ui";
import { StudioGlimpse } from "./StudioGlimpse";

/**
 * Marketing hero (finding 1). Leads with the Prime Law and puts the action
 * above the fold: one primary CTA, one secondary anchor, one proof line.
 * The Studio glimpse is the section's single focal object.
 */
const WelcomeHero = () => {
  return (
    <section aria-labelledby="hero-title" className="pt-8 pb-14 md:pt-20 md:pb-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div>
          <Eyebrow className="mb-6">SF writing studio</Eyebrow>

          <h1
            id="hero-title"
            className="mb-6 font-display text-[clamp(40px,6vw,72px)] font-light leading-[1.04] text-t1"
          >
            Decide what is true.{" "}
            <em className="block font-serif font-normal italic text-sf-primary-text">Then write it.</em>
          </h1>

          <p className="mb-8 max-w-[52ch] font-sans text-[17px] leading-[1.6] text-t2 md:text-[19px]">
            Set a planet's gravity, a species' senses, a culture's gods. Every
            scene you write knows them, flags what contradicts them, and tells
            you when a decision changes the page.
          </p>

          <div className="mb-5 flex flex-wrap gap-3">
            <Button variant="sf-primary" size="sf-lg" className="gap-2" asChild>
              <Link to="/auth">
                Start writing free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="sf-ghost" size="sf-lg" className="gap-2" asChild>
              <a href="#how-it-works">
                See how it works
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          </div>

          <p className="font-sans text-sm text-t3">No credit card. Your worlds are yours alone.</p>
        </div>

        <StudioGlimpse />
      </div>
    </section>
  );
};

export default WelcomeHero;
