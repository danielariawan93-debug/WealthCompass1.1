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
    transform: "translate(-30%, -30%)",
    pointerEvents: "none",
    zIndex: 0,
    opacity: 0.045,
    width: "min(100vw, 100vh)",
    height: "min(100vw, 100vh)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}>
    <img
      src={`${process.env.PUBLIC_URL}/${app === "aj" ? "logo-aj" : "logo-wp"}.png`}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
    />
  </div>
);
