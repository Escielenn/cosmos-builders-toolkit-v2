import { Rocket, Zap, Sparkles, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { useWorlds } from "@/hooks/use-worlds";
import { heroReveal, staggerContainer, fadeUpItem } from "@/lib/animations";

const LoggedInHero = () => {
  const { isSubscribed, isVanguard } = useSubscription();
  const { worlds } = useWorlds();
  const mostRecentWorldId = worlds.length > 0 ? worlds[0].id : null;

  return (
    <motion.section
      className="text-center mb-12"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div className="flex items-center justify-center gap-3 mb-4" variants={heroReveal}>
        <h1 className="font-display font-light text-4xl md:text-5xl tracking-sf-wide text-white uppercase">
          STELLARFORGE
        </h1>
        {isVanguard ? (
          <Badge className="bg-violet-500/20 text-violet-400 gap-1 sf-shimmer-violet">
            <Sparkles className="w-3 h-3" />
            Vanguard
          </Badge>
        ) : isSubscribed ? (
          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 gap-1 sf-shimmer">
            <Zap className="w-3 h-3" />
            Pro
          </Badge>
        ) : null}
      </motion.div>

      <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6" variants={fadeUpItem}>
        {isVanguard
          ? "All instruments operational. Vanguard clearance active."
          : isSubscribed
          ? "All instruments operational."
          : "Science Fiction Worldbuilding Tools"}
      </motion.p>

      <motion.div className="flex flex-wrap gap-4 justify-center" variants={fadeUpItem}>
        <Button size="lg" className="gap-2" asChild>
          <a href="#worlds">
            <Rocket className="w-4 h-4" />
            {isSubscribed ? "Continue Building" : "My Worlds"}
          </a>
        </Button>
        {!isSubscribed && (
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <Link to="/pricing">
              <Rocket className="w-4 h-4" />
              Explore Pro Tools
            </Link>
          </Button>
        )}
        <Button variant="outline" size="lg" className="gap-2" asChild>
          <Link to={mostRecentWorldId ? `/worlds/${mostRecentWorldId}/write` : "/worlds"}>
            <PenLine className="w-4 h-4" />
            Continue Writing
          </Link>
        </Button>
        {isSubscribed && (
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <a href="#tools">
              View All Tools
            </a>
          </Button>
        )}
      </motion.div>

      {!isSubscribed && (
        <motion.p className="text-sm text-muted-foreground mt-4" variants={fadeUpItem}>
          3 instruments available · 27 require Pro Access
        </motion.p>
      )}
    </motion.section>
  );
};

export default LoggedInHero;
