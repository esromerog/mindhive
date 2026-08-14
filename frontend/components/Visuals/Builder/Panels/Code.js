"use client";

import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import MonacoEditor from "../../../Builder/Project/DataJournal/Helpers/MonacoPythonEditor";
import Chip from "../../../DesignSystem/Chip";
import Panel from "../Panel";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";

const STRIP_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  flexShrink: 0,
  padding: "0 16px 12px",
};

const EDITOR_WRAP_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

/**
 * The Code tab: a file strip and the editor for whichever file is selected.
 *
 * `parameters.js` is pinned first but is *not* selected by default. The
 * declaration is the contract the Parameters tab renders from, so it has to be
 * reachable and editable — but the file an author opens the tab to work on is
 * the sketch.
 */
export default function CodePanel() {
  const { t } = useTranslation("visuals");
  const { files, updateFile, canEdit, focusFileId } = useVisualBuilder();

  const [selectedId, setSelectedId] = useState(null);

  const ordered = [
    ...files.filter((file) => file.role === "parameters"),
    ...files.filter((file) => file.role !== "parameters"),
  ];
  const entry = files.find((file) => file.role === "entry");
  const selected =
    ordered.find((file) => file.id === selectedId) || entry || ordered[0];

  useEffect(() => {
    if (!selectedId && selected) setSelectedId(selected.id);
  }, [selectedId, selected]);

  // Another panel asked for a specific file — adding a parameter, or the
  // "edit in code" jump from a parameter's settings.
  useEffect(() => {
    if (focusFileId) setSelectedId(focusFileId);
  }, [focusFileId]);

  if (!selected) {
    return (
      <Panel title={t("code", "Code")}>
        <p style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
          {t("preparingFiles", "Preparing this visual's files…")}
        </p>
      </Panel>
    );
  }

  return (
    <Panel flush title={t("code", "Code")}>
      <div style={STRIP_STYLE}>
        {ordered.map((file) => (
          <Chip
            key={file.id}
            shape="square"
            label={file.name}
            selected={file.id === selected.id}
            onClick={() => setSelectedId(file.id)}
          />
        ))}
      </div>
      <div style={EDITOR_WRAP_STYLE}>
        <MonacoEditor
          key={selected.id}
          language="javascript"
          height="100%"
          value={selected.content || ""}
          readOnly={!canEdit}
          onChange={(next) => canEdit && updateFile(selected.id, next ?? "")}
        />
      </div>
    </Panel>
  );
}
