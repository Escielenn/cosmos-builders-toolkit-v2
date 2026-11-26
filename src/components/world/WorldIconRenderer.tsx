import { WorldGlyph } from "@/components/icons/world-glyphs";
import { resolveWorldIconId } from "@/lib/world-icons";

interface WorldIconRendererProps {
  iconId: string | null | undefined;
  className?: string;
}

/**
 * The one renderer for a world's icon. Whatever is stored (a glyph id, an
 * old lucide id, a retired "/world-pics/…" illustration path, nothing)
 * draws as one glyph of the world line family, in currentColor.
 */
const WorldIconRenderer = ({ iconId, className }: WorldIconRendererProps) => (
  <WorldGlyph id={resolveWorldIconId(iconId)} className={className} />
);

export default WorldIconRenderer;
