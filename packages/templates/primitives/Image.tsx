type ImageProps = {
  src: string;
  fit?: "cover" | "contain";
  rounded?: boolean;
  alt?: string;
  slot?: string;
};

// Mengisi penuh kotak induknya; ukuran dan posisi diatur template.
export function Image({ src, fit = "cover", rounded = false, alt = "", slot }: ImageProps) {
  return (
    <img
      data-slot={slot}
      data-slot-type={slot ? "image" : undefined}
      src={src}
      alt={alt}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: fit,
        borderRadius: rounded ? "var(--shape-radius)" : undefined,
      }}
    />
  );
}
