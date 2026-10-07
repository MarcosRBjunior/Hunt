import type { ComponentType } from "react";

import {
  LayerIcon,
  OrbitIcon,
  SparkIcon,
  SunIcon,
} from "@/components/ui/icons";
import { getProductArt, type Accent, type ProductIcon } from "@/lib/productArt";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/types/api";

type Variant = "card" | "review" | "coming";

const ICON_COMPONENTS: Record<
  ProductIcon,
  ComponentType<{ className?: string }>
> = {
  spark: SparkIcon,
  layer: LayerIcon,
  sun: SunIcon,
  orbit: OrbitIcon,
};

// Classes completas (sem interpolação) para o Tailwind encontrar no build.
const ACCENT_CLASSES: Record<
  Accent,
  { card: string; inner: string; soft: string }
> = {
  green: {
    card: "border-accent-green bg-accent-green-bg text-accent-green",
    inner: "bg-accent-green-inner",
    soft: "bg-accent-green-soft text-accent-green",
  },
  blue: {
    card: "border-accent-blue bg-accent-blue-bg text-accent-blue",
    inner: "bg-accent-blue-inner",
    soft: "bg-accent-blue-soft text-accent-blue",
  },
  yellow: {
    card: "border-accent-yellow bg-accent-yellow-bg text-accent-yellow",
    inner: "bg-accent-yellow-inner",
    soft: "bg-accent-yellow-soft text-accent-yellow",
  },
  purple: {
    card: "border-accent-purple bg-accent-purple-bg text-accent-purple",
    inner: "bg-accent-purple-inner",
    soft: "bg-accent-purple-soft text-accent-purple",
  },
};

const FRAME: Record<Variant, string> = {
  card: "size-[58px] rounded-lg -rotate-7 transition-transform duration-[250ms] group-hover:rotate-0 group-hover:scale-[1.03]",
  review: "size-[50px] rounded-icon rotate-7",
  coming: "size-[38px] rounded-sm",
};

const ICON_SIZE: Record<Variant, string> = {
  card: "size-[27px]",
  review: "size-[25px]",
  coming: "size-[21px]",
};

type ProductLogoProps = {
  product: Pick<ProductDTO, "id" | "logoUrl">;
  variant: Variant;
};

export function ProductLogo({ product, variant }: ProductLogoProps) {
  if (product.logoUrl) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden border border-line bg-surface",
          FRAME[variant],
        )}
      >
        {/* Logos vêm de qualquer host informado pelo admin: sem otimizador do Next. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.logoUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
    );
  }

  const { accent, icon } = getProductArt(product.id);
  const Icon = ICON_COMPONENTS[icon];
  const colors = ACCENT_CLASSES[accent];

  if (variant === "card") {
    return (
      <div
        data-accent={accent}
        data-icon={icon}
        className={cn("shrink-0 border p-1.5", colors.card, FRAME.card)}
      >
        <div
          className={cn(
            "grid size-full place-items-center rounded-md",
            colors.inner,
          )}
        >
          <Icon className={ICON_SIZE.card} />
        </div>
      </div>
    );
  }

  return (
    <div
      data-accent={accent}
      data-icon={icon}
      className={cn(
        "grid shrink-0 place-items-center",
        colors.soft,
        FRAME[variant],
      )}
    >
      <Icon className={ICON_SIZE[variant]} />
    </div>
  );
}
