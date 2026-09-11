/**
 * Full-screen confetti animation that fires once (no recycling) on mount.
 * Tracks window dimensions for responsive rendering. Used to celebrate completions.
 */
"use client";

import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

type ConfettiProps = {
  colors?: string[];
};

export const Confetti: React.FC<ConfettiProps> = ({
  colors = ["#00C4B8", "#eee"],
}: {
  colors?: string[];
}) => {
  const [windowSize, setWindowSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    const updateWindowSize = () => setWindowSize({ height: window.innerHeight, width: window.innerWidth });

    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);

    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      colors={colors}
      numberOfPieces={400}
      recycle={false}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
};
