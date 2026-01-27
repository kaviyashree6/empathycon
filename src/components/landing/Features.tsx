import { Brain, MessageCircle, UserCheck, Shield, Heart, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI Sentiment Detection",
    description: "Our advanced AI analyzes emotional patterns in real-time, providing personalized support and identifying when you might need extra help.",
    color: "text-primary",
  },
  {
    icon: MessageCircle,
    title: "24/7 Chat Support",
    description: "Access compassionate support anytime, anywhere. Our AI companion is always available to listen without judgment.",
    color: "text-success",
  },
  {
    icon: UserCheck,
    title: "Therapist Escalation",
    description: "When needed, seamlessly connect with licensed mental health professionals who can provide specialized care.",
    color: "text-secondary-foreground",
  },
  {
    icon: Shield,
    title: "Privacy & Safety",
    description: "Your conversations are encrypted and protected. We comply with HIPAA, GDPR, and DPDP standards.",
    color: "text-primary",
  },
  {
    icon: Heart,
    title: "Mood Tracking",
    description: "Visualize your emotional journey with weekly mood graphs and insights to better understand your patterns.",
    color: "text-accent",
  },
  {
    icon: Clock,
    title: "Instant Response",
    description: "No waiting rooms or appointments. Get immediate empathetic responses when you need them most.",
    color: "text-success",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 gradient-calm">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            How EmpathyConnect Helps You
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A safe space designed with your mental well-being in mind
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              variant="feature"
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
