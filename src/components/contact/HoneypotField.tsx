import { forwardRef } from "react";

interface HoneypotFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Hidden honeypot field to catch bots
// Bots will fill this in, humans won't see it
const HoneypotField = forwardRef<HTMLInputElement, HoneypotFieldProps>(
  ({ value, onChange }, ref) => {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          height: 0,
          width: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <label htmlFor="website_url">Website URL</label>
        <input
          ref={ref}
          type="text"
          id="website_url"
          name="website_url"
          autoComplete="off"
          tabIndex={-1}
          value={value}
          onChange={onChange}
        />
      </div>
    );
  }
);

HoneypotField.displayName = "HoneypotField";

export default HoneypotField;
