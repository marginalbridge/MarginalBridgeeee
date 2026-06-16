import {
  AboutSection,
  FeaturesSection,
  HeroSection,
} from "@/components/marketing/MarketingSections";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { CtaSection, PricingSection } from "@/components/marketing/PricingSection";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingHeader />
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
