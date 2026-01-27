import { Heart, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="helplines" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        {/* Crisis Helplines */}
        <div className="mb-12 p-6 rounded-2xl bg-background/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-accent" />
            <h3 className="font-display font-semibold text-lg">Crisis Helplines</h3>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">USA</p>
              <p className="text-background/70">988 Suicide & Crisis Lifeline</p>
            </div>
            <div>
              <p className="font-medium">UK</p>
              <p className="text-background/70">116 123 (Samaritans)</p>
            </div>
            <div>
              <p className="font-medium">India</p>
              <p className="text-background/70">iCall: 9152987821</p>
            </div>
            <div>
              <p className="font-medium">International</p>
              <p className="text-background/70">findahelpline.com</p>
            </div>
          </div>
        </div>

        {/* Main Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">EmpathyConnect</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link to="/privacy-policy" className="text-background/70 hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-background/70 hover:text-background transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-background/70 hover:text-background transition-colors">
              Contact Us
            </Link>
          </nav>

          <p className="text-sm text-background/60">
            © 2026 EmpathyConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
