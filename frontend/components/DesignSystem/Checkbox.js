"use client";

import { useState } from "react";

// The box is 20x20 but sits in a 24x24 target so it lines up with the 24px
// icons everywhere else in a row of controls.
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

const BOX_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: 20,
  height: 20,
  borderRadius: 4,
  border: "2px solid var(--MH-Theme-Primary-Dark, #336F8A)",
  background: "transparent",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  transition: "background-color 0.2s, border-color 0.2s",
};

// Checked is a fill, not a fill plus a heavier outline — the border colour is
// already the fill colour, so the box simply solidifies.
const BOX_CHECKED_STYLE = {
  background: "var(--MH-Theme-Primary-Dark, #336F8A)",
};

const BOX_HOVER_STYLE = {
  borderColor: "var(--MH-Theme-Primary-Base, #337C84)",
};

const BOX_DISABLED_STYLE = {
  borderColor: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  background: "transparent",
  cursor: "default",
};

const BOX_DISABLED_CHECKED_STYLE = {
  borderColor: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  background: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
};

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M1.5 7.5L5 11L12.5 3"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const INDETERMINATE = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M2.5 7H11.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const FOCUS_VISIBLE_STYLE = `
.DesignSystem-Checkbox:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
  border-radius: 4px;
}
`;

/**
 * Design System checkbox. Renders a `role="checkbox"` button rather than a
 * native input so the box can be styled directly; the label, when there is one,
 * lives outside it (rows in the mockups put the description on the left and the
 * control on the right).
 *
 * @param {boolean} checked - Current state (controlled).
 * @param {(next: boolean) => void} onChange - Called with the toggled value.
 * @param {boolean} [indeterminate=false] - Draws a dash instead of a tick.
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {string} [ariaLabel] - Accessible name when no visible label is tied to it.
 * @param {string} [ariaLabelledBy] - Id of the element naming this checkbox.
 * @param {React.CSSProperties} [style] - Override for the 24px target.
 *
 * @example
 * <Checkbox checked={normalize} onChange={setNormalize} ariaLabel="Normalize" />
 */
export default function Checkbox({
  checked = false,
  onChange,
  indeterminate = false,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  style = {},
}) {
  const [hovered, setHovered] = useState(false);

  let boxStyle = { ...BOX_STYLE };
  if (checked || indeterminate) boxStyle = { ...boxStyle, ...BOX_CHECKED_STYLE };
  if (!disabled && hovered) boxStyle = { ...boxStyle, ...BOX_HOVER_STYLE };
  if (disabled) {
    boxStyle = {
      ...boxStyle,
      ...(checked || indeterminate
        ? BOX_DISABLED_CHECKED_STYLE
        : BOX_DISABLED_STYLE),
    };
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_VISIBLE_STYLE }} />
      <button
        type="button"
        role="checkbox"
        className="DesignSystem-Checkbox"
        aria-checked={indeterminate ? "mixed" : checked}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        style={{ ...TARGET_STYLE, ...(disabled ? { cursor: "default" } : null), ...style }}
        onClick={() => !disabled && onChange?.(!checked)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={boxStyle}>
          {indeterminate ? INDETERMINATE : checked ? CHECK : null}
        </span>
      </button>
    </>
  );
}
