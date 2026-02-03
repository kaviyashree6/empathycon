import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import WellnessSection from "@/components/landing/WellnessSection";
import Privacy from "@/components/landing/Privacy";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <WellnessSection />
        <Privacy />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
