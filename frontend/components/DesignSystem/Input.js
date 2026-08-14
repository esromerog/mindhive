"use client";

import { useState } from "react";

// MH-Theme/body/base — the field text and the label share it, which is what
// makes a stacked label + field read as one control rather than two.
const BODY_BASE = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: "16px",
  lineHeight: "24px",
};

const FIELD_STYLE = {
  ...BODY_BASE,
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  margin: 0,
  paddingLeft: "16px",
  paddingRight: "16px",
  paddingTop: "4px",
  paddingBottom: "4px",
  height: "40px",
  borderRadius: "8px",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

// A textarea grows instead of being pinned to the 40px row, and its text needs
// to start at the top of the box rather than be vertically centred by the
// single-line height.
const MULTILINE_STYLE = {
  height: "auto",
  minHeight: "100px",
  paddingTop: "8px",
  paddingBottom: "8px",
  resize: "vertical",
};

const FOCUS_STYLE = {
  borderColor: "var(--MH-Theme-Primary-Dark, #336F8A)",
  boxShadow: "0 0 0 1px var(--MH-Theme-Primary-Dark, #336F8A)",
};

const DISABLED_STYLE = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  borderColor: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
  cursor: "default",
};

const INVALID_STYLE = {
  borderColor: "var(--MH-Theme-Warning-Base, #b9261a)",
};

const WRAPPER_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "4px",
  width: "100%",
};

const LABEL_STYLE = {
  ...BODY_BASE,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HINT_STYLE = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: "14px",
  lineHeight: "20px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The placeholder colour can't be reached from an inline style object, so it is
// the one rule that has to go through a stylesheet.
const PLACEHOLDER_STYLE = `
.DesignSystem-Input::placeholder {
  color: var(--MH-Theme-Neutrals-Medium, #A1A1A1);
  opacity: 1;
}
`;

let inputIdCounter = 0;

/**
 * Design System text field. Single line by default; `multiline` renders a
 * textarea with the same box. Matches Figma "Basic Input" (40px, 8px radius,
 * Inter Regular 16/24).
 *
 * @param {string} [label] - Text above the field. Wires up `htmlFor`/`id`.
 * @param {string} [hint] - Small helper text below the field.
 * @param {string} value - Current value (controlled).
 * @param {(next: string) => void} onChange - Called with the new string.
 * @param {string} [placeholder] - Placeholder text.
 * @param {boolean} [multiline=false] - Render a textarea instead of an input.
 * @param {number} [rows] - Textarea rows; `multiline` only.
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {boolean} [invalid=false] - Paints the border in the warning colour.
 * @param {string} [type="text"] - Native input type; single line only.
 * @param {string} [id] - Explicit id; one is generated when a label is given.
 * @param {React.CSSProperties} [style] - Override for the field box.
 * @param {React.CSSProperties} [wrapperStyle] - Override for the label+field column.
 * @param {string} [className] - Optional class on the field.
 * @param {object} [rest] - Forwarded to the input/textarea (aria-*, name, min…).
 *
 * @example
 * <Input label="Name" value={name} onChange={setName} />
 * @example
 * <Input label="Description" multiline value={desc} onChange={setDesc} />
 */
export default function Input({
  label,
  hint,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows,
  disabled = false,
  invalid = false,
  type = "text",
  id,
  style = {},
  wrapperStyle = {},
  className,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [generatedId] = useState(() => `ds-input-${++inputIdCounter}`);
  const fieldId = id || (label ? generatedId : undefined);

  let fieldStyle = { ...FIELD_STYLE };
  if (multiline) fieldStyle = { ...fieldStyle, ...MULTILINE_STYLE };
  if (invalid) fieldStyle = { ...fieldStyle, ...INVALID_STYLE };
  if (focused && !disabled) fieldStyle = { ...fieldStyle, ...FOCUS_STYLE };
  if (disabled) fieldStyle = { ...fieldStyle, ...DISABLED_STYLE };
  fieldStyle = { ...fieldStyle, ...style };

  const Field = multiline ? "textarea" : "input";

  return (
    <div
      className="DesignSystem-Input-Wrapper"
      style={{ ...WRAPPER_STYLE, ...wrapperStyle }}
    >
      <style dangerouslySetInnerHTML={{ __html: PLACEHOLDER_STYLE }} />
      {label ? (
        <label htmlFor={fieldId} style={LABEL_STYLE}>
          {label}
        </label>
      ) : null}
      <Field
        id={fieldId}
        className={
          className ? `DesignSystem-Input ${className}` : "DesignSystem-Input"
        }
        style={fieldStyle}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={multiline ? rows : undefined}
        type={multiline ? undefined : type}
        aria-invalid={invalid || undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {hint ? <span style={HINT_STYLE}>{hint}</span> : null}
    </div>
  );
}
