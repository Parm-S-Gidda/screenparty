import { ImageResponse } from "next/og";

// Social share card: the wordmark on the ink stage with the paper tagline.
export const alt = "ScreenParty, party games on the big screen, phones are the controllers";
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
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#221f30",
          backgroundImage: "radial-gradient(circle at 50% 0%, #322c48 0%, #221f30 60%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 110, fontWeight: 900, letterSpacing: 2 }}>
          <span style={{ color: "#f0b429" }}>SCREEN</span>
          <span style={{ color: "#ee7c8e" }}>PARTY</span>
        </div>
        <div
          style={{
            display: "flex",
            background: "#f5ecd4",
            color: "#221f30",
            padding: "18px 44px",
            borderRadius: 14,
            fontSize: 38,
            fontWeight: 700,
            transform: "rotate(-1deg)",
            boxShadow: "8px 8px 0 rgba(0,0,0,0.45)",
          }}
        >
          Party games on the big screen, phones are the controllers
        </div>
        <div style={{ display: "flex", color: "#2fa8a0", fontSize: 28, fontWeight: 700 }}>
          Free to play · no app needed
        </div>
      </div>
    ),
    size
  );
}
