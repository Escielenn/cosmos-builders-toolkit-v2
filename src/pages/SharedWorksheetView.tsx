import { useParams, Link } from "react-router-dom";
import { Loader2, Calendar, Globe, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import SharedPageHeader from "@/components/sharing/SharedPageHeader";
import WorksheetDataRenderer from "@/components/sharing/WorksheetDataRenderer";
import { useSharedWorksheet } from "@/hooks/use-sharing";
import { getToolDisplayName } from "@/lib/tools-config";

const SharedWorksheetView = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedWorksheet(token);

  return (
    <div className="min-h-screen bg-background">
      <SharedPageHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading shared worksheet...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h1 className="font-display text-2xl font-semibold mb-2">Link not available</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              This share link may have been disabled, expired, or the worksheet may have been deleted.
            </p>
            <Button asChild>
              <Link to="/">Go to StellarForge</Link>
            </Button>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <Badge className="bg-primary/10 text-primary">
                {getToolDisplayName(data.tool_type)}
              </Badge>

              <h1 className="font-display text-3xl md:text-4xl font-bold">
                {data.title || "Untitled Worksheet"}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {data.owner_display_name && (
                  <div className="flex items-center gap-2">
                    {data.owner_avatar_url ? (
                      <img
                        src={data.owner_avatar_url}
                        alt=""
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-primary">
                          {data.owner_display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span>{data.owner_display_name}</span>
                  </div>
                )}

                {data.world_name && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{data.world_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(data.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <WorksheetDataRenderer
              toolType={data.tool_type}
              data={data.data}
            />

            {/* Footer */}
            <GlassPanel className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Built with StellarForge — the science fiction worldbuilding toolkit
              </p>
              <Button size="sm" asChild>
                <Link to="/">Start building your world</Link>
              </Button>
            </GlassPanel>
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedWorksheetView;
