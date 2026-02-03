import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Flame, 
  Trophy, 
  Users, 
  Music, 
  Palette,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Flame,
    title: "Daily Check-Ins & Streaks",
    description: "Build healthy habits with daily mood tracking, energy monitoring, and streak rewards.",
    color: "text-accent",
  },
  {
    icon: Trophy,
    title: "Achievements & Points",
    description: "Earn badges and points for consistent self-care. Unlock achievements as you grow.",
    color: "text-warning",
  },
  {
    icon: Users,
    title: "Anonymous Community",
    description: "Share your journey anonymously and find strength in others' stories.",
    color: "text-primary",
  },
  {
    icon: Music,
    title: "Nature Soundscapes",
    description: "Immerse in calming sounds like rain, ocean waves, and forest birds.",
    color: "text-success",
  },
  {
    icon: Palette,
    title: "Art Therapy Canvas",
    description: "Express emotions through creative art with our digital canvas.",
    color: "text-secondary-foreground",
  },
];

const WellnessSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">New Wellness Hub</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Your Complete Wellness Toolkit
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beyond chat support, discover a suite of innovative tools designed to 
            nurture your mental health journey every day.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.title}
                className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="hero" size="lg" asChild className="group">
            <Link to="/wellness">
              Explore Wellness Hub
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Free to use • No account required to explore
          </p>
        </div>
      </div>
    </section>
  );
};

export default WellnessSection;
