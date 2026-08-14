"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../DesignSystem/Navbar";
import Button from "../../DesignSystem/Button";
import SplitPane from "../../DesignSystem/SplitPane";
import {
  CodeIcon,
  DescriptionIcon,
  SettingsIcon,
  SidePanelIcon,
  TuneIcon,
  WaveformIcon,
} from "../../DesignSystem/Icons";

import { VISUAL } from "../../Queries/YQVisual";
import {
  CREATE_VISUAL_CODE_FILE,
  UPDATE_VISUAL,
  UPDATE_VISUAL_CODE_FILE,
} from "../../Mutations/YQVisual";

import { VisualBuilderContext } from "../Context/VisualBuilderContext";
import { readBindings, resolveValues, writeBindings } from "../Helpers/bindings";
import {
  ENTRY_TEMPLATE,
  PARAMETERS_TEMPLATE,
} from "../Runtime/buildSketchDocument";

import TopBar from "./TopBar";
import Preview from "./Preview";
import DocumentationPanel from "./Panels/Documentation";
import DataSourcesPanel from "./Panels/DataSources";
import ParametersPanel from "./Panels/Parameters";
import ParameterDetailPanel from "./Panels/ParameterDetail";
import CodePanel from "./Panels/Code";
import SettingsPanel from "./Panels/Settings";

