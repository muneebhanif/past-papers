import { useEffect, useMemo } from "react";

export function ImageViewerModal({ open, onClose, images, title }) {
  const visibleImages = useMemo(() => (images ?? []).filter(Boolean), [images]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !visibleImages.length) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div
        className="relative w-full max-w-7xl overflow-auto rounded-2xl border border-white/15 bg-black/40 p-2 shadow-2xl md:p-3"
        style={{ maxHeight: "92vh" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/20"
          aria-label="Close image viewer"
        >
          ✕
        </button>

        <div className={`grid gap-2 ${visibleImages.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {visibleImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="overflow-hidden rounded-xl bg-black/60"
            >
              <img
                src={image}
                alt={`${title} page ${index + 1}`}
                className="h-auto max-h-[84vh] w-full object-contain"
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
