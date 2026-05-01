import { useEffect, useRef, useState } from "react";
import { useBackground } from "@/hooks/use-background";

const VideoBackground = () => {
  const { isVideoBackground, videoUrl, backgroundVisible } = useBackground();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Respect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Reset loaded state and play when video URL changes
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    const video = videoRef.current;
    if (video && isVideoBackground && videoUrl && !reducedMotion) {
      video.load();
      video.play().catch(() => {});
    }
  }, [videoUrl, isVideoBackground, reducedMotion]);

  if (!isVideoBackground || !videoUrl || reducedMotion || !backgroundVisible) return null;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none no-print"
      aria-hidden="true"
    >
      {/* Solid black base, prevents any previous background from bleeding through */}
      <div className="absolute inset-0 bg-black" />

      {!failed && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onCanPlay={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-40" : "opacity-0"
          }`}
        />
      )}

      {/* Fallback gradient when .mov or other unsupported format fails to play */}
      {failed && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d1117 100%)",
          }}
        />
      )}

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-sf-void/50" />
    </div>
  );
};

export default VideoBackground;
