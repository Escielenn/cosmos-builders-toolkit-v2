import { GlassPanel } from "@/components/ui/glass-panel";

interface WorksheetDataRendererProps {
  toolType: string;
  data: Record<string, unknown>;
}

const SKIP_KEYS = new Set(["_", "moodboard", "moodboardImages"]);

const formatLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

const renderValue = (value: unknown, depth: number = 0): React.ReactNode => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    return <p className="text-foreground/90 whitespace-pre-wrap">{value}</p>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="text-foreground/90">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;

    // Array of strings
    if (value.every((v) => typeof v === "string")) {
      return (
        <ul className="list-disc list-inside space-y-1 text-foreground/90">
          {value.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    // Array of objects
    return (
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="pl-4 border-l-2 border-border">
            {typeof item === "object" && item !== null ? (
              renderObject(item as Record<string, unknown>, depth + 1)
            ) : (
              <p className="text-foreground/90">{String(item)}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return renderObject(value as Record<string, unknown>, depth + 1);
  }

  return <p className="text-foreground/90">{String(value)}</p>;
};

const renderObject = (obj: Record<string, unknown>, depth: number): React.ReactNode => {
  const entries = Object.entries(obj).filter(
    ([key, val]) =>
      !SKIP_KEYS.has(key) &&
      !key.startsWith("_") &&
      val !== null &&
      val !== undefined &&
      val !== ""
  );

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      {entries.map(([key, val]) => {
        const rendered = renderValue(val, depth);
        if (!rendered) return null;

        return (
          <div key={key}>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              {formatLabel(key)}
            </h4>
            {rendered}
          </div>
        );
      })}
    </div>
  );
};

const WorksheetDataRenderer = ({ data }: WorksheetDataRendererProps) => {
  const entries = Object.entries(data).filter(
    ([key, val]) =>
      !SKIP_KEYS.has(key) &&
      !key.startsWith("_") &&
      !key.startsWith("moodboard") &&
      val !== null &&
      val !== undefined &&
      val !== ""
  );

  if (entries.length === 0) {
    return (
      <GlassPanel className="p-6">
        <p className="text-muted-foreground text-center">No data to display.</p>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([key, val]) => {
        const rendered = renderValue(val, 0);
        if (!rendered) return null;

        return (
          <GlassPanel key={key} className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4 text-foreground">
              {formatLabel(key)}
            </h3>
            {rendered}
          </GlassPanel>
        );
      })}
    </div>
  );
};

export default WorksheetDataRenderer;
