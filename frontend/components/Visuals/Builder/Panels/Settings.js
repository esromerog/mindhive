"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Card, { CardSection } from "../../../DesignSystem/Card";
import Checkbox from "../../../DesignSystem/Checkbox";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import Input from "../../../DesignSystem/Input";
import Radio from "../../../DesignSystem/Radio";
import {
  ArrowDropDownIcon,
  DeleteIcon,
  MoreVertIcon,
} from "../../../DesignSystem/Icons";

import { SEARCH_PROFILES } from "../../../Queries/YQVisual";
import { DELETE_VISUAL, UPDATE_VISUAL } from "../../../Mutations/YQVisual";

import Panel from "../Panel";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";

const SECTION_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const RULE_STYLE = {
  height: 1,
  width: "100%",
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  border: 0,
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HELP_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const COLLABORATOR_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 4px 4px 12px",
};

const OPTION_ROW_STYLE = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: 16,
};

const RIGHT_ALIGN_STYLE = { display: "flex", justifyContent: "flex-end" };

const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  paddingTop: 8,
};

const PRIVACY_OPTIONS = [
  { value: "private", label: "Only me" },
  { value: "friends", label: "People I follow" },
  { value: "unlisted", label: "Anyone with the link" },
  { value: "public", label: "Everyone" },
];

/** A collapsible titled block. The three sections are separate on purpose — see below. */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <hr style={RULE_STYLE} />
      <button
        type="button"
        style={SECTION_HEADER_STYLE}
        onClick={() => setOpen((on) => !on)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span
          style={{
            display: "flex",
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform 0.2s",
          }}
          aria-hidden
        >
          <ArrowDropDownIcon />
        </span>
      </button>
      {open ? children : null}
    </>
  );
}

/**
 * The Settings tab.
 *
 * The three sections are kept apart deliberately, because they answer three
 * different questions about a visual:
 *
 *   Editing       — who may change the original. By invitation only; there is no
 *                   "who can edit" audience select, and there shouldn't be.
 *   Participation — how the visual behaves when someone experiences it. A
 *                   property of the block itself, not of a share link, which is
 *                   what lets the same setting hold when a visual later becomes
 *                   a step inside a study.
 *   Block Sharing — who can reach it at all.
 *
 * Folding participation into sharing would lose that distinction.
 */
