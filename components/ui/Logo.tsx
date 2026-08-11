/**
 * The official IAgentics lockup, supplied as a white PNG on transparency.
 *
 * It is applied as a CSS mask rather than an <img>, so it renders in whatever the
 * current text color is and themes correctly in light and dark. The shape stays
 * pixel-exact to the file the client provided - nothing here redraws the mark.
 *
 * Native aspect ratio: 1135 x 267.
 */
export function Logo({
  className = "",
  label = "IAgentics",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`brand-lockup block aspect-[1135/267] ${className}`}
    />
  );
}
