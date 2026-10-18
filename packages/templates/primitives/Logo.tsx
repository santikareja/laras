import { type SpaceStep, space } from "./vars.ts";

type LogoProps = {
  src: string;
  height: SpaceStep;
  alt?: string;
  slot?: string;
};

export function Logo({ src, height, alt = "", slot }: LogoProps) {
  return (
    <img
      data-slot={slot}
      data-slot-type={slot ? "logo" : undefined}
      src={src}
      alt={alt}
      style={{ display: "block", height: space(height), width: "auto" }}
    />
  );
}
