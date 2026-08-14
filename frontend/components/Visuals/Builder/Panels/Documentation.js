"use client";

import useTranslation from "next-translate/useTranslation";

import TipTapEditor from "../../../TipTap/Main";
import Panel from "../Panel";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";

const EDITOR_WRAP_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  overflowY: "auto",
  padding: "0 16px 16px",
};

/**
 * The Documentation tab.
 *
 * Bound straight to the `visual:<id>` Yjs room on the `docs` fragment — the same
 * document YQ's own docs editor uses — so the two frontends stay in sync while
 * both are running, and the collab server persists it exactly as it already
 * does. There is no separate save path here on purpose.
 */
export default function DocumentationPanel() {
  const { t } = useTranslation("visuals");
  const { visual, canEdit } = useVisualBuilder();

  return (
    <Panel flush title={t("documentation", "Documentation")}>
      <div style={EDITOR_WRAP_STYLE}>
        <TipTapEditor
          isEditable={canEdit}
          toolbarVisible={canEdit}
          limitedToolbar
          collaboration={{
            documentName: `visual:${visual.id}`,
            field: "docs",
          }}
          emptyInvite={t(
            "docsInvite",
            "Explain what this visual shows and what a participant should do."
          )}
        />
      </div>
    </Panel>
  );
}
