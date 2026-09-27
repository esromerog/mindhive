"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";

import { VISUAL_DATA_SOURCES } from "../../Queries/DataSourceBlock";
import { SourceRuntime } from "../../Studies/Run/DataSources/Main";
import { outputKey } from "../../../lib/yqOutputs";
import { bindingFor, isStreamMappable, streamValue } from "../Helpers/bindings";

/**
 * A visual's linked data sources, live.
 *
 * Each source runs through the participant page's own `SourceRuntime`, the same
 * pipeline and receivers a study uses, so a device behaves identically in both.
 * Those controllers are returned as `runtimes` for the caller to render
 * somewhere that outlives tab switches: a source that disconnected whenever the
 * author opened the Code tab would be useless to tune against.
 *
 * Every `stream` binding is then subscribed to its output, and each packet's
 * latest sample for the mapped channel goes straight into the bus. Nothing on
 * this path touches React state; the bus coalesces to one frame patch per
 * animation frame, so a 256 Hz stream costs the same as a slider.
 *
 * @param {string} visualId
 * @param {import("./parameterBus").default} bus
 * @param {Record<string, object>} declared - The normalized declaration.
 * @param {Record<string, object>} bindings
 * @returns {{ sources: Array, apis: Record<string, object>, runtimes: React.ReactNode, loading: boolean, refetch: Function }}
 */
export default function useVisualDataSources(visualId, bus, declared, bindings) {
  const { data, loading, refetch } = useQuery(VISUAL_DATA_SOURCES, {
    variables: { visualId },
    skip: !visualId,
  });
  const sources = useMemo(() => data?.visualDataSources || [], [data]);

  const [reported, setReported] = useState({});
  const onStatus = useCallback((rowId, api) => {
    setReported((prev) => ({ ...prev, [rowId]: api }));
  }, []);

  // Only the sources still linked — an unlinked one's last report would
  // otherwise keep showing it as connected.
  const apis = useMemo(
    () =>
      Object.fromEntries(
        sources
          .filter((source) => reported[source.id])
          .map((source) => [source.id, reported[source.id]])
      ),
    [sources, reported]
  );

  useEffect(() => {
    const unsubscribes = [];
    for (const key of Object.keys(bindings || {})) {
      const binding = bindingFor(bindings, key);
      const mapping = binding.mapping;
      const declaration = declared?.[key];
      if (mapping?.kind !== "stream") continue;
      if (!isStreamMappable(declaration, binding)) continue;
      const api = apis[mapping.sourceId];
      if (!api?.addPacketListener) continue;

      unsubscribes.push(
        api.addPacketListener((output, packet, channelCount) => {
          if (outputKey(output) !== mapping.output) return;
          if (mapping.channel >= channelCount) return;
          const samples = Math.floor(packet.data.length / channelCount);
          if (!samples) return;
          // Samples are interleaved; the sketch only ever needs the newest.
          const raw = packet.data[(samples - 1) * channelCount + mapping.channel];
          if (!Number.isFinite(raw)) return;
          bus.set(key, streamValue(declaration, binding, raw));
        })
      );
    }
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [bus, declared, bindings, apis]);

  const runtimes = sources.map((row) => (
    <SourceRuntime key={row.id} row={row} onStatus={onStatus} />
  ));

  return { sources, apis, runtimes, loading: loading && !data, refetch };
}
