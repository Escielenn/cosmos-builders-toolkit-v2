import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, ArrowLeft, Upload, Zap, Calendar, CreditCard, AlertCircle, Award, ChevronRight } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ExportSettings from "@/components/settings/ExportSettings";
import WritingSettings from "@/components/settings/WritingSettings";
import { useEarnedBadges } from "@/hooks/use-badges";
import { BADGE_DEFINITIONS } from "@/lib/badges/definitions";
import AvatarPickerDialog from "@/components/settings/AvatarPickerDialog";
import { PageBursts } from "@/components/ui/data-burst";
import { SETTINGS_BURSTS } from "@/lib/data-bursts";

const Profile = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const { subscription, isSubscribed, createPortalSession } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "UPLOAD FAILED.",
        description: uploadError.message,
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setIsUploading(false);
    
    toast({
      title: "AVATAR UPLOADED.",
      description: "Save to commit changes.",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const { error } = await updateProfile({
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    });

    setIsSaving(false);

    if (error) {
      toast({
        title: "SAVE FAILED.",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "CONFIGURATION SAVED.",
        description: "Personnel file updated.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <PageBursts bursts={SETTINGS_BURSTS} />
        <Button
          variant="ghost" 
          className="mb-6 gap-2" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          ← RETURN TO BRIDGE
        </Button>

        <GlassPanel className="p-8">
          <h1 className="font-heading text-2xl font-bold mb-6">PERSONNEL FILE</h1>

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <Loader variant="inline" size="sm" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload avatar"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setAvatarPickerOpen(true)}
                  >
                    Browse Avatars
                  </Button>
                </div>
                <p className="text-xs text-t3">
                  Upload custom or select from presets.
                </p>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
              <p className="text-xs text-t3">
                Locked. Cannot be modified.
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Callsign"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Personnel notes..."
                rows={4}
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full gap-2"
              size="lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader variant="inline" size="sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </GlassPanel>

        {/* Commendations link */}
        <CommendationsSummary navigate={navigate} />

        {/* Writing Surface */}
        <GlassPanel className="p-8 mt-6">
          <WritingSettings />
        </GlassPanel>

        {/* Export Settings */}
        <GlassPanel className="p-8 mt-6">
          <ExportSettings />
        </GlassPanel>

        {/* Subscription Section */}
        <GlassPanel className="p-8 mt-6">
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-sf-amber" />
            Subscription
          </h2>

          {isSubscribed && subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                  Active
                </Badge>
                <Badge variant="secondary">
                  {subscription.plan_type === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
                </Badge>
              </div>

              {subscription.status === 'past_due' && (
                <div className="p-3 rounded-none bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-sf-crimson" />
                  <p className="text-sm text-red-600 dark:text-sf-crimson">
                    Payment failed. Update payment method to restore access.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-t3">
                  <Calendar className="w-4 h-4" />
                  <span>Current period ends</span>
                </div>
                <div>
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : 'N/A'}
                </div>

                {subscription.cancel_at_period_end && (
                  <>
                    <div className="flex items-center gap-2 text-t3">
                      <AlertCircle className="w-4 h-4 text-sf-amber" />
                      <span>Cancels on</span>
                    </div>
                    <div className="text-sf-amber dark:text-sf-amber">
                      {subscription.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={async () => {
                  setPortalLoading(true);
                  try {
                    const result = await createPortalSession.mutateAsync();
                    if (result.url) {
                      window.location.href = result.url;
                    }
                  } catch (error) {
                    toast({
                      title: "OPERATION FAILED.",
                      description: "Failed to open billing portal. Retry when ready.",
                      variant: "destructive",
                    });
                  }
                  setPortalLoading(false);
                }}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader variant="inline" size="sm" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage Billing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-t3">
                Standard clearance. Upgrade for full instrument access.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => navigate('/pricing')}
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </GlassPanel>
      </main>

      <Footer />

      <AvatarPickerDialog
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        onSelect={setAvatarUrl}
        currentUrl={avatarUrl}
      />
    </div>
  );
};

function CommendationsSummary({ navigate }: { navigate: (path: string) => void }) {
  const { earnedSet, isLoading } = useEarnedBadges();
  const earnedCount = earnedSet.size;
  const totalCount = BADGE_DEFINITIONS.length;

  return (
    <GlassPanel className="p-6 md:p-8 mt-6">
      <button
        type="button"
        className="w-full flex items-center justify-between group"
        onClick={() => navigate("/commendations")}
      >
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-emerald" />
          <div className="text-left">
            <h3 className="font-heading text-sm uppercase tracking-[3px] text-emerald">
              Commendations
            </h3>
            <p className="font-sans text-[11px] text-t4 mt-0.5">
              {isLoading ? "INITIALIZING..." : `${earnedCount} OF ${totalCount} EARNED`}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-t4 group-hover:text-t2 transition-colors" />
      </button>
    </GlassPanel>
  );
}

export default Profile;
