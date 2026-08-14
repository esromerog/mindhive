"use client";

import { useState } from "react";

const TARGET_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  flexShrink: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

// Unlike the checkbox, a selected radio keeps its ring and gains a dot — that
// is what distinguishes "one of these" from "this is on".
const RING_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: 20,
  height: 20,
  borderRadius: "50%",
  border: "2px solid var(--MH-Theme-Primary-Dark, #336F8A)",
  background: "transparent",
  transition: "border-color 0.2s",
};

const RING_HOVER_STYLE = {
  borderColor: "var(--MH-Theme-Primary-Base, #337C84)",
};

const RING_DISABLED_STYLE = {
  borderColor: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
};

const DOT_STYLE = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "var(--MH-Theme-Primary-Dark, #336F8A)",
};

const DOT_DISABLED_STYLE = {
  background: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
};

const FOCUS_VISIBLE_STYLE = `
.DesignSystem-Radio:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
  border-radius: 50%;
}
`;

/**
 * Design System radio. A single `role="radio"` button; group them yourself in a
 * container with `role="radiogroup"` — in the mockups each option is a whole
 * card, so the group wrapper belongs to the caller, not here.
 *
 * @param {boolean} checked - Whether this option is the selected one.
 * @param {() => void} onChange - Called when the user picks this option.
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {string} [ariaLabel] - Accessible name when no visible label is tied to it.
 * @param {string} [ariaLabelledBy] - Id of the element naming this radio.
 * @param {React.CSSProperties} [style] - Override for the 24px target.
 *
 * @example
 * <Radio checked={mode === "sandbox"} onChange={() => setMode("sandbox")} ariaLabel="Sandbox mode" />
 */
export default function Radio({
  checked = false,
  onChange,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  style = {},
}) {
  const [hovered, setHovered] = useState(false);

  let ringStyle = { ...RING_STYLE };
  if (!disabled && hovered) ringStyle = { ...ringStyle, ...RING_HOVER_STYLE };
  if (disabled) ringStyle = { ...ringStyle, ...RING_DISABLED_STYLE };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_VISIBLE_STYLE }} />
      <button
        type="button"
        role="radio"
        className="DesignSystem-Radio"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        style={{ ...TARGET_STYLE, ...(disabled ? { cursor: "default" } : null), ...style }}
        onClick={() => !disabled && !checked && onChange?.()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={ringStyle}>
          {checked ? (
            <span
              style={{
                ...DOT_STYLE,
                ...(disabled ? DOT_DISABLED_STYLE : null),
              }}
            />
          ) : null}
        </span>
      </button>
    </>
  );
}
