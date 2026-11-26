import { useState, useEffect } from "react";
import { User, LogIn, LogOut, Menu, Globe, Wrench, BookOpen, Sparkles, Mail, Settings, Search, Download, Library, Archive, Map, Compass, PenTool, Award, Users, Info, Zap, HelpCircle, MessageCircle, SlidersHorizontal, Tag, Music } from "lucide-react";
import HeaderNavigation from "./HeaderNavigation";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/Wordmark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AudioSelectorDialog from "@/components/audio/AudioSelectorDialog";
import { OPEN_AUDIO_SELECTOR_EVENT } from "@/components/audio/audio-events";
import SettingsDialog from "@/components/settings/SettingsDialog";
import GlobalSearch from "@/components/search/GlobalSearch";
import { DisplayMenu, DisplayMenuItems, MENU_LABEL_CLASS, MenuSection } from "./DisplayMenu";
import { OPEN_CONTACT_EVENT, OPEN_FIELD_MANUAL_EVENT } from "./FABStack";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";

// The ⌘K listener already accepts ctrlKey as well as metaKey, but the visible
// hint used to hardcode the Mac glyph regardless — telling Windows/Linux
// writers the wrong key for a shortcut that works for them too. Computed
// once at module load; it does not change during a session.
const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);

/**
 * Mobile navigation model.
 *
 * Grouped to mirror the desktop dropdowns in HeaderNavigation so the two
 * surfaces name the same destinations the same way. Previously this was a flat
 * 15-item list whose "Prompt Browser" pointed at /workshop#prompts while
 * desktop's pointed at /prompts, and whose "Tools" was a scroll-to-section that
 * did nothing away from the homepage.
 */
// Phone menu. Grouped like the desktop header so both name the same
// destinations the same way. Signed in, the app destinations lead and the
// marketing links follow; signed out, the marketing groups lead.
type NavGroup = { heading: string; items: { label: string; to: string; icon: typeof Globe }[] };

const APP_NAV: NavGroup[] = [
  {
    heading: "Write",
    items: [
      { label: "My worlds", to: "/worlds", icon: Globe },
      { label: "Studio", to: "/studio", icon: PenTool },
      { label: "Tools", to: "/tools", icon: Wrench },
      { label: "Writing prompts", to: "/prompts", icon: Sparkles },
    ],
  },
  {
    heading: "Library",
    items: [
      { label: "My collection", to: "/profile?tab=collection", icon: Library },
      { label: "Archive", to: "/profile?tab=archive", icon: Archive },
      { label: "Commendations", to: "/commendations", icon: Award },
    ],
  },
];

const MARKETING_NAV: NavGroup[] = [
  {
    heading: "Product",
    items: [
      { label: "Features", to: "/features", icon: Sparkles },
      { label: "Tools", to: "/tools", icon: Wrench },
      { label: "Pricing", to: "/pricing", icon: Tag },
    ],
  },
  {
    heading: "Learn",
    items: [
      { label: "SF University", to: "/learn", icon: BookOpen },
      { label: "Field Manual", to: "/guide", icon: Compass },
      { label: "Getting started", to: "/getting-started", icon: Sparkles },
      { label: "Bookshelf", to: "/bookshelf", icon: Library },
    ],
  },
  {
    heading: "Community",
    items: [
      { label: "Community", to: "/community", icon: Users },
      { label: "Roadmap", to: "/roadmap", icon: Map },
      { label: "About StellarForge", to: "/about", icon: Info },
      { label: "Contact", to: "/contact", icon: Mail },
    ],
  },
];

const sheetLinkClass =
  "flex items-center gap-3 px-3 min-h-hit text-sm font-medium text-t2 hover:text-t1 hover:bg-sf-primary/[0.06] rounded-none transition-colors duration-base";

const fire = (name: string) => window.dispatchEvent(new Event(name));

