type ImageProps = {
  src: string;
  fit?: "cover" | "contain";
  rounded?: boolean;
  // Hitam-putih, dasar perlakuan duotone di Frame (PRD 4 K5).
  mono?: boolean;
  alt?: string;
  slot?: string;
};

// Mengisi penuh kotak induknya; ukuran dan posisi diatur template.
export function Image({
  src,
  fit = "cover",
  rounded = false,
  mono = false,
  alt = "",
  slot,
}: ImageProps) {
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
        filter: mono ? "grayscale(1) contrast(1.1)" : undefined,
      }}
    />
  );
}
