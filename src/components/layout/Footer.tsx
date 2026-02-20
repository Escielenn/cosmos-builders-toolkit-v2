import { Link } from "react-router-dom";
import { Mail, Linkedin, Instagram } from "lucide-react";
import CubeLogo from "@/components/icons/CubeLogo";
import SubstackIcon from "@/components/icons/SubstackIcon";
import CosmicVelocityTicker from "./CosmicVelocityTicker";

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
      { name: "Bookshelf", href: "/bookshelf" },
      { name: "Changelog", href: "/changelog" },
      { name: "Contact", href: "/contact" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  };

  const social = [
    {
      name: "Substack",
      href: "https://xenomythology.substack.com/",
      icon: SubstackIcon,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/jasonbatt/",
      icon: Linkedin,
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/jasondbattphd/",
      icon: Instagram,
    },
    {
      name: "Email",
      href: "mailto:support@stellarforge.tools",
      icon: Mail,
    },
  ];

  return (
    <footer className="border-t border-dashed border-border/20 bg-[#0A0E17]/80 backdrop-blur-sm">
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

            {/* Privacy Statement */}
            <div className="mt-6 pt-4 border-t border-dashed border-border/15">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Your Worlds Are Yours Alone
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We can't access your creative work. Ever. No AI training. No data mining.
                No third-party sharing. Your unpublished stories stay unpublished until you
                decide otherwise.
              </p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-heading text-xs font-medium uppercase tracking-wider text-foreground mb-4">
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
            <h3 className="font-heading text-xs font-medium uppercase tracking-wider text-foreground mb-4">
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
            <h3 className="font-heading text-xs font-medium uppercase tracking-wider text-foreground mb-4">
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
        <div className="mt-12 pt-8 border-t border-dashed border-border/20">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-end gap-6">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
              <p>
                A{" "}
                <a
                  href="https://dreamsidestudios.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Dreamside Studios
                </a>{" "}
                production
              </p>
              <p className="mt-1">
                © 2025–{currentYear}{" "}
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
              <p className="mt-1">
                Unauthorized copying, modification, or distribution prohibited.
              </p>
              </div>
              <CosmicVelocityTicker />
            </div>
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
