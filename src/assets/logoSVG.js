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

export const CombineLogo = ({ size = 28 }) => (
  <img
    src={`${process.env.PUBLIC_URL}/combinelogo.png`}
    alt="Combine Logo"
    width={size}
    height={size}
    style={{ objectFit: "contain", display: "block" }}
  />
);
