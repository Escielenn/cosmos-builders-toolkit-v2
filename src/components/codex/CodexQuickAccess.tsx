import { Link } from "react-router-dom";
import { Network, BookOpen, ScrollText, Library } from "lucide-react";

interface CodexQuickAccessProps {
  worldId: string;
}

const CodexQuickAccess = ({ worldId }: CodexQuickAccessProps) => {
  const links = [
    { label: "Wiki", icon: Library, to: `/worlds/${worldId}/wiki` },
    { label: "Chronicle", icon: ScrollText, to: `/worlds/${worldId}/chronicle` },
    { label: "World Graph", icon: Network, to: `/worlds/${worldId}/graph` },
    { label: "Connections", icon: BookOpen, to: `/worlds/${worldId}/connections` },
  ];

  return (
    <div className="px-3 pt-2 pb-1">
      <div className="sf-divider mb-2" />
      <span className="font-heading text-[10px] uppercase tracking-[2px] text-muted-foreground/40 block mb-1.5">
        Quick Access
      </span>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="sf-fill-sweep sf-fill-sweep--secondary flex items-center gap-2 py-1 px-1 text-[11px] text-foreground/60 hover:text-foreground/90 transition-colors"
        >
          <link.icon className="w-3 h-3 shrink-0" />
          <span className="uppercase tracking-wider font-heading text-[10px]">
            {link.label}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default CodexQuickAccess;
