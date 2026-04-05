// ---------------------------------------------------------------------------
// SocialShareButtons — Share to Twitter/X, Reddit, Discord copy, etc.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShareButtons({
  url,
  title,
  description = "",
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shareLinks = [
    {
      name: "Twitter / X",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "#1DA1F2",
    },
    {
      name: "Reddit",
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      color: "#FF5700",
    },
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "#0A66C2",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "#1877F2",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy link.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-heading uppercase tracking-[2px] text-tier-4">
        Share
      </p>

      <div className="flex flex-wrap gap-1.5">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-sans text-tier-2 hover:text-tier-1 border border-border/20 hover:border-white/15 transition-colors"
            style={{ borderLeftColor: `${link.color}40`, borderLeftWidth: 2 }}
          >
            <ExternalLink className="w-3 h-3" />
            {link.name}
          </a>
        ))}

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-sans text-tier-2 hover:text-teal border border-border/20 hover:border-teal/20 transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-teal" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
