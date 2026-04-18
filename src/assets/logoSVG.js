// src/assets/logoSVG.js
import React from "react";

export const WPLogo = ({ size = 24 }) => (
  <img
    src={`${process.env.PUBLIC_URL}/logo-wp.png`}
    alt="Wealth Pulse"
    width={size}
    height={size}
    style={{ objectFit: "contain", display: "block" }}
  />
);

export const AJLogo = ({ size = 24 }) => (
  <img
    src={`${process.env.PUBLIC_URL}/logo-aj.png`}
    alt="Artha Journey"
    width={size}
    height={size}
    style={{ objectFit: "contain", display: "block" }}
  />
);

export const Watermark = ({ app = "wp" }) => (
  <div style={{
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 0,
    opacity: 0.04,
  }}>
    <img
      src={`${process.env.PUBLIC_URL}/${app === "aj" ? "logo-aj" : "logo-wp"}.png`}
      alt=""
      style={{ width: "min(280px, 50vw)", height: "min(280px, 50vw)", objectFit: "contain", display: "block" }}
    />
  </div>
);
export const CombineLogo = ({ size = 28 }) => (
  <img
    src={`${process.env.PUBLIC_URL}/combinelogo.png`}
    alt="Combine Logo"
    width={size}
    height={size}
    style={{ objectFit: "contain", display: "block" }}
  />
);
