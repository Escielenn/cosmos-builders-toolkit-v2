import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "feature" | "improvement" | "fix" | "policy";
  title: string;
  changes: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "February 2026",
    type: "feature",
    title: "Initial Public Release",
    changes: [
      "Launch of StellarForge.tools worldbuilding platform",
      "11 interactive worldbuilding tools available",
      "World dashboard with connections and notes",
      "Pro subscription tier with advanced features",
      "Privacy Policy and Terms of Service published",
      "Cookie consent with opt-out functionality",
    ],
  },
];

const typeStyles: Record<ChangelogEntry["type"], { bg: string; text: string; label: string }> = {
  feature: { bg: "bg-green-500/20", text: "text-green-400", label: "New Feature" },
  improvement: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Improvement" },
  fix: { bg: "bg-amber-500/20", text: "text-sf-amber", label: "Bug Fix" },
  policy: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Policy Update" },
};

const Changelog = () => {
  return (
    <LegalPageLayout
      title="Changelog"
      subtitle="What's new in StellarForge. Track updates, new features, and policy changes."
      lastUpdated="February 2026"
      badgeIcon={<History className="w-3 h-3 mr-1" />}
      badgeText="Updates"
    >
      <div className="space-y-10 not-prose">
        {changelog.map((entry) => {
          const style = typeStyles[entry.type];
          return (
            <section key={entry.version} className="relative">
              {/* Version header */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  v{entry.version}
                </h2>
                <Badge className={`${style.bg} ${style.text} border-0`}>
                  {style.label}
                </Badge>
                <span className="text-sm text-t3">{entry.date}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-foreground mb-3">{entry.title}</h3>

              {/* Changes list */}
              <ul className="space-y-2">
                {entry.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-t3">
                    <span className="text-primary mt-1.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Future updates notice */}
        <section className="pt-8 border-t border-border">
          <p className="text-t3 text-center">
            Subscribe to our{" "}
            <a
              href="https://xenomythology.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Substack
            </a>{" "}
            for updates on new features and worldbuilding content.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Changelog;
