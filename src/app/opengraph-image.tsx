import { ImageResponse } from "next/og";
import { profile } from "@/lib/data";

/**
 * The card every shared link renders as.
 *
 * Without this the site was a grey box in LinkedIn, Slack and iMessage — which
 * is the first impression in most cases, and a bad one for someone selling
 * visual craft. Drawn in the site's own palette rather than as a screenshot, so
 * it reads as part of the same object.
 */
export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f3f1",
          color: "#15140f",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Stand-in for the dithered nav dot, which is a WebGL shader and
              can't render here. Same size, same place, same job. */}
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#15140f",
            }}
          />
          <div style={{ fontSize: 28, letterSpacing: -0.4 }}>
            erikwijnbladh.com
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 96, letterSpacing: -3.5, lineHeight: 1 }}>
            {profile.name}
          </div>
          {/* One string, not three nodes: Satori requires an explicit
              display on any element with more than one child, and JSX
              interpolation around a literal quietly produces three. */}
          <div style={{ fontSize: 34, color: "#6b6a64", letterSpacing: -0.6 }}>
            {`${profile.role} — ${profile.location}`}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#6b6a64" }}>
          Tech first, with design never far off.
        </div>
      </div>
    ),
    size,
  );
}
