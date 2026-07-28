import { profile, contacts } from "@/lib/data";

export type Action = {
  id: string;
  label: string;
  /** Right-hand detail in the command menu. */
  hint: string;
  run: () => void;
  /** Shown briefly in place of the hint after running. */
  done?: string;
};

/** Look up a contact URL by its label in `contacts`. */
export const contactHref = (label: string) =>
  contacts.find((c) => c.label === label)?.href ?? "";

const open = (url: string) => () => {
  window.open(url, "_blank", "noopener,noreferrer");
};

/** Shared by the command menu and the dock, so both stay in step. */
export const actions: Action[] = [
  {
    id: "copy-email",
    label: "copy email",
    hint: profile.email,
    done: "copied",
    run: () => {
      void navigator.clipboard.writeText(profile.email);
    },
  },
  {
    id: "github",
    label: "github",
    hint: "erikwijnbladh",
    run: open(contactHref("github")),
  },
  {
    id: "linkedin",
    label: "linkedin",
    hint: "erik-wijnbladh",
    run: open(contactHref("linkedin")),
  },
];

export const actionById = (id: string) => {
  const action = actions.find((a) => a.id === id);
  if (!action) throw new Error(`Unknown action: ${id}`);
  return action;
};
