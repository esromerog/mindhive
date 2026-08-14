"use client";

import { createContext, useContext } from "react";

/**
 * Everything the builder's panels share.
 *
 * Deliberately *not* where live sample data goes. Once data sources land, the
 * per-sample values must stay outside React entirely — writing 256 Hz of EEG
 * into a context is what makes YQ re-render its whole tree per sample. Only the
 * things a panel renders from belong here.
 *
 * @typedef {object} VisualBuilderValue
 * @property {object} visual - The saved Visual record.
 * @property {boolean} canEdit - Author or collaborator; Viewers get a read-only shell.
 * @property {Array} files - Code files, entry and parameters.
 * @property {(fileId: string, content: string) => void} updateFile
 * @property {Record<string, object>} declared - Parameters as declared by the running sketch.
 * @property {boolean} hasDeclaration - False until the sketch has announced itself.
 * @property {object} bindings - Per-parameter binding + authoring overrides.
 * @property {(key: string, patch: object) => void} updateBinding
 * @property {Record<string, any>} values - Resolved values currently driving the sketch.
 * @property {(panel: object) => void} openPanel - Pushes a panel to the right of the work area.
 * @property {(id: string) => void} closePanel
 */
export const VisualBuilderContext = createContext(null);

export function useVisualBuilder() {
  const value = useContext(VisualBuilderContext);
  if (!value) {
    throw new Error("useVisualBuilder must be used inside the visual builder");
  }
  return value;
}
