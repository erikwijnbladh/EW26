export type Stop = "about" | "work" | "music" | "elsewhere" | "contact";
export const stops: { id: Stop; label: string; caption: string }[] = [
  { id: "about", label: "The human", caption: "A little about me" },
  { id: "work", label: "The workstation", caption: "Things I’ve worked on" },
  {
    id: "music",
    label: "Heavy rotation",
    caption: "Loud music. Good company.",
  },
  {
    id: "elsewhere",
    label: "Off the clock",
    caption: "Life beyond the pixels",
  },
  { id: "contact", label: "Say hello", caption: "Good things start here" },
];
