"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Button from "../../../DesignSystem/Button";
import Card from "../../../DesignSystem/Card";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import {
  AddIcon,
  InfoIcon,
  LinkOffIcon,
  SettingsIcon,
  TuneIcon,
  WaveformIcon,
} from "../../../DesignSystem/Icons";

import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import { bindingFor, labelFor, typeLabel } from "../../Helpers/bindings";
import { addParameter } from "../../Runtime/parametersFile";

const BANNER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 16,
  borderRadius: 12,
  background: "var(--MH-Theme-Primary-Lighter, #F4F8F7)",
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
};

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 16,
};

const NAME_BLOCK_STYLE = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: "1 1 auto",
};

const NAME_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const TYPE_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const CONTROLS_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: "0 16px 16px",
};

const MAPPED_NOTE_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: 12,
  borderRadius: 8,
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const EMPTY_STYLE = {
  padding: "24px 16px",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

/**
 * The Parameters tab.
 *
 * The list renders the sketch's declaration — name, data type and default are
 * the code's to own, so they appear here but aren't edited here. What *is*
 * edited here is everything the code can't know: where a parameter's value
 * comes from, and the plumbing around it.
 */
export default function ParametersPanel() {
  const { t } = useTranslation("visuals");
  const {
    visual,
    canEdit,
    declared,
    hasDeclaration,
    bindings,
    updateBinding,
    values,
    files,
    updateFile,
    openPanel,
    revealFile,
  } = useVisualBuilder();

  const [expanded, setExpanded] = useState(null);

  const keys = Object.keys(declared || {});
  const unmapped = keys.filter((key) => !bindingFor(bindings, key).mapping);
  const showAuthoredBanner =
    visual?.participationMode === "authored" && unmapped.length > 0;

  const parametersFile = files.find((file) => file.role === "parameters");

  function onAddNew() {
    if (!parametersFile) return;
    // Names live in code, so a new parameter gets a placeholder key here and is
    // renamed where it is declared — rather than this panel owning a name the
    // file would then have to be kept in sync with.
    let index = keys.length + 1;
    while (keys.includes(`parameter${index}`)) index += 1;
    const key = `parameter${index}`;

    updateFile(
      parametersFile.id,
      addParameter(parametersFile.content || "", key, {
        type: "number",
        label: `Parameter ${index}`,
        default: 0,
        min: 0,
        max: 1,
      })
    );
    revealFile(parametersFile.id);
  }

  return (
    <Panel
      title={t("parameters", "Parameters")}
      actions={
        canEdit ? (
          <Button
            variant="filled"
            leadingIcon={<AddIcon />}
            onClick={onAddNew}
            disabled={!parametersFile}
          >
            {t("addNew", "Add New")}
          </Button>
        ) : null
      }
    >
      {showAuthoredBanner ? (
        <div style={BANNER_STYLE} role="status">
          <span style={{ flexShrink: 0 }}>
            <InfoIcon />
          </span>
          <span>
            {t(
              "authoredNeedsMapping",
              "Authored mode requires all parameters to have a default mapping to work properly."
            )}
          </span>
        </div>
      ) : null}

      {!hasDeclaration ? (
        <p style={EMPTY_STYLE}>
          {t("waitingForSketch", "Waiting for the sketch to declare its parameters…")}
        </p>
      ) : keys.length === 0 ? (
        <p style={EMPTY_STYLE}>
          {t(
            "noParameters",
            "This sketch doesn't declare any parameters yet. Add one to expose a control."
          )}
        </p>
      ) : (
        keys.map((key) => {
          const declaration = declared[key];
          const binding = bindingFor(bindings, key);
          const isOpen = expanded === key;
          const isMapped = !!binding.mapping;

          return (
            <Card key={key} variant={isOpen ? "subtle" : "default"}>
              <div style={ROW_STYLE}>
                <div style={NAME_BLOCK_STYLE}>
                  <p style={NAME_STYLE}>{labelFor(key, declaration)}</p>
                  <p style={TYPE_STYLE}>{typeLabel(declaration?.type)}</p>
                </div>

                <Chip
                  label={
                    isMapped && binding.mapping.kind === "manual"
                      ? t("manualValue", "Manual value")
                      : isMapped
                        ? binding.mapping.streamID
                        : t("mapADataSource", "Map a data source")
                  }
                  selected={isMapped}
                  leading={isMapped ? <WaveformIcon /> : undefined}
                  onClick={() =>
                    openPanel({ paramKey: key, initialTab: "mapping" })
                  }
                />

                <IconButton
                  variant="text"
                  elevated={false}
                  icon={<SettingsIcon />}
                  ariaLabel={t("parameterSettings", "Parameter settings")}
                  onClick={() =>
                    openPanel({ paramKey: key, initialTab: "settings" })
                  }
                />
                <IconButton
                  variant={isOpen ? "filled" : "text"}
                  elevated={false}
                  icon={<TuneIcon />}
                  ariaLabel={t("toggleControls", "Show controls")}
                  onClick={() => setExpanded(isOpen ? null : key)}
                />
              </div>

              {isOpen ? (
                <div style={CONTROLS_STYLE}>
                  {isMapped && binding.mapping.kind !== "manual" ? (
                    <div style={MAPPED_NOTE_STYLE}>
                      <span>
                        {t(
                          "controlledByData",
                          "The parameter is controlled by your data"
                        )}
                      </span>
                      <Button
                        variant="outline"
                        leadingIcon={<LinkOffIcon />}
                        onClick={() => updateBinding(key, { mapping: null })}
                      >
                        {t("unmap", "Unmap")}
                      </Button>
                    </div>
                  ) : null}

                  <Input
                    label={t("value", "Value")}
                    type="number"
                    value={
                      values[key] === undefined || values[key] === null
                        ? ""
                        : String(values[key])
                    }
                    disabled={!canEdit}
                    onChange={(next) =>
                      updateBinding(key, {
                        mapping:
                          next === ""
                            ? null
                            : { kind: "manual", value: Number(next) },
                      })
                    }
                  />
                </div>
              ) : null}
            </Card>
          );
        })
      )}
    </Panel>
  );
}
