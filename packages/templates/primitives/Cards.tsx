import { Fragment, type ReactNode } from "react";
import { Icon, IconDisc, type IconName } from "./Icons.tsx";
import { Image } from "./Image.tsx";
import { Text } from "./Text.tsx";
import { type ColorToken, color, type FontSizeStep, type SpaceStep, space } from "./vars.ts";

// Panel, kartu, dan deret ikon Corporate Clean (PANDUAN corporate-clean bagian 7). Semua teks dari
// props (copy/knowledge brand); bidang memakai radius dan bayangan brand.

type Side = "top" | "right" | "bottom" | "left";

// Sudut yang menempel di sisi bleed: [kiri-atas, kanan-atas, kanan-bawah, kiri-bawah].
const CORNERS: Record<Side, [boolean, boolean, boolean, boolean]> = {
  top: [true, true, false, false],
  right: [false, true, true, false],
  bottom: [false, false, true, true],
  left: [true, false, false, true],
};

// Garis pemisah 2 px: warna teks yang ditipiskan agar terbaca di bidang apa pun.
const divider = (tone: ColorToken) =>
  `2px solid color-mix(in srgb, ${color(tone)} 24%, transparent)`;

type SurfaceProps = {
  background: ColorToken;
  // Bayangan brand (hanya terlihat bila brand `soft`), untuk kartu di atas latar terang.
  shadow?: boolean;
  // Garis tepi --shape-stroke, pemisah kartu bila brand tanpa bayangan.
  outline?: ColorToken;
};

const surface = ({ background, shadow = false, outline }: SurfaceProps) => ({
  background: color(background),
  boxShadow: shadow ? "var(--shape-shadow)" : undefined,
  border: outline ? `var(--shape-stroke) solid ${color(outline)}` : undefined,
});

type PanelProps = SurfaceProps & {
  // Sisi yang terpotong tepi kanvas: sudutnya siku dan padding-nya minimal safe margin.
  bleed?: Side;
  // 48–64 px (langkah 5–6).
  padding?: SpaceStep;
  justify?: "start" | "center" | "end";
  // Nama grup untuk QA jumlah elemen (T-130): isi panel dihitung satu elemen.
  group?: string;
  children?: ReactNode;
};

// Bidang warna bersudut brand (Corporate Panel, 12–25% kanvas); mengisi kotak induknya.
export function Panel({
  bleed,
  padding = 5,
  justify = "center",
  group,
  children,
  ...look
}: PanelProps) {
  const cut = bleed ? CORNERS[bleed] : [false, false, false, false];
  const pad = (side: Side) =>
    side === bleed ? `max(var(--space-safe), ${space(padding)})` : space(padding);
  return (
    <div
      data-qa-element={group ? "group" : undefined}
      data-qa-name={group}
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: justify === "center" ? "center" : `flex-${justify}`,
        gap: space(3),
        width: "100%",
        height: "100%",
        padding: `${pad("top")} ${pad("right")} ${pad("bottom")} ${pad("left")}`,
        borderRadius: cut.map((flat) => (flat ? "0" : "var(--shape-radius)")).join(" "),
        ...surface(look),
      }}
    >
      {children}
    </div>
  );
}

// Kartu: padding 32 px, isi bertumpuk di tengah; mengisi kotak induknya.
function Card({ children, ...look }: SurfaceProps & { children: ReactNode }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: space(2),
        width: "100%",
        height: "100%",
        padding: space(4),
        borderRadius: "var(--shape-radius)",
        ...surface(look),
      }}
    >
      {children}
    </div>
  );
}

type StatCardProps = SurfaceProps & {
  // Angka dari knowledge brand, mis. "1.200+".
  value: string;
  label: string;
  color: ColorToken;
  labelColor?: ColorToken;
  size?: FontSizeStep;
  valueSlot?: string;
  labelSlot?: string;
};

// Kartu angka bukti: angka besar (heading) + label.
export function StatCard({
  value,
  label,
  color: tone,
  labelColor,
  size = 5,
  valueSlot,
  labelSlot,
  ...look
}: StatCardProps) {
  return (
    <Card {...look}>
      <Text font="heading" size={size} color={tone} strong as="p" {...slotProp(valueSlot)}>
        {value}
      </Text>
      <Text font="body" size={1} color={labelColor ?? tone} {...slotProp(labelSlot)}>
        {label}
      </Text>
    </Card>
  );
}

type RatingCardProps = SurfaceProps & {
  // Skor nyata dari knowledge, mis. "4,8".
  score: string;
  // Sumber ulasan, mis. "dari 312 ulasan Google".
  source: string;
  color: ColorToken;
  starColor?: ColorToken;
  scoreSlot?: string;
  sourceSlot?: string;
};

// Kartu rating: bintang + skor + sumber ulasan.
export function RatingCard({
  score,
  source,
  color: tone,
  starColor = "accent",
  scoreSlot,
  sourceSlot,
  ...look
}: RatingCardProps) {
  return (
    <Card {...look}>
      <div style={{ display: "flex", alignItems: "center", gap: space(2) }}>
        <Icon name="star" size={64} color={starColor} solid />
        <Text font="heading" size={5} color={tone} strong as="p" {...slotProp(scoreSlot)}>
          {score}
        </Text>
      </div>
      <Text font="body" size={1} color={tone} {...slotProp(sourceSlot)}>
        {source}
      </Text>
    </Card>
  );
}

type ProfileTagProps = {
  src: string;
  name: string;
  role: string;
  // Cincin avatar: accent atau secondary.
  ring: ColorToken;
  color: ColorToken;
  roleColor?: ColorToken;
  // Diameter avatar 112–144 px.
  size?: number;
  // Tebal cincin 6–8 px.
  ringWidth?: number;
  // Avatar lingkaran, atau ikut sudut brand (Corporate radius 0 "siku").
  shape?: "circle" | "brand";
  imageSlot?: string;
  nameSlot?: string;
  roleSlot?: string;
};

