import { Layers, Share2, FileDown } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";

const ValueProposition = () => {
  return (
    <section className="mb-16">
      <GlassPanel glow className="p-8 md:p-12">
        <h2 className="font-display text-2xl font-semibold text-center mb-8">
          Why StellarForge?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              Systematic Worldbuilding
            </h3>
            <p className="text-sm text-muted-foreground">
              Every choice cascades logically. Define gravity, and watch how it
              shapes biology, architecture, psychology, and mythology.
            </p>
          </div>
          <div className="text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
              <Share2 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              Cross-Tool Integration
            </h3>
            <p className="text-sm text-muted-foreground">
              Data flows between tools. Your spacecraft references your planet's
              atmosphere automatically—no duplicate entry.
            </p>
          </div>
          <div className="text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
              <FileDown className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              Export Everything
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate beautiful PDFs, print-friendly views, and JSON exports.
              Share your worlds with collaborators via read-only links.
            </p>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
};

export default ValueProposition;
