import { useParams, Link } from "react-router-dom";
import { Calendar, Globe, AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import SharedPageHeader from "@/components/sharing/SharedPageHeader";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import WorksheetDataRenderer from "@/components/sharing/WorksheetDataRenderer";
import { SocialShareButtons } from "@/components/sharing/SocialShareButtons";
import { useSharedWorksheet } from "@/hooks/use-sharing";
import { getToolDisplayName } from "@/lib/tools-config";
import { getToolAccent } from "@/lib/tool-accents";
import { PageBursts } from "@/components/ui/data-burst";
import { SHARED_WORKSHEET_BURSTS } from "@/lib/data-bursts";
import { useMetaTags } from "@/hooks/use-meta-tags";

const SharedWorksheetView = () => {
  useMetaTags({ title: "Shared Worksheet" });
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedWorksheet(token);

  return (
    <div className="relative min-h-screen bg-background">
      <SharedPageHeader />
      <PageBursts bursts={SHARED_WORKSHEET_BURSTS} />

      <main id="main" tabIndex={-1} className="relative z-10">
      <PageContainer className="max-w-4xl pt-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader className="mb-4" />
            <p className="text-sm text-t2">Loading shared worksheet...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
            <PageHeader
              size="card"
              align="center"
              accent="crimson"
              icon={<AlertCircle className="w-12 h-12 text-t3" aria-hidden />}
              eyebrow="SHARED WORKSHEET"
              title="Link not available"
              lede="This share link may have been disabled, expired, or the worksheet may have been deleted."
            />
            <Button asChild>
              <Link to="/">Go to StellarForge</Link>
            </Button>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-6">
            {/* Header */}
            <PageHeader
              eyebrow={getToolDisplayName(data.tool_type)}
              accent={getToolAccent(data.tool_type)}
              title={data.title || "Untitled Worksheet"}
              className="mb-0"
            >
              <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-sm text-t3">
                {data.owner_display_name && (
                  <div className="flex items-center gap-2">
                    {data.owner_avatar_url ? (
                      <img
                        src={data.owner_avatar_url}
                        alt=""
                        className="w-5 h-5 rounded-none"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-none bg-primary/20 flex items-center justify-center">
                        <span className="text-[12px] font-medium text-sf-primary-text">
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
            </PageHeader>

            {/* Content */}
            <WorksheetDataRenderer
              toolType={data.tool_type}
              data={data.data}
            />

            {/* Social sharing */}
            <GlassPanel className="p-5">
              <SocialShareButtons
                url={window.location.href}
                title={data.title || "StellarForge Worksheet"}
                description={`${getToolDisplayName(data.tool_type)} worksheet${data.world_name ? ` from the world of ${data.world_name}` : ""}, built with StellarForge`}
              />
            </GlassPanel>

            {/* Footer */}
            <GlassPanel className="p-6 text-center">
              <p className="text-sm text-t2 mb-3">
                Built with StellarForge, the science fiction worldbuilding toolkit
              </p>
              <Button size="sm" asChild>
                <Link to="/">Start building your world</Link>
              </Button>
            </GlassPanel>
          </div>
        )}
      </PageContainer>
      </main>
    </div>
  );
};

export default SharedWorksheetView;
