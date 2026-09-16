// patient-management-app/frontend/src/components/AnimatedLogo.jsx
import { useState } from "react";

const VIDEO_SRC = "/clinic-logo-animated.mp4";
const POSTER_SRC = "/clinic-logo-poster.jpg";
const LEGACY_SRC = "/clinic-logo.png";

// Rantai fallback: video animasi -> poster frame akhir -> PNG lama,
// agar logo tetap tampil saat file hilang atau user menolak motion.
const AnimatedLogo = ({ className = "h-10", alt = "Logo Klinik AZ" }) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  if (videoFailed || reduceMotion) {
    return (
      <img
        src={posterFailed ? LEGACY_SRC : POSTER_SRC}
        alt={alt}
        className={className}
        onError={(e) => {
          if (posterFailed) {
            e.target.onerror = null;
            e.target.style.display = "none";
          } else {
            setPosterFailed(true);
          }
        }}
      />
    );
  }

  return (
    <video
      className={className}
      src={VIDEO_SRC}
      poster={POSTER_SRC}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={alt}
      onError={() => setVideoFailed(true)}
    />
  );
};

export default AnimatedLogo;
