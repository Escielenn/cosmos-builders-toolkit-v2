import { useState } from "react";
import Header from "@/components/layout/Header";

const TidelockSimulator = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 relative" style={{ marginTop: 64 }}>
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
              Initializing TIDELOCK
            </p>
          </div>
        )}
        <iframe
          src="/tools/tidelock/sim.html"
          title="Tidelock — Locked World Simulator"
          allow="fullscreen"
          className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ position: 'absolute', inset: 0 }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
};

export default TidelockSimulator;