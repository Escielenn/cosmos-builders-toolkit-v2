import { Link } from "react-router-dom";
import { Mail, Github, Twitter } from "lucide-react";
import CubeLogo from "@/components/icons/CubeLogo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigation = {
    product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Tools", href: "/#tools" },
    ],
    resources: [
      { name: "Learn", href: "/learn" },
      { name: "Contact", href: "/contact" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  };

  const social = [
    {
      name: "Twitter",
      href: "https://twitter.com/stellarforge",
      icon: Twitter,
    },
    {
      name: "GitHub",
      href: "https://github.com/stellarforge",
      icon: Github,
    },
    {
      name: "Email",
      href: "mailto:hello@stellarforge.io",
      icon: Mail,
    },
  ];

  return (
    <footer className="border-t border-border/30 bg-[#0a0a0a]/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <CubeLogo size={36} className="rounded-lg" />
              <div className="flex flex-col">
                <span className="font-display font-light text-lg leading-tight tracking-sf-wide text-white uppercase">
                  STELLARFORGE
                </span>
                <span className="text-xs text-muted-foreground tracking-wide">
                  Forge the Future
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Science-first worldbuilding tools for writers, game designers, and
              creators who demand internal consistency.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={item.name}
                >
                  <item.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-display text-xs font-medium uppercase tracking-wider text-foreground mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-display text-xs font-medium uppercase tracking-wider text-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display text-xs font-medium uppercase tracking-wider text-foreground mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {currentYear}{" "}
              <a
                href="https://jbatt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Jason D. Batt, Ph.D.
              </a>{" "}
              All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Made with science and imagination
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
