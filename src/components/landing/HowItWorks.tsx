import { CascadeSteps } from "./CascadeSteps";
import { MarketingSection, SectionHeading } from "./marketing-ui";

/** The cascade in three steps (the hero's "See how it works" anchor). */
export default function HowItWorks(): JSX.Element {
  return (
    <MarketingSection id="how-it-works" labelledBy="how-title">
      <SectionHeading
        id="how-title"
        label="How it works"
        title="Change one number. Watch the world answer."
        lede="Physics shapes environment, environment shapes life, life shapes minds, minds make myths, myths make culture. StellarForge keeps that chain intact, all the way to the page."
      />
      <CascadeSteps />
    </MarketingSection>
  );
}
