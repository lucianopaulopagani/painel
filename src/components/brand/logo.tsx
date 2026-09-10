interface BrandLogoProps {
  /** horizontal = ícone + texto lado a lado; vertical = ícone acima do texto */
  variant?: "horizontal" | "vertical";
  /** light = versão com fundo branco; dark = versão com fundo azul */
  theme?: "light" | "dark";
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
  },
} as const;

export function BrandLogo({
  variant = "horizontal",
  theme = "light",
  className,
}: BrandLogoProps) {
  return (
    <img
      src={LOGO_SOURCES[variant][theme]}
      alt="P4 Contabilidade"
      className={className}
    />
  );
}
