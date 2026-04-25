import { lazy, Suspense } from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

interface QuestionSectionProps {
  id: string;
  label: string;
  prompts: string[];
  example?: string;
  value: string;
  onChange: (value: string) => void;
}

const QuestionSection = ({
  id,
  label,
  prompts,
  example,
  value,
  onChange,
}: QuestionSectionProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {example && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-t3 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p className="text-xs">{example}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    {prompts.length > 0 && (
      <ul className="text-xs text-tier-4 mb-2 list-disc list-inside">
        {prompts.map((prompt, i) => (
          <li key={i}>{prompt}</li>
        ))}
      </ul>
    )}
    <Suspense
      fallback={
        <div className="min-h-[100px] rounded-md border border-border bg-background/50 animate-pulse" />
      }
    >
      <RichTextEditor
        content={value}
        onChange={onChange}
        placeholder="Your response..."
        minHeight="100px"
        className="bg-background/50"
      />
    </Suspense>
  </div>
);

export default QuestionSection;
