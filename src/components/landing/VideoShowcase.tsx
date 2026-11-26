import { useState } from "react";
import { Play } from "lucide-react";
import { CoverArt } from "@/components/learn/CoverArt";
import { cn } from "@/lib/utils";
import { MarketingSection, SectionHeading } from "./marketing-ui";

const YOUTUBE_VIDEO_ID = "iGYxmAQa8DY";

/**
 * Lite video embed: a generated poster and a play button. The YouTube
 * iframe (and its cookies, scripts and ~1 MB) loads only after a click.
 * The poster is our own cover art, not a YouTube thumbnail, so nothing is
 * fetched from Google until the visitor asks for the video.
 */
/** The facade box on its own, for pages outside the landing (Auth). */
export function TourVideo({ className }: { className?: string }): JSX.Element {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className={cn(
        "relative aspect-video w-full max-w-5xl overflow-hidden border border-sf-line bg-sf-void",
        className,
      )}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&autoplay=1`}
          title="StellarForge tour video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full text-left"
          aria-label="Play the StellarForge tour video (loads YouTube)"
        >
          <CoverArt seed="stellarforge-tour" glyph="signal" category="teal" />
          <span className="sf-scrim absolute inset-x-0 bottom-0 flex items-center gap-4 px-5 py-4 md:px-8 md:py-6">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-sf-primary bg-sf-primary text-sf-on-primary transition-transform duration-base ease-sf-out group-hover:-translate-y-0.5">
              <Play className="h-6 w-6" aria-hidden />
            </span>
            <span className="relative">
              <span className="block font-sans text-base font-medium text-t1">
                Watch the tour
              </span>
              <span className="block font-mono text-sf-mono uppercase text-t3">
                Plays from YouTube
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

export default function VideoShowcase(): JSX.Element {
  return (
    <MarketingSection id="video" labelledBy="video-title">
      <SectionHeading
        id="video-title"
        label="The tour"
        title="See it move"
        lede="A walk from a blank star system to a scene that knows its sky."
      />

      <TourVideo />
    </MarketingSection>
  );
}
