import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { scrollReveal, viewportOnce } from "@/lib/animations";

const YOUTUBE_VIDEO_ID = "iGYxmAQa8DY";

const VideoShowcase = () => {
  return (
    <motion.section
      className="pb-12 md:pb-16"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={scrollReveal}
    >
      <GlassPanel className="max-w-4xl mx-auto overflow-hidden p-2" lightArc glow>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-none"
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
            title="StellarForge Promo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </GlassPanel>
    </motion.section>
  );
};

export default VideoShowcase;
