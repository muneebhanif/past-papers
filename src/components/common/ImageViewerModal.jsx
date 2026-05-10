import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

export function ImageViewerModal({ open, onClose, images, title }) {
  const visibleImages = useMemo(() => (images ?? []).filter(Boolean), [images]);
  const [menuIndex, setMenuIndex] = useState(-1);
  const [downloadingIndex, setDownloadingIndex] = useState(-1);

  const onDownload = async (imageUrl, index) => {
    try {
      setDownloadingIndex(index);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to download image.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const randomPart =
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`)
          .replace(/-/g, "")
          .slice(0, 18);
      link.href = objectUrl;
      link.download = `paper_page_${index + 1}_${randomPart}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setMenuIndex(-1);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloadingIndex(-1);
    }
  };

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
      setMenuIndex(-1);
      setDownloadingIndex(-1);
    };
  }, [open, onClose]);

  if (!open || !visibleImages.length) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div
        className="relative h-full w-full p-2 sm:p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between p-2 sm:p-4">
          <span />

          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/20"
            aria-label="Close image viewer"
          >
            ✕
          </button>
        </div>

        <div
          className={`mx-auto h-full max-w-7xl overflow-auto rounded-2xl border border-white/10 bg-black/35 p-2 pt-12 shadow-2xl sm:p-3 sm:pt-14 ${
            visibleImages.length > 1 ? "grid grid-cols-1 gap-2 md:grid-cols-2" : "grid grid-cols-1"
          }`}
        >
          {visibleImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl bg-black/60"
            >
              <div className="absolute right-2 top-2 z-10">
                <button
                  type="button"
                  onClick={() => setMenuIndex((value) => (value === index ? -1 : index))}
                  className="rounded-full bg-black/65 px-2.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/20"
                  aria-label="Image options"
                >
                  •••
                </button>

                {menuIndex === index ? (
                  <div className="absolute right-0 top-9 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => void onDownload(image, index)}
                      disabled={downloadingIndex === index}
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      {downloadingIndex === index ? "Downloading..." : "Download"}
                    </button>
                  </div>
                ) : null}
              </div>

              <img
                src={image}
                alt={`${title} page ${index + 1}`}
                className="h-auto max-h-[82vh] w-auto max-w-full object-contain"
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
