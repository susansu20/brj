import type { ReactNode } from "react";
import { BRAND, type Slide } from "../brand";
import { LOGO_ASPECT } from "../logo";

function extractStat(headline: string): { number: string; rest: string } | null {
  const match = headline.match(/^\s*([\$£€]?\d[\d,.]*\s*(?:%|x|×|k|m|b|bn|mm)?)\s*[—\-:]?\s*(.*)$/i);
  if (!match) return null;
  const [, num, rest] = match;
  if (!num) return null;
  return { number: num.trim(), rest: rest.trim() };
}

export function Quote({
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
  const padding = Math.round(width * 0.08);
  const isStat = slide.treatment === "stat";
  const stat = isStat ? extractStat(slide.headline) : null;
  const logoHeight = Math.round(width * 0.055);
  const logoWidth = Math.round(logoHeight * LOGO_ASPECT);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: BRAND.white,
        padding,
        fontFamily: "Inter",
        color: BRAND.navy,
      }}
    >
      <div style={{ display: "flex" }}>
        <img
          src={logoDataUrl}
          width={logoWidth}
          height={logoHeight}
          alt="Building Review Journal"
        />
      </div>

      {stat ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontWeight: 800,
              fontSize: Math.round(width * 0.22),
              lineHeight: 1,
              color: BRAND.orange,
              letterSpacing: -3,
            }}
          >
            {stat.number}
          </div>
          {stat.rest ? (
            <div
              style={{
                display: "flex",
                marginTop: Math.round(width * 0.025),
                fontSize: Math.round(width * 0.05),
                fontWeight: 700,
                lineHeight: 1.15,
                maxWidth: "90%",
              }}
            >
              {stat.rest}
            </div>
          ) : null}
          {slide.body ? (
            <div
              style={{
                display: "flex",
                marginTop: Math.round(width * 0.03),
                fontSize: Math.round(width * 0.03),
                fontWeight: 400,
                lineHeight: 1.35,
                color: "#3B4561",
                maxWidth: "85%",
              }}
            >
              {slide.body}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontWeight: 800,
              fontSize: Math.round(width * 0.18),
              lineHeight: 0.6,
              color: BRAND.orange,
              height: Math.round(width * 0.08),
            }}
          >
            “
          </div>
          <div
            style={{
              display: "flex",
              marginTop: Math.round(width * 0.02),
              fontWeight: 700,
              fontSize: Math.round(width * 0.055),
              lineHeight: 1.15,
              letterSpacing: -0.5,
              maxWidth: "92%",
            }}
          >
            {slide.headline}
          </div>
          {slide.body ? (
            <div
              style={{
                display: "flex",
                marginTop: Math.round(width * 0.035),
                fontSize: Math.round(width * 0.03),
                fontWeight: 400,
                lineHeight: 1.35,
                color: "#3B4561",
                maxWidth: "85%",
              }}
            >
              {slide.body}
            </div>
          ) : null}
        </div>
      )}

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
