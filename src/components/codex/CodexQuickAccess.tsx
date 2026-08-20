import { Link } from "react-router-dom";
import { Network, ScrollText, Library, PenLine, Eye } from "lucide-react";

interface CodexQuickAccessProps {
  worldId: string;
}

const CodexQuickAccess = ({ worldId }: CodexQuickAccessProps) => {
  const links = [
    { label: "Write", icon: PenLine, to: `/worlds/${worldId}/write`, desc: "Draft prose and scenes for your world" },
    { label: "Wiki", icon: Library, to: `/worlds/${worldId}/wiki`, desc: "Browse and edit all knowledge entries" },
    { label: "Chronicle", icon: ScrollText, to: `/worlds/${worldId}/chronicle`, desc: "Timeline of world events" },
    { label: "Connections", icon: Network, to: `/worlds/${worldId}/connections`, desc: "Entity relationships and worksheet-to-worksheet data flow" },
    { label: "Showcase", icon: Eye, to: `/worlds/${worldId}/showcase`, desc: "Public showcase page for your world" },
  ];

  return (
    <div className="px-3 pt-2 pb-1">
      <div className="sf-divider mb-2" />
      <span className="font-serif text-[13px] italic text-t3 block mb-2">
        Quick Access
      </span>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="sf-fill-sweep sf-fill-sweep--secondary flex items-start gap-2 py-1.5 px-1 text-[12px] text-t3 hover:text-t1 transition-colors"
        >
          <link.icon className="w-3 h-3 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="uppercase tracking-wider font-heading text-[12px] block">
              {link.label}
            </span>
            <span className="text-[12px] text-t4 font-sans normal-case tracking-normal leading-tight block">
              {link.desc}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CodexQuickAccess;
