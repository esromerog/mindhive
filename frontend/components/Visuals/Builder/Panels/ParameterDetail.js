"use client";

import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Card, { CardSection } from "../../../DesignSystem/Card";
import Checkbox from "../../../DesignSystem/Checkbox";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import {
  CloseIcon,
  CodeIcon,
  DeleteIcon,
  SettingsIcon,
  WaveformIcon,
} from "../../../DesignSystem/Icons";

import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import { bindingFor, labelFor, typeLabel } from "../../Helpers/bindings";
import { removeParameter } from "../../Runtime/parametersFile";

const ROOT_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  overflow: "hidden",
};

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
  padding: "16px 16px 16px",
  borderBottom: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const HEADER_TITLE_STYLE = {
  margin: 0,
  flex: "1 1 auto",
  minWidth: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 22,
  lineHeight: "28px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const SUBNAV_STYLE = {
  flexShrink: 0,
  padding: "8px 8px",
  borderBottom: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const BODY_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  overflowY: "auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexShrink: 0,
  padding: 16,
  borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const SECTION_TITLE_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const TOGGLE_ROW_STYLE = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const TOGGLE_TEXT_STYLE = {
  flex: "1 1 auto",
  minWidth: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const FROM_CODE_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: "20px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const EMPTY_STYLE = {
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

/**
 * The per-parameter side panel — another entry in the work area rather than a
 * modal, so the list it was opened from stays visible beside it.
 *
 * Name, Data Type and Default Value are shown but not editable: the sketch
 * declares them, and the honest affordance is a jump to where they live.
 * Everything below that line — normalize, range, whether mapping is allowed at
 * all — is data plumbing the dashboard owns.
 */
export default function ParameterDetailPanel({ paramKey, initialTab }) {
  const { t } = useTranslation("visuals");
  const {
    canEdit,
    declared,
    bindings,
    updateBinding,
    files,
    updateFile,
    closePanel,
    revealFile,
  } = useVisualBuilder();

  const declaration = declared?.[paramKey];
  const binding = bindingFor(bindings, paramKey);
  const parametersFile = files.find((file) => file.role === "parameters");

  const [tab, setTab] = useState(initialTab || "settings");
  const [draft, setDraft] = useState({
    normalize: binding.normalize,
    allowMapping: binding.allowMapping,
    min: binding.rangeOverride?.min ?? "",
    max: binding.rangeOverride?.max ?? "",
  });

  // Re-seed when the panel is pointed at a different parameter without
  // unmounting, so the draft never belongs to the previous one.
  useEffect(() => {
    setDraft({
      normalize: binding.normalize,
      allowMapping: binding.allowMapping,
      min: binding.rangeOverride?.min ?? "",
      max: binding.rangeOverride?.max ?? "",
    });
    setTab(initialTab || "settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  // The parameter can vanish underneath this panel — deleted from the file, or
  // renamed in code, which is the same thing as far as the declared key goes.
  useEffect(() => {
    if (!declaration) closePanel();
  }, [declaration, closePanel]);

  if (!declaration) return null;

  function onSave() {
    const min = draft.min === "" ? null : Number(draft.min);
    const max = draft.max === "" ? null : Number(draft.max);
    updateBinding(paramKey, {
      normalize: draft.normalize,
      allowMapping: draft.allowMapping,
      rangeOverride: min === null && max === null ? null : { min, max },
    });
  }

  function onDelete() {
    if (!parametersFile) return;
    updateFile(
      parametersFile.id,
      removeParameter(parametersFile.content || "", paramKey)
    );
    closePanel();
  }

  return (
    <section className="Visuals-ParameterDetail" style={ROOT_STYLE}>
      <header style={HEADER_STYLE}>
        <h2 style={HEADER_TITLE_STYLE}>{labelFor(paramKey, declaration)}</h2>
        <IconButton
          variant="text"
          elevated={false}
          icon={<CloseIcon />}
          ariaLabel={t("close", "Close")}
          onClick={closePanel}
        />
      </header>

      <Navbar style={SUBNAV_STYLE}>
        <NavbarItem
          leadingIcon={<SettingsIcon />}
          selected={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          {t("settings", "Settings")}
        </NavbarItem>
        <NavbarItem
          leadingIcon={<WaveformIcon />}
          selected={tab === "mapping"}
          onClick={() => setTab("mapping")}
        >
          {t("mapping", "Mapping")}
        </NavbarItem>
      </Navbar>

      {tab === "settings" ? (
        <>
          <div style={BODY_STYLE}>
            <h3 style={SECTION_TITLE_STYLE}>{t("properties", "Properties")}</h3>

            <Input
              label={t("name", "Name")}
              value={labelFor(paramKey, declaration)}
              disabled
              onChange={() => {}}
            />
            <Input
              label={t("dataType", "Data Type")}
              value={typeLabel(declaration.type)}
              disabled
              onChange={() => {}}
            />
            <Input
              label={t("defaultValue", "Default Value")}
              value={
                declaration.default === undefined
                  ? ""
                  : String(declaration.default)
              }
              disabled
              onChange={() => {}}
            />

            <div style={FROM_CODE_STYLE}>
              <span>
                {t("definedInCode", "Defined in parameters.js")}
              </span>
              {parametersFile ? (
                <Button
                  variant="text"
                  leadingIcon={<CodeIcon />}
                  onClick={() => revealFile(parametersFile.id)}
                >
                  {t("editInCode", "Edit in code")}
                </Button>
              ) : null}
            </div>

            <div style={TOGGLE_ROW_STYLE}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ ...SECTION_TITLE_STYLE, marginBottom: 2 }}>
                  {t("normalize", "Normalize")}
                </p>
                <p style={{ ...TOGGLE_TEXT_STYLE, margin: 0 }}>
                  {t(
                    "normalizeHelp",
                    "This will remap the values coming in from their default range to 0 to 1."
                  )}
                </p>
              </div>
              <Checkbox
                checked={draft.normalize}
                disabled={!canEdit}
                ariaLabel={t("normalize", "Normalize")}
                onChange={(next) =>
                  setDraft((current) => ({ ...current, normalize: next }))
                }
              />
            </div>

            <div>
              <p style={{ ...SECTION_TITLE_STYLE, marginBottom: 4 }}>
                {t("range", "Range")}
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <Input
                  type="number"
                  placeholder={t("min", "Min")}
                  value={draft.min}
                  disabled={!canEdit}
                  onChange={(next) =>
                    setDraft((current) => ({ ...current, min: next }))
                  }
                />
                <Input
                  type="number"
                  placeholder={t("max", "Max")}
                  value={draft.max}
                  disabled={!canEdit}
                  onChange={(next) =>
                    setDraft((current) => ({ ...current, max: next }))
                  }
                />
              </div>
            </div>

            <h3 style={SECTION_TITLE_STYLE}>{t("mapping", "Mapping")}</h3>
            <div style={TOGGLE_ROW_STYLE}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ ...SECTION_TITLE_STYLE, marginBottom: 2 }}>
                  {t("allowMapping", "Allow Mapping")}
                </p>
                <p style={{ ...TOGGLE_TEXT_STYLE, margin: 0 }}>
                  {t(
                    "allowMappingHelp",
                    "Lets the parameter be mapped to a device. Otherwise, it will be limited to manual controls."
                  )}
                </p>
              </div>
              <Checkbox
                checked={draft.allowMapping}
                disabled={!canEdit}
                ariaLabel={t("allowMapping", "Allow Mapping")}
                onChange={(next) =>
                  setDraft((current) => ({ ...current, allowMapping: next }))
                }
              />
            </div>
          </div>

          <footer style={FOOTER_STYLE}>
            <Button
              variant="text"
              leadingIcon={<DeleteIcon />}
              disabled={!canEdit || !parametersFile}
              onClick={onDelete}
              style={{ color: "var(--MH-Theme-Warning-Base, #b9261a)" }}
            >
              {t("deleteParameter", "Delete Parameter")}
            </Button>
            <Button variant="filled" disabled={!canEdit} onClick={onSave}>
              {t("save", "Save")}
            </Button>
          </footer>
        </>
      ) : (
        <div style={BODY_STYLE}>
          <h3 style={SECTION_TITLE_STYLE}>
            {t("availableStreams", "Available Streams")}
          </h3>
          <Card variant="subtle">
            <CardSection>
              <p style={EMPTY_STYLE}>
                {t(
                  "noStreamsYet",
                  "No data sources are connected to this visual yet. Once data sources land you'll pick an output here; until then, set a value by hand from the parameter's controls."
                )}
              </p>
            </CardSection>
          </Card>
        </div>
      )}
    </section>
  );
}
