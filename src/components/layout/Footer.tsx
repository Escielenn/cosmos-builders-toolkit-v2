import { Link } from "react-router-dom";
import { Mail, Linkedin, Instagram } from "lucide-react";
import CubeLogo from "@/components/icons/CubeLogo";
import { Wordmark } from "@/components/brand/Wordmark";
import SubstackIcon from "@/components/icons/SubstackIcon";
import { APP_VERSION } from "@/config/version";
import { BuildSigil } from "@/components/ambient/BuildSigil";
import { CommitTicker } from "@/components/ambient/CommitTicker";
/* CosmicVelocityTicker removed, velocity data now in StatusBar */

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigation = {
    product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Tools", href: "/#tools" },
      { name: "Roadmap", href: "/roadmap" },
      { name: "Writing Prompts", href: "/workshop" },
      { name: "Community", href: "/community" },
      { name: "Commendations", href: "/commendations" },
    ],
    resources: [
      { name: "Guide", href: "/guide" },
      { name: "Learn", href: "/learn" },
      { name: "Getting Started", href: "/getting-started" },
      { name: "Field Manual", href: "/guide/field-manual" },
      { name: "Bookshelf", href: "/bookshelf" },
      { name: "Contact", href: "/contact" },
      { name: "About", href: "/about" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Credits", href: "/credits" },
      { name: "Changelog", href: "/changelog" },
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
    <footer className="border-t border-dashed border-sf-line-interactive bg-sf-void/80 backdrop-blur-sf-panel">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-start gap-4 mb-4">
              <Link to="/" className="flex items-center gap-3">
                <CubeLogo size={36} className="rounded-none" />
                <div className="flex flex-col">
                  <Wordmark size="md" uppercase />
                  <span className="font-mono text-[12px] text-t4 tracking-[0.18em]">
                    39.87°N · 104.97°W
                  </span>
                </div>
              </Link>
            </div>
            <p className="text-sm text-t3 max-w-xs mb-6">
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
                  className="text-t3 hover:text-sf-teal-bright transition-colors duration-base"
                  aria-label={item.name}
                >
                  <item.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Privacy Statement */}
            <div className="mt-6 pt-4 border-t border-dashed border-sf-line-interactive">
              <h4 className="font-heading text-[12px] font-medium uppercase tracking-[0.2em] text-t1 mb-2">
                YOUR WORLDS ARE YOURS ALONE
              </h4>
              <p className="text-xs text-t3 leading-relaxed">
                All creative content is encrypted, user-isolated, and never accessed by StellarForge systems.
                No AI training. No data mining. No third-party sharing.
              </p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-heading text-[12px] font-medium uppercase tracking-[0.2em] text-t3 mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-t3 hover:text-sf-teal-bright transition-colors duration-base sf-text-link"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-heading text-[12px] font-medium uppercase tracking-[0.2em] text-t3 mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-t3 hover:text-sf-teal-bright transition-colors duration-base sf-text-link"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-heading text-[12px] font-medium uppercase tracking-[0.2em] text-t3 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-t3 hover:text-sf-teal-bright transition-colors duration-base sf-text-link"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar, coordinates, build, copyright */}
        <div className="mt-12 pt-8 border-t border-dashed border-sf-line-interactive">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="font-mono text-[12px] tracking-[0.18em] text-t4 text-center sm:text-left space-y-1">
              <p>
                <span className="text-t4">//</span>{" "}
                <a
                  href="https://dreamsidestudios.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sf-teal-bright transition-colors duration-base sf-text-link"
                >
                  DREAMSIDE STUDIOS
                </a>{" "}
                PRODUCTION
              </p>
              <p>
                © 2025–{currentYear}{" "}
                <a
                  href="https://jbatt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sf-teal-bright transition-colors duration-base sf-text-link"
                >
                  JASON D. BATT, PH.D.
                </a>
              </p>
              <p className="text-t4">
                UNAUTHORIZED COPYING, MODIFICATION, OR DISTRIBUTION PROHIBITED.
              </p>
            </div>
            <div className="font-mono text-[12px] tracking-[0.18em] text-t4 text-center sm:text-right space-y-1">
              <p>39.87°N · 104.97°W</p>
              <p><BuildSigil /></p>
              <p className="hidden sm:block"><CommitTicker /></p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