/**
 * Site header (1.6 "Quiet Instrument", finding 9 / 19).
 *
 * One lockup (Wordmark) at every width: the full mark on desktop, the compact
 * size on phones, never "SF". No build number (it lives in the footer).
 *
 * Signed out (marketing): Product, Learn, Community · search · Display · sign in.
 * Signed in (app): Worlds, Studio, Tools · search · Go Pro (free tier only,
 *   quiet ghost) · profile menu. The profile menu carries Display, Help and
 *   the marketing links that used to crowd the bar.
 * Phone: lockup, search, menu, profile (or sign in). Nothing else.
 */
const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { isSubscribed, isVanguard } = useSubscription();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("account");
  const [searchOpen, setSearchOpen] = useState(false);
  // Profile menu: which in-place section is expanded (one at a time, so the
  // menu stays short enough for a phone). Reset whenever the menu closes.
  const [accountSection, setAccountSection] = useState<"display" | "help" | "about" | null>(null);
  const sectionProps = (id: "display" | "help" | "about") => ({
    id,
    open: accountSection === id,
    onOpenChange: (open: boolean) => setAccountSection(open ? id : null),
  });

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const signedIn = !loading && !!user;
  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";
  const displayName = profile?.display_name || user?.email?.split("@")[0];
  const tierLabel = isVanguard ? "Vanguard" : isSubscribed ? "Pro" : "Free";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openSettings = (tab: string) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const mobileGroups = signedIn ? [...APP_NAV, ...MARKETING_NAV] : MARKETING_NAV;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-sf-line-hairline backdrop-blur-sf-side bg-sf-void/95">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Wordmark size="md" to="/" className="hidden sm:inline-flex shrink-0" />
        <Wordmark size="xs" to="/" className="sm:hidden shrink-0" />

        {/* Desktop navigation */}
        <div className="flex-1 flex justify-center lg:justify-start lg:pl-6 min-w-0">
          <HeaderNavigation mode={signedIn ? "app" : "marketing"} />
        </div>

        <div className="flex items-center gap-0 sm:gap-1 shrink-0">
          <button
            type="button"
            className="sf-nav-link inline-flex items-center justify-center gap-2 h-11 min-h-hit min-w-hit px-2 text-t3 hover:text-sf-primary-text transition-colors"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-4 h-4 relative z-[1]" aria-hidden="true" />
            <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded-none border border-sf-line bg-sf-surface px-2 font-mono text-[12px] font-medium text-t3 relative z-[1]">
              {isMac ? <span className="text-xs">⌘</span> : <span className="text-xs">Ctrl</span>}K
            </kbd>
          </button>

          {/* Every width: on phones this is the only way to the display
              settings when signed out. */}
          {!loading && !user && <DisplayMenu />}

          {/* Quiet: a nav-weight link, not a filled or outlined button. */}
          {signedIn && !isSubscribed && (
            <Link
              to="/pricing"
              className="sf-nav-link hidden md:inline-flex items-center gap-1.5 h-11 min-h-hit px-2 text-t3 hover:text-sf-primary-text transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-sf-primary-text relative z-[1]" aria-hidden="true" />
              <span className="font-heading text-sf-eyebrow uppercase relative z-[1]">Go Pro</span>
            </Link>
          )}

          {/* Phone + tablet menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="min-h-hit min-w-hit">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sf-surface border-sf-line sf-sb overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center">
                  <Wordmark size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6" aria-label="Site">
                {mobileGroups.map((group) => (
                  <div key={group.heading} className="mb-4 last:mb-0">
                    <p className={`${MENU_LABEL_CLASS} mb-1 border-b border-sf-line-hairline`}>
                      {group.heading}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={sheetLinkClass}
                        >
                          <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ))}
                <div className="mb-0">
                  <p className={`${MENU_LABEL_CLASS} mb-1 border-b border-sf-line-hairline`}>Help</p>
                  <button
                    type="button"
                    className={`${sheetLinkClass} w-full text-left`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      fire(OPEN_CONTACT_EVENT);
                    }}
                  >
                    <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                    Contact us
                  </button>
                  {!user && (
                    <button
                      type="button"
                      className={`${sheetLinkClass} w-full text-left`}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        fire(OPEN_AUDIO_SELECTOR_EVENT);
                      }}
                    >
                      <Music className="w-5 h-5 shrink-0" aria-hidden="true" />
                      Music
                    </button>
                  )}
                </div>
              </nav>
              {!loading && !user && (
                <div className="mt-8 pt-8 border-t border-sf-line-hairline">
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/auth");
                    }}
                  >
                    <LogIn className="w-4 h-4" />
                    Sign up or sign in
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {signedIn ? (
            <DropdownMenu modal={false} onOpenChange={(open) => { if (!open) setAccountSection(null); }}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="sf-nav-link inline-flex items-center gap-2 px-1.5 h-11 min-h-hit min-w-hit text-t2 hover:text-sf-primary-text transition-colors"
                  aria-label="Account menu"
                >
                  <Avatar className="w-7 h-7 shrink-0 relative z-[1]">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                collisionPadding={8}
                className="w-64 max-w-[calc(100vw-16px)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto sf-sb bg-sf-surface backdrop-blur-sf-side border-sf-line rounded-none"
              >
                <DropdownMenuLabel className="px-2 py-2 font-normal">
                  <span className="block truncate text-sm text-t1">{displayName}</span>
                  <span className="block font-heading text-sf-eyebrow uppercase text-t4">{tierLabel} account</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile?tab=collection")}>
                  <Library className="w-4 h-4 mr-2" />
                  My collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile?tab=archive")}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/commendations")}>
                  <Award className="w-4 h-4 mr-2" />
                  Commendations
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openSettings("account")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <MenuSection
                  {...sectionProps("display")}
                  label="Display"
                  icon={<SlidersHorizontal className="w-4 h-4 mr-2" aria-hidden="true" />}
                >
                  <DisplayMenuItems onOpenBackgroundPicker={() => openSettings("background")} />
                </MenuSection>
                <DropdownMenuItem onClick={() => openSettings("export")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")}>
                  <Zap className="w-4 h-4 mr-2" />
                  {isSubscribed ? "Manage subscription" : "Upgrade to Pro"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <MenuSection
                  {...sectionProps("help")}
                  label="Help"
                  icon={<HelpCircle className="w-4 h-4 mr-2" aria-hidden="true" />}
                >
                    <DropdownMenuItem onClick={() => navigate("/guide")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Guide
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => fire(OPEN_FIELD_MANUAL_EVENT)}>
                      <Compass className="w-4 h-4 mr-2" />
                      Field Manual
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => fire(OPEN_CONTACT_EVENT)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact us
                    </DropdownMenuItem>
                </MenuSection>
                <MenuSection
                  {...sectionProps("about")}
                  label="StellarForge"
                  icon={<Info className="w-4 h-4 mr-2" aria-hidden="true" />}
                >
                    <DropdownMenuItem onClick={() => navigate("/learn")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      SF University
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/community")}>
                      <Users className="w-4 h-4 mr-2" />
                      Community
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/features")}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Features
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/roadmap")}>
                      <Map className="w-4 h-4 mr-2" />
                      Roadmap
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/about")}>
                      <Info className="w-4 h-4 mr-2" />
                      About
                    </DropdownMenuItem>
                </MenuSection>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* The one auth entry point in the header. On phones it is the
               profile slot: an icon with an accessible name. */
            <Button
              variant="outline"
              size="sm"
              asChild
              className="min-h-hit min-w-hit gap-2 border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.08]"
            >
              <Link to="/auth#create-account" aria-label="Sign up or log in">
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign up or sign in</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Opened from the Display menu (no header button of its own). */}
      <AudioSelectorDialog showTrigger={false} />

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} defaultTab={settingsTab} />

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
};

export default Header;
