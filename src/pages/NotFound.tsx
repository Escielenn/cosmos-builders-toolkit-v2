import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Compass, Radio } from "lucide-react";
import { heroReveal, staggerContainer, fadeUpItem } from "@/lib/animations";

// Lightweight starfield canvas
function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;

    // Generate stars
    const stars: { x: number; y: number; size: number; brightness: number; speed: number }[] = [];
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      if (stars.length === 0) {
        for (let i = 0; i < 400; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 1.8 + 0.3,
            brightness: Math.random() * 0.5 + 0.1,
            speed: Math.random() * 0.15 + 0.02,
          });
        }
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);

      for (const star of stars) {
        star.x -= star.speed;
        if (star.x < -2) star.x = w + 2;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();
      }

      // Subtle nebula glow
      const grd = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.5);
      grd.addColorStop(0, "rgba(21, 193, 123, 0.03)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0"
    />
  );
}

// Floating signal pulse animation
function SignalPulse() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-8">
      {/* Outer rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-primary"
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 2 + i * 0.5, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-3 h-3 bg-primary/60 rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

const NotFound = () => {
  const location = useLocation();
  const [showCoords, setShowCoords] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    const timer = setTimeout(() => setShowCoords(true), 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <StarfieldCanvas />

      <motion.div
        className="relative z-10 text-center max-w-lg px-6"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUpItem}>
          <SignalPulse />
        </motion.div>

        {/* Error code */}
        <motion.div
          className="inline-flex items-center gap-3.5 font-mono uppercase text-sf-primary-text text-[13px] tracking-[3px] mb-7 justify-center"
          variants={fadeUpItem}
        >
          <span aria-hidden className="block w-12 h-px bg-sf-primary" />
          <span>// SIGNAL LOST, ERROR 404</span>
        </motion.div>

        {/* Title, text-sf-h1 (56px) sentence case */}
        <motion.h1
          className="font-display font-light text-sf-h1 leading-[1] text-t1 mb-7"
          variants={heroReveal}
        >
          Coordinates do not <span className="text-sf-crimson">match.</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="font-sans text-sf-body text-t3 leading-[1.55] max-w-[560px] mx-auto mb-2"
          variants={fadeUpItem}
        >
          The coordinates entered do not correspond to any charted record.
          Vessel has drifted beyond known space.
        </motion.p>

        {/* Failed coordinates readout */}
        {showCoords && (
          <motion.div
            className="font-mono text-[12px] text-t4 mb-8 py-2 px-4 inline-block border border-sf-line-interactive bg-sf-surface/40 tracking-[0.18em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-sf-crimson/70">UNREACHABLE</span>
            {"  "}
            <span className="text-t4">{location.pathname}</span>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
          variants={fadeUpItem}
        >
          <Button variant="sf-primary" size="sf-lg" className="gap-2" asChild>
            <Link to="/">
              <Compass className="w-4 h-4" />
              RETURN TO KNOWN SPACE
            </Link>
          </Button>
          <Button variant="sf-ghost" size="sf-lg" className="gap-2" asChild>
            <Link to="/contact">
              <Radio className="w-4 h-4" />
              SEND DISTRESS SIGNAL
            </Link>
          </Button>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="mt-10 text-xs italic text-sf-stellar/50 tracking-wide"
          variants={fadeUpItem}
        >
          These worlds exist in you. Waiting to be found.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;