export default function SettingsPanel({ user }) {
  const { t } = useTranslation("visuals");
  const router = useRouter();
  const { visual, canEdit } = useVisualBuilder();

  const [updateVisual, { loading: saving }] = useMutation(UPDATE_VISUAL);
  const [deleteVisual] = useMutation(DELETE_VISUAL);

  const [draft, setDraft] = useState(() => fromVisual(visual));
  const [search, setSearch] = useState("");

  useEffect(() => setDraft(fromVisual(visual)), [visual]);

  const { data: searchData } = useQuery(SEARCH_PROFILES, {
    variables: { search },
    skip: search.trim().length < 2,
  });

  const isOwner = visual?.author?.id === user?.id;
  const dirty = JSON.stringify(draft) !== JSON.stringify(fromVisual(visual));

  // Editors and Viewers are two relationships rather than one list with a role
  // column, so the UI merges them back into the single list the design shows.
  const people = [
    ...draft.collaborators.map((p) => ({ ...p, role: "editor" })),
    ...draft.viewers.map((p) => ({ ...p, role: "viewer" })),
  ];

  function setRole(profile, role) {
    setDraft((current) => ({
      ...current,
      collaborators:
        role === "editor"
          ? [...current.collaborators.filter((p) => p.id !== profile.id), profile]
          : current.collaborators.filter((p) => p.id !== profile.id),
      viewers:
        role === "viewer"
          ? [...current.viewers.filter((p) => p.id !== profile.id), profile]
          : current.viewers.filter((p) => p.id !== profile.id),
    }));
  }

  function removePerson(profile) {
    setDraft((current) => ({
      ...current,
      collaborators: current.collaborators.filter((p) => p.id !== profile.id),
      viewers: current.viewers.filter((p) => p.id !== profile.id),
    }));
  }

  async function onSave() {
    await updateVisual({
      variables: {
        id: visual.id,
        data: {
          title: draft.title,
          description: draft.description,
          privacy: draft.privacy,
          participationMode: draft.participationMode,
          docsVisible: draft.docsVisible,
          collaborators: { set: draft.collaborators.map((p) => ({ id: p.id })) },
          viewers: { set: draft.viewers.map((p) => ({ id: p.id })) },
        },
      },
    });
  }

  async function onDelete() {
    if (!window.confirm(t("confirmDelete", "Delete this visual permanently?")))
      return;
    await deleteVisual({ variables: { id: visual.id } });
    router.push("/dashboard/develop/visuals");
  }

  function copy(path) {
    navigator.clipboard?.writeText(`${window.location.origin}${path}`);
  }

  return (
    <Panel title={t("settings", "Settings")}>
      <Section title={t("properties", "Properties")}>
        <Input
          label={t("name", "Name")}
          value={draft.title}
          disabled={!canEdit}
          onChange={(next) => setDraft((c) => ({ ...c, title: next }))}
        />
        <Input
          label={t("description", "Description")}
          multiline
          value={draft.description}
          disabled={!canEdit}
          onChange={(next) => setDraft((c) => ({ ...c, description: next }))}
        />
        <div>
          <span style={FIELD_LABEL_STYLE}>{t("cover", "Cover")}</span>
          <p style={{ ...HELP_STYLE, marginTop: 4 }}>
            {t("coverComing", "Cover images are coming with the visuals bank.")}
          </p>
        </div>
      </Section>

      <Section title={t("editing", "Editing")}>
        <Input
          label={t("collaborators", "Collaborators")}
          placeholder={t("searchForUser", "Search for a user")}
          value={search}
          disabled={!isOwner}
          onChange={setSearch}
        />
        {searchData?.profiles
          ?.filter((p) => p.id !== visual.author?.id)
          .filter((p) => !people.some((existing) => existing.id === p.id))
          .map((profile) => (
            <Card key={profile.id} variant="subtle">
              <div style={COLLABORATOR_ROW_STYLE}>
                <span style={{ flex: "1 1 auto", ...FIELD_LABEL_STYLE }}>
                  {profile.username}
                </span>
                <Button variant="text" onClick={() => setRole(profile, "editor")}>
                  {t("addAsEditor", "Add as Editor")}
                </Button>
              </div>
            </Card>
          ))}

        {people.map((profile) => (
          <Card key={profile.id} variant="subtle">
            <div style={COLLABORATOR_ROW_STYLE}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ ...FIELD_LABEL_STYLE, margin: 0, fontWeight: 600 }}>
                  {profile.username}
                </p>
                <p style={{ ...HELP_STYLE }}>
                  {profile.role === "editor"
                    ? t("editor", "Editor")
                    : t("viewer", "Viewer")}
                </p>
              </div>
              <DropdownMenu
                trigger={<MoreVertIcon />}
                ariaLabel={t("changeRole", "Change role")}
                items={[
                  {
                    key: "editor",
                    label: t("makeEditor", "Make Editor"),
                    onClick: () => setRole(profile, "editor"),
                  },
                  {
                    key: "viewer",
                    label: t("makeViewer", "Make Viewer"),
                    onClick: () => setRole(profile, "viewer"),
                  },
                  {
                    key: "remove",
                    label: t("remove", "Remove"),
                    danger: true,
                    onClick: () => removePerson(profile),
                  },
                ]}
              />
            </div>
          </Card>
        ))}

        <div style={RIGHT_ALIGN_STYLE}>
          <Button
            variant="outline"
            onClick={() => copy(`/builder/visuals/${visual.id}`)}
          >
            {t("copyEditingLink", "Copy editing link")}
          </Button>
        </div>
      </Section>

      <Section title={t("participation", "Participation")}>
        <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Card variant={draft.participationMode === "sandbox" ? "subtle" : "default"}>
            <div style={OPTION_ROW_STYLE}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ ...FIELD_LABEL_STYLE, margin: 0, fontWeight: 600 }}>
                  {t("sandboxMode", "Sandbox mode")}
                </p>
                <p style={HELP_STYLE}>
                  {t(
                    "sandboxHelp",
                    "Allows viewers to add their own data sources and change how the parameters are mapped."
                  )}
                </p>
              </div>
              <Radio
                checked={draft.participationMode === "sandbox"}
                disabled={!canEdit}
                ariaLabel={t("sandboxMode", "Sandbox mode")}
                onChange={() =>
                  setDraft((c) => ({ ...c, participationMode: "sandbox" }))
                }
              />
            </div>
            {draft.participationMode === "sandbox" ? (
              <CardSection divided style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ flex: "1 1 auto", ...FIELD_LABEL_STYLE }}>
                    {t("showDocumentation", "Show documentation")}
                  </span>
                  <Checkbox
                    checked={draft.docsVisible}
                    disabled={!canEdit}
                    ariaLabel={t("showDocumentation", "Show documentation")}
                    onChange={(next) =>
                      setDraft((c) => ({ ...c, docsVisible: next }))
                    }
                  />
                </div>
              </CardSection>
            ) : null}
          </Card>

          <Card variant={draft.participationMode === "authored" ? "subtle" : "default"}>
            <div style={OPTION_ROW_STYLE}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ ...FIELD_LABEL_STYLE, margin: 0, fontWeight: 600 }}>
                  {t("authoredMode", "Authored mode")}
                </p>
                <p style={HELP_STYLE}>
                  {t(
                    "authoredHelp",
                    "Show the visual in full screen when opened and require connection to the data sources listed by you."
                  )}
                </p>
              </div>
              <Radio
                checked={draft.participationMode === "authored"}
                disabled={!canEdit}
                ariaLabel={t("authoredMode", "Authored mode")}
                onChange={() =>
                  setDraft((c) => ({ ...c, participationMode: "authored" }))
                }
              />
            </div>
          </Card>
        </div>
      </Section>

      <Section title={t("blockSharing", "Block Sharing")}>
        <div>
          <span style={FIELD_LABEL_STYLE}>{t("whoCanView", "Who can view")}</span>
          <div style={{ marginTop: 4 }}>
            <DropdownSelect
              value={draft.privacy}
              disabled={!isOwner}
              ariaLabel={t("whoCanView", "Who can view")}
              options={PRIVACY_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.value, option.label),
              }))}
              onChange={(next) => setDraft((c) => ({ ...c, privacy: next }))}
            />
          </div>
        </div>
        <div style={RIGHT_ALIGN_STYLE}>
          <Button
            variant="outline"
            onClick={() => copy(`/preview/visual/${visual.id}`)}
          >
            {t("copyPublishedLink", "Copy published link")}
          </Button>
        </div>
      </Section>

      <hr style={RULE_STYLE} />
      <div style={FOOTER_STYLE}>
        <Button
          variant="text"
          leadingIcon={<DeleteIcon />}
          disabled={!isOwner}
          onClick={onDelete}
          style={{ color: "var(--MH-Theme-Warning-Base, #b9261a)" }}
        >
          {t("deleteVisual", "Delete Visual")}
        </Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => setDraft(fromVisual(visual))}
          >
            {t("discardChanges", "Discard Changes")}
          </Button>
          <Button
            variant="filled"
            disabled={!canEdit || !dirty || saving}
            onClick={onSave}
          >
            {t("save", "Save")}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function fromVisual(visual) {
  return {
    title: visual?.title || "",
    description: visual?.description || "",
    privacy: visual?.privacy || "private",
    participationMode: visual?.participationMode || "sandbox",
    docsVisible: !!visual?.docsVisible,
    collaborators: (visual?.collaborators || []).map((p) => ({
      id: p.id,
      username: p.username,
    })),
    viewers: (visual?.viewers || []).map((p) => ({
      id: p.id,
      username: p.username,
    })),
  };
}
