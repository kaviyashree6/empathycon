import { Lock, Eye, Trash2, FileCheck } from "lucide-react";

const privacyFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All messages are encrypted in transit and at rest",
  },
  {
    icon: Eye,
    title: "Anonymized Data",
    description: "Your identity is protected with pseudonymous tracking",
  },
  {
    icon: Trash2,
    title: "Data Control",
    description: "Withdraw consent and delete your data anytime",
  },
  {
    icon: FileCheck,
    title: "Compliance",
    description: "HIPAA, GDPR, and DPDP compliant",
  },
];

const Privacy = () => {
  return (
    <section id="privacy" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Privacy Matters</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Safe, Secure, and Confidential
            </h2>
            <p className="text-lg text-muted-foreground">
              We take your privacy seriously with enterprise-grade security measures
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {privacyFeatures.map((feature, index) => (
              <div 
                key={feature.title}
                className="flex items-start gap-4 p-6 rounded-2xl bg-muted/50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-secondary/30 border border-secondary text-center">
            <p className="text-sm text-secondary-foreground">
              EmpathyConnect complies with global privacy standards including HIPAA, GDPR, and DPDP. 
              Your data is automatically deleted after 90 days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
