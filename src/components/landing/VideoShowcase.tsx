import { GlassPanel } from "@/components/ui/glass-panel";

const YOUTUBE_VIDEO_ID = "iGYxmAQa8DY";

const VideoShowcase = () => {
  return (
    <section className="pb-12 md:pb-16 sf-reveal">
      <GlassPanel className="max-w-4xl mx-auto overflow-hidden p-2" lightArc glow>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
            title="StellarForge Promo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </GlassPanel>
    </section>
  );
};

export default VideoShowcase;
