import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, ArrowLeft, Upload, Crown, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { useBackground } from "@/hooks/use-background";
import { supabase } from "@/integrations/supabase/client";

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
  
  useBackground();

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
        title: "Upload failed",
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
      title: "Avatar uploaded",
      description: "Don't forget to save your profile.",
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
        title: "Failed to save profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <GlassPanel className="p-8">
          <h1 className="font-display text-2xl font-bold mb-6">Your Profile</h1>

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload Avatar
                    </span>
                  </Button>
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile
            </Button>
          </div>
        </GlassPanel>

        {/* Subscription Section */}
        <GlassPanel className="p-8 mt-6">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
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
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Payment failed. Please update your payment method.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>Cancels on</span>
                    </div>
                    <div className="text-amber-600 dark:text-amber-400">
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
                      title: "Error",
                      description: "Failed to open billing portal.",
                      variant: "destructive",
                    });
                  }
                  setPortalLoading(false);
                }}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage Billing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You're on the free plan. Upgrade to Pro to unlock all tools.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => navigate('/pricing')}
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </GlassPanel>
      </main>
    </div>
  );
};

export default Profile;
