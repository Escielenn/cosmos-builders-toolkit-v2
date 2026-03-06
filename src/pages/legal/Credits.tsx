import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { Heart } from "lucide-react";

const creditsContent = `
## Resources & Credits

StellarForge is built with the help of talented creators and open resources. We believe in crediting the work that makes this platform possible.

---

## Backgrounds

Photography and background images sourced from [Unsplash](https://unsplash.com), provided by their generous community of photographers.

---

## Videos

Background video assets from [Envato Elements](https://elements.envato.com):

- **StrokeVorkz**
- **footager**
- **MacroLogic**
- **VisionVector**
- **Oleg_Reulets**
- **PoR888**
- **remotevfx**
- **savageerus**
- **IdgenioFix**
- **Graphics-Tech**
- **icetray**
- **Prkidee**

---

## Icons

Many meta and UI icons sourced from:

- **MyCog**
- **Envato Elements**

---

## Fonts

- **MD Nichrome** by [Mass-Driver](https://mass-driver.com) — used for display titles
- **Jura** — section headings and navigation
- **DM Sans** — body text and interface
- **JetBrains Mono** — data readouts and monospace elements

---

## Music

Ambient and cinematic audio tracks from [Envato Elements](https://elements.envato.com):

- **Alec_Koff**
- **cleanmindsounds**
- **Crypt-of-Insomnia**
- **DHDMusicStudio**
- **GentleJammers**
- **gilv**
- **keithmerrill**
- **LukePN**
- **PetRUalitY**
- **PremiumBeat**
- **puremusic**
- **ScoreStudio**
- **Stereo_Color**

---

## A Note on Creative Assets

All art, music, video, and icons used throughout StellarForge are created by living artists—not generative AI. We are committed to supporting and crediting human creators.
`;

const Credits = () => {
  return (
    <LegalPageLayout
      title="Resources & Credits"
      subtitle="Acknowledging the creators and resources that help power StellarForge."
      lastUpdated="March 6, 2026"
      badgeIcon={<Heart className="w-3 h-3 mr-1" />}
      badgeText="Credits"
      content={creditsContent}
    />
  );
};

export default Credits;
