import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Halaman kosong DESIGN 10.8: ikon 20 px, judul display (Plus Jakarta Sans), satu kalimat, satu
// tombol utama; rata tengah di area konten.
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <h2 className="font-display text-display">{title}</h2>
      <p className="max-w-prose text-muted-foreground">{children}</p>
      <div className="mt-1">{action}</div>
    </div>
  );
}
