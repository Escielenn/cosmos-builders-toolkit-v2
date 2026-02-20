import { useParams, Link } from "react-router-dom";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import SharedPageHeader from "@/components/sharing/SharedPageHeader";
import { useSharedWorld } from "@/hooks/use-sharing";
import { getToolDisplayName } from "@/lib/tools-config";
import WorldIconRenderer from "@/components/world/WorldIconRenderer";
import { CosmicTelemetry } from "@/components/layout/CosmicVelocityTicker";
import { DISTANCE_DATA } from "@/lib/cosmic-telemetry";

const SharedWorldView = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedWorld(token);

  return (
    <div className="min-h-screen bg-background">
      <SharedPageHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading shared world...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h1 className="font-heading text-2xl font-semibold mb-2">Link not available</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              This share link may have been disabled, expired, or the world may have been deleted.
            </p>
            <Button asChild>
              <Link to="/">Go to StellarForge</Link>
            </Button>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-6">
            {/* Header Image */}
            {data.header_image_url && (
              <div className="relative w-full h-48 md:h-64 rounded-none overflow-hidden">
                <img
                  src={data.header_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `center ${data.header_image_focus_y ?? 50}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            )}

            {/* World Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {data.icon && (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <WorldIconRenderer iconId={data.icon} className="w-7 h-7 text-primary" />
                  </div>
                )}
                <h1 className="font-display text-3xl md:text-4xl font-bold">
                  {data.name}
                </h1>
              </div>

              {data.description && (
                <p className="text-lg text-muted-foreground">{data.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {data.owner_display_name && (
                  <div className="flex items-center gap-2">
                    {data.owner_avatar_url ? (
                      <img
                        src={data.owner_avatar_url}
                        alt=""
                        className="w-5 h-5 rounded-sm"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-sm bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-primary">
                          {data.owner_display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span>{data.owner_display_name}</span>
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

            {/* Worksheets */}
            {data.worksheets && data.worksheets.length > 0 && (
              <div>
                <h2 className="font-heading font-light text-xl uppercase tracking-sf-wide mb-4">
                  Worksheets ({data.worksheets.length})
                </h2>
                <div className="space-y-3">
                  {data.worksheets.map((ws) => (
                    <GlassPanel key={ws.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge className="bg-primary/10 text-primary text-xs mb-2">
                            {getToolDisplayName(ws.tool_type)}
                          </Badge>
                          <h3 className="font-semibold">
                            {ws.title || "Untitled"}
                          </h3>
                          {ws.tags && ws.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ws.tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(ws.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </GlassPanel>
                  ))}
                </div>
              </div>
            )}

            {data.worksheets && data.worksheets.length === 0 && (
              <GlassPanel className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  This world has no worksheets yet.
                </p>
                <CosmicTelemetry
                  data={DISTANCE_DATA}
                  variant="horizontal"
                  align="center"
                />
              </GlassPanel>
            )}

            {/* Footer */}
            <GlassPanel className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Built with StellarForge—the science fiction worldbuilding toolkit
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

export default SharedWorldView;
