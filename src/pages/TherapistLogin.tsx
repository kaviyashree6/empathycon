import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Mail, Lock, ArrowRight, Stethoscope, Shield, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const TherapistLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem("therapist_session");
    if (session) {
      navigate("/therapist/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const THERAPIST_PASSWORD = "therapist@123";

    if (password !== THERAPIST_PASSWORD) {
      toast.error("Invalid credentials");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      setIsLoading(false);
      return;
    }

    localStorage.setItem("therapist_session", JSON.stringify({
      email,
      loggedInAt: new Date().toISOString(),
    }));

    toast.success("Login successful!");
    navigate("/therapist/dashboard");
    setIsLoading(false);
  };

  const features = [
    { icon: Shield, label: "Real-time Crisis Alerts", desc: "Instant notifications for high-risk cases" },
    { icon: Users, label: "Case Management", desc: "Track and resolve escalated sessions" },
    { icon: Activity, label: "Analytics Dashboard", desc: "Monitor trends and response metrics" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding & features */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden flex-col justify-between p-12 text-primary-foreground">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-12 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-2xl font-display font-bold">EmpathyConnect</span>
          </Link>
          <p className="text-sm opacity-80 ml-14">Therapist Portal</p>
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl font-display font-bold leading-tight">
            Monitor. Respond.<br />Support.
          </h2>
          <p className="text-base opacity-90 max-w-md leading-relaxed">
            Your command center for real-time crisis detection and patient wellbeing oversight.
          </p>

          <div className="space-y-4 pt-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.label}</p>
                  <p className="text-xs opacity-75">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs opacity-60">
          © {new Date().getFullYear()} EmpathyConnect · HIPAA Compliant
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center justify-center gap-2 lg:hidden">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">EmpathyConnect</span>
          </Link>

          <div className="text-center lg:text-left">
            <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto lg:mx-0 mb-4 flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-secondary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to access your dashboard</p>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@empathyconnect.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-11 mt-2 gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Need access?{" "}
            <a href="mailto:admin@empathyconnect.com" className="text-primary hover:underline">
              Contact your administrator
            </a>
          </p>

          <div className="text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistLogin;
