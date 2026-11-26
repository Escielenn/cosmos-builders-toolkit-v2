/**
 * The Bridge's cover band: an optional, compact strip of the world's cover
 * image. Rendered only when a cover is set.
 *
 * 1.6 "Quiet Instrument" (finding 17): it used to be a card that, with no
 * image, showed a full-width dashed "Add header image" box and carried the
 * tags and cascade bar. Adding a cover is now "Add cover" in the Bridge's
 * header menu; tags sit on the meta line; the cascade is a cockpit panel.
 */
interface WorldHeaderProps {
  /** Used for the image's accessible name only; never rendered as a title. */
  name: string;
  headerImageUrl: string;
  headerImageFocusY?: number;
  /** Owner only: clicking the band opens the edit dialog. */
  onEditClick?: () => void;
}

const WorldHeader = ({ name, headerImageUrl, headerImageFocusY, onEditClick }: WorldHeaderProps) => {
  const img = (
    <img
      src={headerImageUrl}
      alt={`${name} cover image`}
      className="h-full w-full object-cover"
      style={{ objectPosition: `center ${headerImageFocusY ?? 50}%` }}
    />
  );

  if (!onEditClick) {
    return <div className="mb-4 h-20 w-full overflow-hidden border border-sf-line md:h-28">{img}</div>;
  }

  return (
    <button
      type="button"
      onClick={onEditClick}
      aria-label="Change cover image"
      className="group relative mb-4 block h-20 w-full overflow-hidden border border-sf-line md:h-28"
    >
      {img}
      <span className="absolute inset-0 flex items-center justify-center bg-[var(--sf-scrim)] opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="font-heading text-sf-eyebrow uppercase text-t1">Change cover</span>
      </span>
    </button>
  );
};

export default WorldHeader;
