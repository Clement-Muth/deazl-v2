import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Deazl — La liste de courses qui se fait toute seule";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#1C1917",
          padding: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -100,
            bottom: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, #E8571C18 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "1px solid #E8571C15",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 200,
            top: 120,
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: "1px solid #E8571C10",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg,#E8571C,#C94811)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 28, height: 28, color: "white", display: "flex", fontSize: 24 }}>✓</div>
          </div>
          <span style={{ fontSize: 32, fontWeight: 900, color: "#FAF9F6", letterSpacing: "-0.02em" }}>deazl</span>
        </div>

        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#FAF9F6",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            margin: 0,
            maxWidth: 680,
          }}
        >
          La liste de courses{" "}
          <span style={{ color: "#E8571C" }}>qui se fait toute seule.</span>
        </h1>

        <p style={{ fontSize: 24, color: "#78716C", marginTop: 24, maxWidth: 560, margin: "24px 0 0" }}>
          Planning · Recettes · Courses · Prix · Stock
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          {["Gratuit","Sans carte bancaire","Données en Europe"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "#292524",
                border: "1px solid #44403C",
                fontSize: 16,
                color: "#A8A29E",
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 80,
            fontSize: 18,
            color: "#44403C",
          }}
        >
          deazl.fr
        </div>
      </div>
    ),
    { ...size }
  );
}
