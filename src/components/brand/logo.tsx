import type { CSSProperties } from "react";

interface BrandLogoProps {
  /** horizontal = ícone + texto lado a lado; vertical = ícone acima do texto */
  variant?: "horizontal" | "vertical";
  /**
   * light = versão com fundo branco; dark = versão com fundo azul;
   * transparent = logo azul-escura sem fundo; transparent-light = logo clara sem fundo
   */
  theme?: "light" | "dark" | "transparent" | "transparent-light";
  className?: string;
}

const LOGO_SOURCES = {
  horizontal: {
    light: "/brand/logo-white-horizontal.png",
    dark: "/brand/logo-blue-horizontal.png",
  },
  vertical: {
    light: "/brand/logo-white-vertical.png",
    dark: "/brand/logo-blue-vertical.png",
    transparent: "/brand/logo-white-vertical-transparent.png",
    "transparent-light": "/brand/logo-transparent-vertical.png",
  },
} as const;

export function BrandLogo({
  variant = "horizontal",
  theme = "light",
  className,
}: BrandLogoProps) {
  const src =
    theme === "transparent" || theme === "transparent-light"
      ? LOGO_SOURCES.vertical[theme]
      : LOGO_SOURCES[variant][theme];

  return (
    <img
      src={src}
      alt="P4 Contabilidade"
      className={className}
    />
  );
}
