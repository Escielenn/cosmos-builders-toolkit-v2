import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Link2,
  Crown,
  Loader2,
  Upload,
  Save,
  Check,
  X,
  Calendar,
  CreditCard,
  AlertCircle,
  Image,
  Download,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { useBackground } from "@/hooks/use-background";
import { useNotion } from "@/hooks/use-notion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import ExportSettings from "@/components/settings/ExportSettings";
import AvatarPickerDialog from "@/components/settings/AvatarPickerDialog";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

const SettingsDialog = ({
  open,
  onOpenChange,
  defaultTab = "account",
}: SettingsDialogProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { subscription, isSubscribed, createPortalSession } = useSubscription();
  const { backgroundId, setBackground, options, customBackground, setCustomBackground, clearCustomBackground } = useBackground();
  const { connection: notionConnection, isConnected: isNotionConnected, isConnecting, connect: connectNotion, disconnect: disconnectNotion } = useNotion();

  // Tab state - sync with defaultTab when dialog opens
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Load profile data
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

  const handleSaveProfile = async () => {
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

  const handleBgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomBackground(dataUrl);
    };
    reader.readAsDataURL(file);

    if (bgInputRef.current) {
      bgInputRef.current.value = "";
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  // Background options grouped
  const defaultOptions = options.filter((o) => o.category === "default");
  const spaceOptions = options.filter((o) => o.category === "space");
  const gradientOptions = options.filter((o) => o.category === "gradient");
  const colorOptions = options.filter((o) => o.category === "color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your account, background, and integrations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="account" className="gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="background" className="gap-1.5">
              <Image className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Background</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Language</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="mt-4 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload avatar"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAvatarPickerOpen(true)}
                  >
                    Browse Avatars
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload your own or choose a preset avatar.
                </p>
              </div>
            </div>

            {/* Email */}
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
                rows={3}
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              className="w-full gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile
            </Button>
          </TabsContent>

          {/* Background Tab */}
          <TabsContent value="background" className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Background</h4>

              {/* Default */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Default
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {defaultOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setBackground(option.id)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                        backgroundId === option.id
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="w-full h-full bg-background starfield-preview" />
                      <span className="absolute bottom-1 left-1 text-[10px] font-medium text-white">
                        {option.name}
                      </span>
                      {backgroundId === option.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Space Images */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Space Images
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {spaceOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setBackground(option.id)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                        backgroundId === option.id
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img
                        src={option.url}
                        alt={option.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-1 left-1 text-[10px] font-medium text-white">
                        {option.name}
                      </span>
                      {backgroundId === option.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradients */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Gradients
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {gradientOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setBackground(option.id)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                        backgroundId === option.id
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div
                        className="w-full h-full"
                        style={{ background: option.value }}
                      />
                      {backgroundId === option.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Solid Colors
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setBackground(option.id)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                        backgroundId === option.id
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div
                        className="w-full h-full"
                        style={{ background: option.value }}
                      />
                      {backgroundId === option.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Upload */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Custom
                </p>
                <div className="flex gap-2">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBgFileSelect}
                  />
                  {customBackground && (
                    <button
                      onClick={() => setBackground("custom")}
                      className={cn(
                        "relative w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                        backgroundId === "custom"
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img
                        src={customBackground}
                        alt="Custom"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearCustomBackground();
                        }}
                        className="absolute top-1 left-1 w-4 h-4 rounded-sm bg-destructive flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5 text-destructive-foreground" />
                      </button>
                      {backgroundId === "custom" && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    className="w-24 aspect-video rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-all hover:scale-105 flex flex-col items-center justify-center gap-1 bg-muted/50"
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      Upload
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-4 space-y-4">
            {/* Notion */}
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <svg viewBox="0 0 120 126" className="w-6 h-6">
                      <path
                        d="M20.6927 21.9315C24.5836 25.0924 26.0018 24.8437 33.4291 24.2214L100.218 19.6204C101.651 19.6204 100.469 18.1815 99.9564 17.9361L88.7891 9.71566C86.6109 8.02493 83.6873 6.08329 78.0982 6.58511L13.7636 11.6956C11.3273 11.9443 10.8291 13.1865 11.8309 14.1298L20.6927 21.9315Z"
                        fill="#000"
                      />
                      <path
                        d="M24.8273 36.5807V108.309C24.8273 112.224 26.7418 113.417 31.0727 113.168L104.8 108.807C109.131 108.558 109.627 105.646 109.627 102.48V31.248C109.627 28.0871 108.378 26.3964 105.545 26.6451L28.6618 31.248C25.5873 31.4966 24.8273 33.4217 24.8273 36.5807Z"
                        fill="#000"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Notion</h4>
                    <p className="text-sm text-muted-foreground">
                      {isNotionConnected
                        ? `Connected to ${notionConnection?.workspace_name || "workspace"}`
                        : "Export worksheets to Notion"}
                    </p>
                  </div>
                </div>
                {isNotionConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectNotion}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={connectNotion}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Link2 className="w-4 h-4 mr-2" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Placeholder for future integrations */}
            <p className="text-xs text-muted-foreground text-center">
              More integrations coming soon
            </p>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="mt-4 space-y-4">
            {isSubscribed && subscription ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro Active
                  </Badge>
                  <Badge variant="secondary">
                    {subscription.plan_type === "yearly"
                      ? "Yearly Plan"
                      : "Monthly Plan"}
                  </Badge>
                </div>

                {subscription.status === "past_due" && (
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
                      : "N/A"}
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
                          : "N/A"}
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
                    } catch {
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
              </>
            ) : (
              <div className="space-y-4 text-center py-4">
                <Crown className="w-12 h-12 text-amber-500 mx-auto" />
                <div>
                  <h4 className="font-medium mb-1">Upgrade to Pro</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlock all worldbuilding tools and advanced features.
                  </p>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/pricing");
                  }}
                >
                  <Crown className="w-4 h-4" />
                  View Plans
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="mt-4">
            <ExportSettings />
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Language</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your preferred language. More languages coming soon.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors text-left",
                    i18n.language === lang.code
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30 hover:bg-accent/5"
                  )}
                >
                  <span className="font-medium">{lang.label}</span>
                  {i18n.language === lang.code && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Want StellarForge in your language?{" "}
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Let us know
              </a>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AvatarPickerDialog
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        onSelect={setAvatarUrl}
        currentUrl={avatarUrl}
      />
    </Dialog>
  );
};

export default SettingsDialog;
