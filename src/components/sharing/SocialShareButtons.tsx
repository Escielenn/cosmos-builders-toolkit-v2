// ---------------------------------------------------------------------------
// SocialShareButtons, Share to Twitter/X, Reddit, Discord copy, etc.
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
      toast({ title: "LINK COPIED TO CLIPBOARD." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "FAILED TO COPY LINK.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-heading uppercase tracking-wide text-t4">
        Share
      </p>

      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-hit items-center gap-1.5 px-3 py-1.5 text-[12px] font-sans text-t2 hover:text-t1 border border-sf-line hover:border-sf-line-emphasis transition-colors"
            style={{ borderLeftColor: `${link.color}40`, borderLeftWidth: 2 }}
          >
            <ExternalLink className="w-3 h-3" />
            {link.name}
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-hit items-center gap-1.5 px-3 py-1.5 text-[12px] font-sans text-t2 hover:text-sf-primary-text border border-sf-line hover:border-sf-primary transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-sf-emerald" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "LINK COPIED." : "COPY LINK"}
        </button>
      </div>
    </div>
  );
}
