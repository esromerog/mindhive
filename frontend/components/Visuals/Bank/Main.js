"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Input from "../../DesignSystem/Input";
import VisualCard from "./VisualCard";

import { MY_VISUALS } from "../../Queries/YQVisual";
import {
  COPY_VISUAL,
  DELETE_VISUAL,
  TOGGLE_VISUAL_LIKE,
} from "../../Mutations/YQVisual";

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 16,
};

const TITLE_STYLE = {
  margin: 0,
  flex: "1 1 auto",
  font: "var(--MH-Type-Title-Large)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

// Fixed tracks like the Connect browse grid (ConnectCard caps at 368px), a
// touch wider since a visual card carries a sketch cover.
const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 384px), 384px))",
  gap: 16,
};

const EMPTY_STYLE = {
  padding: "48px 24px",
  textAlign: "center",
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

/**
 * The visuals bank at `/dashboard/develop/visuals`.
 *
 * Scoped to visuals the signed-in user has a hand in — authored, invited to
 * edit, or invited to view. The Visual list's own access filter already hides
 * everything else, but asking for the narrower set keeps the bank from filling
 * up with every public visual on the platform.
 */
export default function VisualsBank({ user }) {
  const { t } = useTranslation("visuals");
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, loading, refetch } = useQuery(MY_VISUALS, {
    variables: {
      where: {
        OR: [
          { author: { id: { equals: user?.id } } },
          { collaborators: { some: { id: { equals: user?.id } } } },
          { viewers: { some: { id: { equals: user?.id } } } },
        ],
      },
    },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });

  const [deleteVisual] = useMutation(DELETE_VISUAL);
  const [copyVisual] = useMutation(COPY_VISUAL);
  const [toggleLike] = useMutation(TOGGLE_VISUAL_LIKE);

  const visuals = (data?.visuals || []).filter((visual) =>
    search.trim()
      ? visual.title?.toLowerCase().includes(search.trim().toLowerCase())
      : true
  );

  async function onDelete(visual) {
    if (
      !window.confirm(
        t("confirmDeleteNamed", "Delete “{{title}}” permanently?").replace(
          "{{title}}",
          visual.title
        )
      )
    )
      return;
    await deleteVisual({ variables: { id: visual.id } });
    refetch();
  }

  async function onCopy(visual) {
    const result = await copyVisual({ variables: { id: visual.id } });
    const id = result.data?.copyVisual?.id;
    if (id) router.push(`/builder/visuals/${id}`);
  }

  function onToggleFavorite(visual, isFavorite) {
    toggleLike({
      variables: {
        id: visual.id,
        likes: { [isFavorite ? "disconnect" : "connect"]: [{ id: user.id }] },
      },
    });
  }

  return (
    <div className="Visuals-Bank">
      <div style={HEADER_STYLE}>
        <h1 style={TITLE_STYLE}>{t("myVisuals", "My Visuals")}</h1>
        <div style={{ width: 280 }}>
          <Input
            placeholder={t("searchVisuals", "Search visuals")}
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {loading && !data ? (
        <p style={EMPTY_STYLE}>{t("loading", "Loading…")}</p>
      ) : visuals.length === 0 ? (
        <p style={EMPTY_STYLE}>
          {t(
            "noVisuals",
            "No visuals yet. Create one to start writing a p5 sketch driven by live data."
          )}
        </p>
      ) : (
        <div style={GRID_STYLE}>
          {visuals.map((visual) => {
            const isOwner = visual.author?.id === user?.id;
            const canEdit =
              isOwner ||
              visual.collaborators?.some((c) => c.id === user?.id);
            const isFavorite = !!visual.likes?.some((p) => p.id === user?.id);
            return (
              <VisualCard
                key={visual.id}
                visual={visual}
                viewHref={`/preview/visual/${visual.id}`}
                editHref={canEdit ? `/builder/visuals/${visual.id}` : undefined}
                onCopy={canEdit ? undefined : () => onCopy(visual)}
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(visual, isFavorite)}
                menuItems={
                  isOwner
                    ? [
                        {
                          key: "delete",
                          label: t("delete", "Delete"),
                          danger: true,
                          onClick: () => onDelete(visual),
                        },
                      ]
                    : []
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
