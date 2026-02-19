import { ImageResponse } from "next/og";

import { BrandMarkSvg } from "./brand-image";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0F19",
        }}
      >
        <BrandMarkSvg size={448} />
      </div>
    ),
    {
      ...size,
    },
  );
}
