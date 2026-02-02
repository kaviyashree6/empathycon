import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Mail, Lock, ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TherapistLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as therapist
    const session = localStorage.getItem("therapist_session");
    if (session) {
      navigate("/therapist/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Fixed password for therapist access
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

    // Store therapist session
    localStorage.setItem("therapist_session", JSON.stringify({ 
      email, 
      loggedInAt: new Date().toISOString() 
    }));

    toast.success("Login successful!");
    navigate("/therapist/dashboard");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Heart className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">EmpathyConnect</span>
        </Link>

        <Card variant="elevated">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-secondary-foreground" />
            </div>
            <CardTitle className="text-2xl">Therapist Portal</CardTitle>
            <CardDescription>
              Sign in to access the escalation dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="therapist@empathyconnect.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full mt-6" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          For therapist account access, contact admin@empathyconnect.com
        </p>
      </div>
    </div>
  );
};

export default TherapistLogin;
