import { getInfoboxFields } from "@/services/infoboxTemplates";
import { TOOL_DISPLAY_NAMES } from "@/lib/worksheet-links-config";

interface DataProfileInfoboxProps {
  toolSource: string;
  toolData: Record<string, unknown>;
  onViewInTool: () => void;
}

export function DataProfileInfobox({
  toolSource,
  toolData,
  onViewInTool,
}: DataProfileInfoboxProps) {
  const fields = getInfoboxFields(toolSource, toolData);
  if (fields.length === 0) return null;

  const toolName = TOOL_DISPLAY_NAMES[toolSource] || toolSource;

  return (
    <div className="sf-infobox">
      <div className="sf-infobox-header">DATA PROFILE</div>
      <div>
        {fields.map((field, i) => (
          <div key={i} className="sf-infobox-row">
            <span className="sf-infobox-label">{field.label}</span>
            <span className="sf-infobox-value">
              {field.value}
              {field.unit ? ` ${field.unit}` : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="sf-infobox-source">
        <span>Source: {toolName.toUpperCase()}</span>
        <button
          className="sf-fill-sweep sf-fill-sweep--secondary px-2 py-1 text-[9px] uppercase tracking-wider"
          onClick={onViewInTool}
        >
          View in {toolName}
        </button>
      </div>
    </div>
  );
}
