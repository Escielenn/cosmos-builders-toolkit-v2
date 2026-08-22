import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Telescope, ChevronUp, ChevronDown, Rocket, Wrench, Monitor, Link2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import {
  useRoadmapItems,
  useVoteBudget,
  useMyVotesForItem,
  useCastVote,
  useRemoveVote,
} from "@/hooks/use-roadmap";
import type { RoadmapItem } from "@/hooks/use-roadmap";
import { useToast } from "@/hooks/use-toast";
import { PageBursts } from "@/components/ui/data-burst";
import { ROADMAP_BURSTS } from "@/lib/data-bursts";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  planned: {
    label: "PLANNED",
    className: "bg-white/5 border-sf-line text-t3",
  },
  in_progress: {
    label: "IN PROGRESS",
    className: "bg-amber-500/6 border-sf-amber text-sf-amber",
  },
  beta: {
    label: "BETA",
    className: "bg-violet-500/6 border-sf-violet text-sf-violet",
  },
  released: {
    label: "RELEASED",
    className: "bg-emerald-500/6 border-sf-emerald text-sf-emerald",
  },
};

const CATEGORY_ICONS: Record<string, typeof Rocket> = {
  tool: Wrench,
  feature: Rocket,
  simulator: Monitor,
  integration: Link2,
};

function VoteBudgetBar({ used, remaining, max }: { used: number; remaining: number; max: number }) {
  const pct = (used / max) * 100;
  return (
    <GlassPanel className="p-4 mb-6 border-sf-violet">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-[1.5px] text-t3">
          VOTE BUDGET
        </span>
        <span className="font-mono text-sm text-sf-violet">
          {remaining}/{max} <span className="text-t4">remaining</span>
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-sm overflow-hidden">
        <div
          className="h-full bg-violet-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </GlassPanel>
  );
}

function RoadmapCard({ item, canVote }: { item: RoadmapItem; canVote: boolean }) {
  const { isVanguard } = useSubscription();
  const myVotes = useMyVotesForItem(item.id);
  const { remaining } = useVoteBudget();
  const castVote = useCastVote();
  const removeVote = useRemoveVote();
  const { toast } = useToast();

  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
  const CategoryIcon = CATEGORY_ICONS[item.category] || Wrench;

  const handleVote = async (count: number) => {
    try {
      await castVote.mutateAsync({ itemId: item.id, count });
    } catch (err) {
      toast({
        title: "Vote failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveVote = async () => {
    try {
      await removeVote.mutateAsync({ itemId: item.id, count: myVotes });
    } catch (err) {
      toast({
        title: "OPERATION FAILED.",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  // Vote bar width as percentage of max vote count across all items (capped at a reasonable max)
  const maxDisplay = Math.max(item.vote_count, 50);
  const voteBarPct = Math.min((item.vote_count / maxDisplay) * 100, 100);

  return (
    <GlassPanel className="p-6 group">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant="outline" className="gap-1 text-t3 border-sf-line">
          <CategoryIcon className="w-3 h-3" />
          {item.category.toUpperCase()}
        </Badge>
        <Badge className={`${statusCfg.className} border`}>
          {statusCfg.label}
        </Badge>
        {item.target_quarter && (
          <span className="text-xs font-mono text-t4 ml-auto">{item.target_quarter}</span>
        )}
      </div>

      {/* Title & description */}
      <h3 className="font-heading text-lg font-light uppercase tracking-[2px] text-t1 mb-2">
        {item.title}
      </h3>
      {item.description && (
        <p className="text-sm text-t2 mb-4 leading-relaxed">{item.description}</p>
      )}

      {/* Vote bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-white/5 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-300"
            style={{ width: `${voteBarPct}%` }}
          />
        </div>
        <span className="font-mono text-sm text-t1 tabular-nums min-w-[60px] text-right">
          {item.vote_count} <span className="text-t4 text-xs">votes</span>
        </span>
      </div>

      {/* Vote actions */}
      {canVote && isVanguard ? (
        <div className="flex items-center gap-2 flex-wrap">
          {[1, 3, 5].map((n) => (
            <Button
              key={n}
              variant="outline"
              size="sm"
              className="gap-1 border-sf-teal hover:border-sf-teal hover:bg-teal-500/5 text-teal-400"
              onClick={() => handleVote(n)}
              disabled={remaining < n || castVote.isPending}
            >
              <ChevronUp className="w-3 h-3" />
              +{n}
            </Button>
          ))}

          {myVotes > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-t4 hover:text-sf-crimson ml-auto"
              onClick={handleRemoveVote}
              disabled={removeVote.isPending}
            >
              <ChevronDown className="w-3 h-3" />
              Remove ({myVotes})
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {[1, 3, 5].map((n) => (
            <Button
              key={n}
              variant="outline"
              size="sm"
              className="gap-1 opacity-40 cursor-not-allowed"
              disabled
            >
              <ChevronUp className="w-3 h-3" />
              +{n}
            </Button>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

const Roadmap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isVanguard } = useSubscription();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: items = [], isLoading } = useRoadmapItems(statusFilter);
  const voteBudget = useVoteBudget();

  const statusTabs = [
    { value: 'all', label: 'ALL' },
    { value: 'planned', label: 'PLANNED' },
    { value: 'in_progress', label: 'IN PROGRESS' },
    { value: 'beta', label: 'BETA' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <PageBursts bursts={ROADMAP_BURSTS} />
        {/* Hero */}
        <section className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-sf-title text-t1 mb-3">
            ROADMAP
          </h1>
          <p className="text-t2 max-w-xl mx-auto">
            Shape what comes next. Vanguard members vote to prioritize upcoming tools and features.
          </p>
        </section>

        {/* Vote budget (Vanguard only) */}
        {isVanguard && (
          <VoteBudgetBar
            used={voteBudget.used}
            remaining={voteBudget.remaining}
            max={voteBudget.max}
          />
        )}

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 text-xs font-heading uppercase tracking-[1.5px] border transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'border-sf-teal bg-teal-500/6 text-teal-400'
                  : 'border-sf-line text-t3 hover:border-sf-line hover:text-t2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Roadmap items */}
        {isLoading ? (
          <div className="text-center py-16 text-t3">Loading roadmap...</div>
        ) : items.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <p className="text-t3">No roadmap items match this filter.</p>
          </GlassPanel>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <RoadmapCard
                key={item.id}
                item={item}
                canVote={!!user && isVanguard}
              />
            ))}
          </div>
        )}

        {/* Non-Vanguard CTA */}
        {!isVanguard && (
          <GlassPanel className="p-6 mt-8 border-sf-violet text-center">
            <Telescope className="w-8 h-8 text-sf-violet mx-auto mb-3" />
            <h3 className="font-heading text-lg font-light uppercase tracking-[2px] mb-2">
              Want to shape the roadmap?
            </h3>
            <p className="text-sm text-t2 mb-4 max-w-md mx-auto">
              Vanguard members get 10 votes per month to prioritize what gets built next, plus early access to new tools, Office Hours, and more.
            </p>
            <Button
              className="bg-violet-600 hover:bg-violet-500 gap-2"
              onClick={() => navigate("/pricing")}
            >
              <Telescope className="w-4 h-4" />
              UPGRADE TO VANGUARD
            </Button>
          </GlassPanel>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Roadmap;
