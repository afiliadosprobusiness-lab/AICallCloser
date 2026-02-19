import { ImageResponse } from "next/og";

import { BrandMarkSvg } from "./brand-image";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0B0F19",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(61,123,255,0.25), transparent 45%), radial-gradient(circle at 85% 15%, rgba(141,75,255,0.22), transparent 42%)",
          color: "#F5F7FF",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "760px" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "999px",
              padding: "8px 16px",
              fontSize: 20,
              color: "rgba(245,247,255,0.84)",
            }}
          >
            AI Sales Infra
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 700 }}>AI Call Closer</div>
          <div style={{ fontSize: 34, lineHeight: 1.2, color: "rgba(245,247,255,0.86)" }}>
            SaaS premium multi-tenant para cerrar ventas con llamadas IA.
          </div>
          <div style={{ fontSize: 24, color: "rgba(245,247,255,0.66)" }}>ai-call-closer.vercel.app</div>
        </div>

        <div
          style={{
            width: 232,
            height: 232,
            borderRadius: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 20px 60px rgba(8,12,28,0.45)",
          }}
        >
          <BrandMarkSvg size={184} />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
