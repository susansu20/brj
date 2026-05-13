import type { ReactNode } from "react";
import { BRAND, type Slide } from "../brand";
import { LOGO_ASPECT } from "../logo";

export function Editorial({
  slide,
  width,
  height,
  index,
  total,
  logoDataUrl,
}: {
  slide: Slide;
  width: number;
  height: number;
  index: number;
  total: number;
  logoDataUrl: string;
}): ReactNode {
  const padding = Math.round(width * 0.075);
  const headlineSize = Math.round(width * 0.075);
  const bodySize = Math.round(width * 0.032);
  const logoHeight = Math.round(width * 0.06);
  const logoWidth = Math.round(logoHeight * LOGO_ASPECT);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: BRAND.navy,
        padding,
        fontFamily: "Inter",
        color: BRAND.white,
      }}
    >
      <div style={{ display: "flex" }}>
        <div
          style={{
            display: "flex",
            backgroundColor: BRAND.white,
            paddingLeft: Math.round(width * 0.018),
            paddingRight: Math.round(width * 0.018),
            paddingTop: Math.round(width * 0.012),
            paddingBottom: Math.round(width * 0.012),
            borderRadius: 8,
          }}
        >
          <img
            src={logoDataUrl}
            width={logoWidth}
            height={logoHeight}
            alt="Building Review Journal"
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            width: Math.round(width * 0.16),
            height: Math.round(width * 0.012),
            backgroundColor: BRAND.orange,
            marginBottom: Math.round(width * 0.04),
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontWeight: 800,
            fontSize: headlineSize,
            lineHeight: 1.05,
            letterSpacing: -1,
          }}
        >
          {slide.headline}
        </div>
        {slide.body ? (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(width * 0.035),
              fontSize: bodySize,
              fontWeight: 400,
              lineHeight: 1.35,
              color: "#D9DEE8",
              maxWidth: "85%",
            }}
          >
            {slide.body}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: Math.round(width * 0.022),
          color: "#7E89A1",
          fontWeight: 400,
        }}
      >
        <div style={{ display: "flex" }}>buildingreviewjournal.com</div>
        <div style={{ display: "flex" }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