const TABS = [
  { id: "documentation", label: "Documentation", icon: <DescriptionIcon /> },
  { id: "dataSource", label: "Data Source", icon: <WaveformIcon /> },
  { id: "parameters", label: "Parameters", icon: <TuneIcon /> },
  { id: "code", label: "Code", icon: <CodeIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

const SHELL_STYLE = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const NAVBAR_STYLE = { flexShrink: 0, padding: "4px 8px" };

const BODY_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  padding: 16,
  boxSizing: "border-box",
};

const WORK_AREA_STYLE = {
  display: "flex",
  gap: 12,
  minWidth: 0,
  minHeight: 0,
  height: "100%",
};

// How long typing has to settle before the sketch is rebuilt. Rebuilding per
// keystroke would restart the sketch mid-word; waiting much longer than this
// stops feeling like a live preview.
const RUN_DEBOUNCE_MS = 700;
const SAVE_DEBOUNCE_MS = 1200;

export default function VisualBuilder({ query, user }) {
  const { t } = useTranslation("visuals");
  const visualId = query?.selector;

  const { data, loading, error } = useQuery(VISUAL, {
    variables: { id: visualId },
    skip: !visualId,
    fetchPolicy: "cache-and-network",
  });

  const [updateVisual] = useMutation(UPDATE_VISUAL);
  const [createCodeFile] = useMutation(CREATE_VISUAL_CODE_FILE);
  const [updateCodeFile] = useMutation(UPDATE_VISUAL_CODE_FILE);

  const visual = data?.visual;
  const canEdit =
    !!user?.id &&
    (visual?.author?.id === user.id ||
      !!visual?.collaborators?.some((c) => c.id === user.id));

  const [tab, setTab] = useState("code");
  const [detailPanel, setDetailPanel] = useState(null);
  const [focusFileId, setFocusFileId] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(true);

  // Local drafts of the code files. The server copy is the source of truth on
  // load; from then on this is, until the debounced save catches up.
  const [files, setFiles] = useState([]);
  const [runFiles, setRunFiles] = useState([]);
  const [declared, setDeclared] = useState({});
  const [hasDeclaration, setHasDeclaration] = useState(false);
  const [bindings, setBindings] = useState({});

  const seededRef = useRef(false);
  const saveTimers = useRef({});

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!visual) return;
    setBindings(readBindings(visual.parameters).bindings);
  }, [visual?.id, visual?.parameters]);

  useEffect(() => {
    if (!visual) return;
    if (visual.codeFiles?.length) {
      const ordered = [...visual.codeFiles].sort((a, b) => a.order - b.order);
      setFiles(ordered);
      setRunFiles(ordered);
      return;
    }
    if (!canEdit || seededRef.current) return;
    seededRef.current = true;
    seedFiles();
  }, [visual?.id, visual?.codeFiles?.length, canEdit]);

  /**
   * A visual with no child files is either brand new or a YQ-era one whose
   * source still lives in the `code` file field. Adopt the legacy blob when
   * there is one so nothing has to be migrated ahead of time, and start from
   * the templates otherwise.
   */
  async function seedFiles() {
    let entryContent = ENTRY_TEMPLATE;
    if (visual.code?.url) {
      try {
        const response = await fetch(visual.code.url);
        if (response.ok) entryContent = await response.text();
      } catch (e) {
        // Unreachable storage shouldn't stop the editor opening.
      }
    }

    const created = await Promise.all([
      createCodeFile({
        variables: {
          data: {
            visual: { connect: { id: visual.id } },
            name: "parameters.js",
            language: "javascript",
            role: "parameters",
            order: 0,
            content: PARAMETERS_TEMPLATE,
          },
        },
      }),
      createCodeFile({
        variables: {
          data: {
            visual: { connect: { id: visual.id } },
            name: "sketch.js",
            language: "javascript",
            role: "entry",
            order: 1,
            content: entryContent,
          },
        },
      }),
    ]);

    const seeded = created
      .map((result) => result.data?.createVisualCodeFile)
      .filter(Boolean);
    setFiles(seeded);
    setRunFiles(seeded);
  }

  // ── Editing ────────────────────────────────────────────────────────────────

  const updateFile = useCallback(
    (fileId, content) => {
      setFiles((current) =>
        current.map((file) =>
          file.id === fileId ? { ...file, content } : file
        )
      );

      clearTimeout(saveTimers.current[fileId]);
      saveTimers.current[fileId] = setTimeout(() => {
        updateCodeFile({
          variables: {
            data: { content, lastTimeEdited: new Date().toISOString() },
            id: fileId,
          },
        }).catch(() => {});
      }, SAVE_DEBOUNCE_MS);
    },
    [updateCodeFile]
  );

  // Hand the settled files to the frame, separately from the ones being typed
  // into, so the editor stays responsive while the sketch restarts on a delay.
  useEffect(() => {
    const timer = setTimeout(() => setRunFiles(files), RUN_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [files]);

  useEffect(
    () => () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
    },
    []
  );

  const updateBinding = useCallback(
    (key, patch) => {
      // Computed outside the state updater on purpose: React may invoke an
      // updater twice, and a mutation fired from inside one would go with it.
      const next = {
        ...bindings,
        [key]: { ...(bindings[key] || {}), ...patch },
      };
      setBindings(next);
      updateVisual({
        variables: { id: visualId, data: { parameters: writeBindings(next) } },
      }).catch(() => {});
    },
    [bindings, updateVisual, visualId]
  );

  const onDeclare = useCallback((parameters) => {
    setDeclared(parameters);
    setHasDeclaration(true);
  }, []);

  const values = useMemo(
    () => resolveValues(declared, bindings),
    [declared, bindings]
  );

  const openPanel = useCallback((panel) => setDetailPanel(panel), []);
  const closePanel = useCallback(() => setDetailPanel(null), []);

  // Adding or deleting a parameter is a text edit on a file, so the panels that
  // do it need a way to show the author where the edit landed.
  const revealFile = useCallback((fileId) => {
    setTab("code");
    setFocusFileId(fileId);
  }, []);

  const contextValue = useMemo(
    () => ({
      visual,
      canEdit,
      files,
      updateFile,
      declared,
      hasDeclaration,
      bindings,
      updateBinding,
      values,
      openPanel,
      closePanel,
      revealFile,
      focusFileId,
    }),
    [
      visual,
      canEdit,
      files,
      updateFile,
      declared,
      hasDeclaration,
      bindings,
      updateBinding,
      values,
      openPanel,
      closePanel,
      revealFile,
      focusFileId,
    ]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!visualId) return null;
  if (loading && !visual) {
    return <div style={{ padding: 24 }}>{t("loading", "Loading…")}</div>;
  }
  if (error || !visual) {
    return (
      <div style={{ padding: 24 }}>
        {t("notFound", "This visual could not be opened.")}
      </div>
    );
  }

  const workPanel = {
    documentation: <DocumentationPanel />,
    dataSource: <DataSourcesPanel />,
    parameters: <ParametersPanel />,
    code: <CodePanel />,
    settings: <SettingsPanel user={user} />,
  }[tab];

  return (
    <VisualBuilderContext.Provider value={contextValue}>
      <div className="Visuals-Builder" style={SHELL_STYLE}>
        <TopBar title={visual.title} onShare={() => setTab("settings")} />

        <Navbar style={NAVBAR_STYLE}>
          {TABS.map((entry) => (
            <NavbarItem
              key={entry.id}
              leadingIcon={entry.icon}
              selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
            >
              {t(entry.id, entry.label)}
            </NavbarItem>
          ))}
        </Navbar>

        <div style={BODY_STYLE}>
          <SplitPane
            collapsed={!previewVisible}
            defaultFraction={0.5}
            minStart={360}
            minEnd={320}
            start={
              <div style={WORK_AREA_STYLE}>
                <div style={{ flex: "1 1 0%", minWidth: 0 }}>{workPanel}</div>
                {detailPanel ? (
                  <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                    <ParameterDetailPanel
                      paramKey={detailPanel.paramKey}
                      initialTab={detailPanel.initialTab}
                    />
                  </div>
                ) : null}
              </div>
            }
            end={
              <Preview
                files={runFiles}
                values={values}
                onDeclare={onDeclare}
                onHide={() => setPreviewVisible(false)}
              />
            }
          />
          {previewVisible ? null : (
            <div style={{ position: "fixed", right: 24, bottom: 24 }}>
              <Button
                variant="filled"
                leadingIcon={<SidePanelIcon />}
                onClick={() => setPreviewVisible(true)}
              >
                {t("showPreview", "Show Preview")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </VisualBuilderContext.Provider>
  );
}
