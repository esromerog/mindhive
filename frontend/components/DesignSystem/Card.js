"use client";

import { useState } from "react";

const BASE_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  overflow: "hidden",
  transition: "border-color 0.2s, background-color 0.2s, box-shadow 0.2s",
};

// A quieter card for nesting one card inside another — inputs rows inside a
// data source block, an option box inside a settings section. It reads as a
// region rather than an object, so it takes a fill and drops the outline.
const SUBTLE_STYLE = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  border: "1px solid transparent",
};

const SELECTED_STYLE = {
  borderColor: "var(--MH-Theme-Primary-Dark, #336F8A)",
};

const INTERACTIVE_HOVER_STYLE = {
  boxShadow: "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0,0,0,0.1))",
};

/**
 * Design System card surface: the 12px-radius container the mockups build every
 * panel, data source block and parameter row out of.
 *
 * Two looks. Default is white with a hairline outline, for a card sitting on
 * the page. `variant="subtle"` is a filled, outline-free box for a card nested
 * inside another card — never both a fill and an outline on the same surface.
 *
 * @param {React.ReactNode} children - Card contents.
 * @param {"default"|"subtle"} [variant="default"] - Surface treatment.
 * @param {boolean} [selected=false] - Draws the primary border.
 * @param {() => void} [onClick] - Makes the card a button; adds hover elevation.
 * @param {string} [accentColor] - Paints a 8px strip across the top of the card.
 * @param {number|string} [padding=0] - Inner padding; sections usually want 0 and pad themselves.
 * @param {string} [className] - Optional root class.
 * @param {React.CSSProperties} [style] - Override for the root.
 * @param {object} [rest] - Forwarded to the root element.
 *
 * @example
 * <Card><CardSection>…</CardSection></Card>
 * @example
 * <Card variant="subtle" padding={16}>Nested row</Card>
 */
export default function Card({
  children,
  variant = "default",
  selected = false,
  onClick,
  accentColor,
  padding = 0,
  className,
  style = {},
  ...rest
}) {
  const [hovered, setHovered] = useState(false);
  const interactive = typeof onClick === "function";

  let rootStyle = { ...BASE_STYLE };
  if (variant === "subtle") rootStyle = { ...rootStyle, ...SUBTLE_STYLE };
  if (selected) rootStyle = { ...rootStyle, ...SELECTED_STYLE };
  if (interactive && hovered) {
    rootStyle = { ...rootStyle, ...INTERACTIVE_HOVER_STYLE };
  }
  rootStyle = {
    ...rootStyle,
    padding,
    cursor: interactive ? "pointer" : undefined,
    ...style,
  };

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={className ? `DesignSystem-Card ${className}` : "DesignSystem-Card"}
      style={rootStyle}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      {accentColor ? (
        <span
          aria-hidden
          style={{ height: 8, flexShrink: 0, background: accentColor }}
        />
      ) : null}
      {children}
    </div>
  );
}

const SECTION_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  padding: 16,
};

const SECTION_DIVIDED_STYLE = {
  borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

/**
 * A horizontal band inside a Card. The mockups' blocks are a stack of these,
 * separated by hairlines — pass `divided` on every section after the first.
 *
 * @param {React.ReactNode} children - Section contents.
 * @param {boolean} [divided=false] - Draws the hairline above the section.
 * @param {React.CSSProperties} [style] - Override for the section.
 */
export function CardSection({ children, divided = false, style = {}, ...rest }) {
  return (
    <div
      className="DesignSystem-Card-Section"
      style={{
        ...SECTION_STYLE,
        ...(divided ? SECTION_DIVIDED_STYLE : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
