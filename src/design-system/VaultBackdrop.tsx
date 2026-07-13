import type { ReactNode, CSSProperties } from "react";
import { Center } from "@astryxdesign/core/Center";

// Ultra-Modern Native Background
// A clean, soft gradient background similar to native macOS/VisionOS wallpapers.
const pageStyle: CSSProperties = {
  colorScheme: "light",
  position: "relative",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  backgroundColor: "var(--color-background-base)",
  backgroundImage: "radial-gradient(circle at top center, rgba(0, 0, 0, 0.02) 0%, transparent 80%)",
  fontFamily: "var(--font-family-ui)",
};

// Smooth, fluid entrance transition
const animations = `
  .fade-enter {
    animation: fluid-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes fluid-fade {
    from { opacity: 0; transform: translateY(15px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

export default function VaultBackdrop({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{animations}</style>
      <Center axis="both" style={pageStyle}>
        {children}
      </Center>
    </>
  );
}