// Tag profil testimoni/pakar: avatar bercincin, nama tebal, dan peran.
export function ProfileTag({
  src,
  name,
  role,
  ring,
  color: tone,
  roleColor,
  size = 128,
  ringWidth = 6,
  shape = "circle",
  imageSlot,
  nameSlot,
  roleSlot,
}: ProfileTagProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: space(4) }}>
      <div
        style={{
          boxSizing: "border-box",
          flex: "none",
          width: size,
          height: size,
          overflow: "hidden",
          border: `${ringWidth}px solid ${color(ring)}`,
          borderRadius: shape === "circle" ? "50%" : "var(--shape-radius)",
        }}
      >
        <Image src={src} {...(imageSlot ? { slot: imageSlot } : {})} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: space(1), minWidth: 0 }}>
        <Text font="body" size={2} color={tone} strong {...slotProp(nameSlot)}>
          {name}
        </Text>
        <Text font="body" size={1} color={roleColor ?? tone} {...slotProp(roleSlot)}>
          {role}
        </Text>
      </div>
    </div>
  );
}

type IconItem = { icon: IconName; label: string; slot?: string };

type IconRowProps = {
  // 3–4 item.
  items: IconItem[];
  // row = deret dengan pemisah garis; column = checklist vertikal.
  direction?: "row" | "column";
  color: ColorToken;
  // Wadah ikon: secondary bila terang, neutral-light di atas panel; null = ikon tanpa wadah.
  iconBackground?: ColorToken | null;
  iconColor?: ColorToken;
  iconShape?: "circle" | "brand";
  // Ikon 40–64 px; wadah 1,5×.
  iconSize?: number;
  size?: FontSizeStep;
};

// Deret ikon + label Corporate; semua item sama struktur dan lebar, selebar kotak induknya.
export function IconRow({
  items,
  direction = "row",
  color: tone,
  iconBackground = "secondary",
  iconColor = "primary",
  iconShape = "circle",
  iconSize = 48,
  size = 2,
}: IconRowProps) {
  const row = direction === "row";
  return (
    <div
      style={{
        display: "grid",
        width: "100%",
        gridTemplateColumns: row ? `repeat(${items.length}, minmax(0, 1fr))` : "minmax(0, 1fr)",
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.slot ?? `${item.icon}-${i}`}
          style={{
            display: "flex",
            flexDirection: row ? "column" : "row",
            alignItems: "center",
            gap: row ? space(3) : space(4),
            padding: row ? `0 ${space(3)}` : `${space(3)} 0`,
            textAlign: row ? "center" : "start",
            borderLeft: row && i > 0 ? divider(tone) : undefined,
            borderTop: !row && i > 0 ? divider(tone) : undefined,
          }}
        >
          {iconBackground ? (
            <IconDisc
              name={item.icon}
              size={iconSize}
              shape={iconShape}
              background={iconBackground}
              color={iconColor}
            />
          ) : (
            <Icon name={item.icon} size={iconSize} color={iconColor} />
          )}
          <Text font="body" size={size} color={tone} strong {...slotProp(item.slot)}>
            {item.label}
          </Text>
        </div>
      ))}
    </div>
  );
}

type ContactItem = { icon: IconName; text: string; slot?: string };

type ContactBarProps = {
  // 2–3 item, teks ≤ 24 karakter.
  items: ContactItem[];
  // line = baris tanpa bidang (bawaan); filled = bar terisi (hanya bila anggaran P9 cukup).
  variant?: "line" | "filled";
  // Bidang bar terisi: primary atau neutral-dark.
  background?: ColorToken;
  color?: ColorToken;
  iconBackground?: ColorToken;
  iconColor?: ColorToken;
  iconShape?: "circle" | "brand";
  // Logo di ujung kanan bila aturan brand meminta logo di bawah.
  children?: ReactNode;
};

// Baris kontak kaki Corporate: tinggi 112 px, selebar kotak induknya (area aman).
export function ContactBar({
  items,
  variant = "line",
  background = "primary",
  color: tone,
  iconBackground,
  iconColor,
  iconShape = "circle",
  children,
}: ContactBarProps) {
  const filled = variant === "filled";
  const text = tone ?? (filled ? "neutral-light" : "neutral-dark");
  const parts = items.map((item, i) => ({
    key: item.slot ?? `${item.icon}-${i}`,
    node: (
      <div style={{ display: "flex", alignItems: "center", gap: space(2), minWidth: 0 }}>
        <IconDisc
          name={item.icon}
          size={40}
          shape={iconShape}
          background={iconBackground ?? (filled ? "neutral-light" : "primary")}
          color={iconColor ?? (filled ? background : "neutral-light")}
        />
        <Text font="body" size={1} color={text} as="span" {...slotProp(item.slot)}>
          {item.text}
        </Text>
      </div>
    ),
  }));
  if (children) parts.push({ key: "logo", node: <div>{children}</div> });
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space(3),
        width: "100%",
        height: 112,
        padding: filled ? `0 ${space(5)}` : undefined,
        borderRadius: filled ? "var(--shape-radius)" : undefined,
        background: filled ? color(background) : undefined,
      }}
    >
      {parts.map(({ key, node }, i) => (
        <Fragment key={key}>
          {i > 0 && (
            <span
              style={{
                flex: "none",
                alignSelf: "stretch",
                margin: "28px 0",
                borderLeft: divider(text),
              }}
            />
          )}
          {node}
        </Fragment>
      ))}
    </div>
  );
}

const slotProp = (slot: string | undefined) => (slot ? { slot } : {});
