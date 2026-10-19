"use client";

import { useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Checkbox from "../../../DesignSystem/Checkbox";
import IconButton from "../../../DesignSystem/IconButton";
import { CloseIcon } from "../../../DesignSystem/Icons";

import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import {
  bindingFor,
  isStreamMappable,
  labelFor,
  typeLabel,
} from "../../Helpers/bindings";
import {
  CARD_ACTIVE_STYLE,
  CARD_STYLE,
  NAME_BLOCK_STYLE,
  NAME_STYLE,
  ROW_STYLE,
  TYPE_STYLE,
} from "./Parameters";
import { outputKey } from "../../../../lib/yqOutputs";

const SECTION_TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HELP_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The whole row toggles, not just the box, so the row is the click target.
const CLICKABLE_ROW_STYLE = { cursor: "pointer" };

/**
 * The other half of a parameter's Mapping tab: one output of a linked source,
 * and the parameters that read it.
 *
 * A parameter takes one stream but a stream can feed many parameters, so where
 * the parameter's panel is a choice of one, this is a checklist. Both write the
 * same `mapping` on the parameter's binding. Ticking a parameter that already
 * follows a different stream moves it here, the way picking a stream does from
 * the other side — its row says which stream it is leaving.
 */
export default function StreamMappingPanel({ stream }) {
  const { t } = useTranslation("visuals");
  const { canEdit, dataSources, declared, bindings, updateBinding, closePanel } =
    useVisualBuilder();

  const source = dataSources.find((row) => row.id === stream.sourceId);
  const output = source?.block?.outputs?.find(
    (entry) => outputKey(entry) === stream.output
  );
  const channel = output?.channels?.find((entry) => entry.index === stream.channel);

  // Unlinked, or filtered out in the source's settings, while this was open.
  useEffect(() => {
    if (!channel) closePanel();
  }, [channel, closePanel]);

  if (!source || !channel) return null;

  const isThis = (mapping) =>
    mapping?.kind === "stream" &&
    mapping.sourceId === stream.sourceId &&
    mapping.output === stream.output &&
    mapping.channel === stream.channel;

  // The label of whatever stream a mapping points at, for a row that is
  // currently following a different one.
  const streamLabel = (mapping) =>
    dataSources
      .find((row) => row.id === mapping.sourceId)
      ?.block?.outputs?.find((entry) => outputKey(entry) === mapping.output)
      ?.channels?.find((entry) => entry.index === mapping.channel)?.label;

  const keys = Object.keys(declared || {}).filter((key) =>
    isStreamMappable(declared[key], bindingFor(bindings, key))
  );

  function toggle(key, mapped) {
    updateBinding(key, {
      mapping: mapped
        ? null
        : {
            kind: "stream",
            sourceId: stream.sourceId,
            output: stream.output,
            channel: stream.channel,
          },
    });
  }

  return (
    <Panel
      title={channel.label}
      actions={
        <IconButton
          variant="text"
          elevated={false}
          icon={<CloseIcon />}
          ariaLabel={t("close", "Close")}
          onClick={closePanel}
        />
      }
    >
      <p style={HELP_STYLE}>
        {t("fromSource", "From {{source}}").replace(
          "{{source}}",
          source.label || source.block?.title
        )}
      </p>

      <h3 style={SECTION_TITLE_STYLE}>
        {t("availableParameters", "Available Parameters")}
      </h3>

      {keys.length === 0 ? (
        <p style={HELP_STYLE}>
          {t(
            "noMappableParameters",
            "No parameters can receive this output yet. Only number parameters with Allow Mapping on can be mapped to a device — add one from the Parameters tab."
          )}
        </p>
      ) : (
        keys.map((key) => {
          const declaration = declared[key];
          const mapping = bindingFor(bindings, key).mapping;
          const mapped = isThis(mapping);
          const elsewhere =
            mapping?.kind === "stream" && !mapped ? streamLabel(mapping) : null;

          return (
            <div
              key={key}
              className="Visuals-StreamMappingRow"
              style={{
                ...CARD_STYLE,
                ...(mapped ? CARD_ACTIVE_STYLE : null),
                ...(canEdit ? CLICKABLE_ROW_STYLE : null),
              }}
              onClick={canEdit ? () => toggle(key, mapped) : undefined}
            >
              <div style={ROW_STYLE}>
                <div style={NAME_BLOCK_STYLE}>
                  <p style={NAME_STYLE}>{labelFor(key, declaration)}</p>
                  <p style={TYPE_STYLE}>
                    {elsewhere
                      ? t("mappedTo", "Mapped to {{stream}}").replace(
                          "{{stream}}",
                          elsewhere
                        )
                      : typeLabel(declaration)}
                  </p>
                </div>
                <Checkbox
                  tone="accent"
                  checked={mapped}
                  disabled={!canEdit}
                  ariaLabel={labelFor(key, declaration)}
                />
              </div>
            </div>
          );
        })
      )}
    </Panel>
  );
}
