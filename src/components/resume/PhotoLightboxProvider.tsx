"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type LightboxState = { src: string; caption: string } | null;

const LightboxContext = createContext<((photo: LightboxState) => void) | null>(null);

// Every NodePhoto across every résumé section shares one overlay instance
// (mounted once here, at the page root) rather than each photo owning its
// own modal — avoids dozens of near-identical overlay DOM trees sitting
// inert in the page, and means only one photo can ever be open at a time.
export function usePhotoLightbox() {
  const open = useContext(LightboxContext);
  if (!open) throw new Error("usePhotoLightbox must be used within PhotoLightboxProvider");
  return open;
}

export default function PhotoLightboxProvider({ children }: { children: React.ReactNode }) {
  const [photo, setPhoto] = useState<LightboxState>(null);
  const close = useCallback(() => setPhoto(null), []);

  useEffect(() => {
    if (!photo) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photo, close]);

  return (
    <LightboxContext.Provider value={setPhoto}>
      {children}
      <AnimatePresence>
        {photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
            onClick={close}
          >
            <motion.img
              key={photo.src}
              src={photo.src}
              alt={photo.caption}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={close}
              aria-label="Close photo"
              className="fixed top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
            >
              ×
            </button>
            <p className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 font-mono text-xs text-white/80 backdrop-blur">
              {photo.caption}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  );
}
