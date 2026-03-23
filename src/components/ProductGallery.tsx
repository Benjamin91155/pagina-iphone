"use client";

import { useMemo, useState } from "react";

type GalleryImage = {
  url: string;
  alt?: string | null;
};

export function ProductGallery({ images, fallbackAlt }: { images: GalleryImage[]; fallbackAlt: string }) {
  const validImages = useMemo(() => images.filter((img) => img.url), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = validImages[activeIndex] || validImages[0];

  if (!active) {
    return (
      <div className="product-image" style={{ minHeight: 320 }}>
        <span className="muted">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={active.url} alt={active.alt || fallbackAlt} />
      </div>
      {validImages.length > 1 ? (
        <div className="gallery-thumbs">
          {validImages.map((img, index) => (
            <button
              key={`${img.url}-${index}`}
              type="button"
              className={index === activeIndex ? "thumb active" : "thumb"}
              onClick={() => setActiveIndex(index)}
            >
              <img src={img.url} alt={img.alt || fallbackAlt} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
