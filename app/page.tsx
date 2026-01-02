import Header from "./_components/header";
import HeroSection from "./_components/hero-section";
import FeaturesSection from "./_components/features-section";
import CTASection from "./_components/cta-section";
import Footer from "./_components/footer";
import PricingPlan from "./_components/pricing-plan";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <PricingPlan />
      <CTASection />
      <Footer />
    </div>
  );
}
