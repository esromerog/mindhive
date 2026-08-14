"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const ROOT_STYLE = {
  display: "flex",
  alignItems: "stretch",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
};

const PANE_STYLE = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
};

// The gutter is wider than the visible grab handle so the divider is easy to
// hit; the handle itself is the 8x40 pill from the mockup.
const GUTTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: 12,
  alignSelf: "stretch",
  cursor: "col-resize",
  touchAction: "none",
  background: "transparent",
  border: "none",
  padding: 0,
};

const HANDLE_STYLE = {
  width: 8,
  height: 40,
  borderRadius: 100,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  transition: "background-color 0.2s",
};

const HANDLE_ACTIVE_STYLE = {
  background: "var(--MH-Theme-Primary-Dark, #336F8A)",
};

/**
 * Two resizable side-by-side regions with a draggable divider.
 *
 * The divider takes **pointer capture** on pointerdown. That is the whole point
 * of not using a plain mousemove splitter here: the pane next to it can contain
 * an iframe (the visual preview), and an iframe swallows mouse events, which
 * would otherwise leave the divider stuck to the cursor the moment the drag
 * crossed it.
 *
 * Sizing is a fraction of the container rather than a pixel width, so the split
 * survives a window resize and a rail animating open beside it.
 *
 * @param {React.ReactNode} start - Left region.
 * @param {React.ReactNode} end - Right region.
 * @param {number} [defaultFraction=0.5] - Initial share of the width given to `start`.
 * @param {number} [minStart=280] - Minimum px width of the start region.
 * @param {number} [minEnd=280] - Minimum px width of the end region.
 * @param {boolean} [collapsed=false] - Hides `end` and the divider; `start` takes the full width.
 * @param {(fraction: number) => void} [onFractionChange] - Fires as the divider moves.
 * @param {string} [ariaLabel="Resize panels"] - Accessible name for the divider.
 * @param {React.CSSProperties} [style] - Override for the root.
 *
 * @example
 * <SplitPane start={<WorkPanels />} end={<Preview />} defaultFraction={0.5} />
 */
export default function SplitPane({
  start,
  end,
  defaultFraction = 0.5,
  minStart = 280,
  minEnd = 280,
  collapsed = false,
  onFractionChange,
  ariaLabel = "Resize panels",
  style = {},
}) {
  const rootRef = useRef(null);
  const [fraction, setFraction] = useState(defaultFraction);
  const [dragging, setDragging] = useState(false);

  const applyClientX = useCallback(
    (clientX) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const total = rect.width;
      if (total <= 0) return;

      // Clamp in pixels, then convert back — a fraction clamp would let a
      // narrow window push a pane below its minimum.
      const raw = clientX - rect.left;
      const lower = minStart;
      const upper = total - minEnd;
      if (upper < lower) return; // Too narrow to honour both minimums.
      const clamped = Math.min(Math.max(raw, lower), upper);
      const next = clamped / total;
      setFraction(next);
      onFractionChange?.(next);
    },
    [minStart, minEnd, onFractionChange]
  );

  // Keep the split honest when the container itself changes width.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const total = root.getBoundingClientRect().width;
      if (total <= 0) return;
      const upper = total - minEnd;
      if (upper < minStart) return;
      setFraction((current) => {
        const px = current * total;
        const clamped = Math.min(Math.max(px, minStart), upper);
        return clamped / total;
      });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [minStart, minEnd]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    applyClientX(e.clientX);
  };

  const endDrag = (e) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  const onKeyDown = (e) => {
    const root = rootRef.current;
    if (!root) return;
    const total = root.getBoundingClientRect().width;
    const step = e.shiftKey ? 64 : 16;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyClientX(root.getBoundingClientRect().left + fraction * total - step);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      applyClientX(root.getBoundingClientRect().left + fraction * total + step);
    }
  };

  return (
    <div
      ref={rootRef}
      className="DesignSystem-SplitPane"
      style={{ ...ROOT_STYLE, ...style }}
    >
      <div
        className="DesignSystem-SplitPane-Start"
        style={{
          ...PANE_STYLE,
          flex: collapsed ? "1 1 100%" : `0 0 ${fraction * 100}%`,
        }}
      >
        {start}
      </div>
      {collapsed ? null : (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={ariaLabel}
            aria-valuenow={Math.round(fraction * 100)}
            tabIndex={0}
            className="DesignSystem-SplitPane-Divider"
            style={GUTTER_STYLE}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
          >
            <span
              style={{
                ...HANDLE_STYLE,
                ...(dragging ? HANDLE_ACTIVE_STYLE : null),
              }}
            />
          </div>
          <div
            className="DesignSystem-SplitPane-End"
            style={{ ...PANE_STYLE, flex: "1 1 0%" }}
          >
            {end}
          </div>
        </>
      )}
    </div>
  );
}
