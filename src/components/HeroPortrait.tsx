import heroBase from "@/assets/hero-base.png";
import accessoriesSheet from "@/assets/accessories-sheet.png";
import { SHEET_COLS, SHEET_ROWS, type HeroClass } from "@/lib/classes";
import { cn } from "@/lib/utils";

type Props = {
  heroClass: HeroClass;
  size?: number;
  bob?: boolean;
  className?: string;
};

export function AccessoryIcon({
  heroClass,
  size = 64,
  className,
}: {
  heroClass: HeroClass;
  size?: number;
  className?: string;
}) {
  if (heroClass.col < 0) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span className="font-display text-2xl text-muted-foreground">—</span>
      </div>
    );
  }
  return (
    <div
      className={className}
      role="img"
      aria-label={`${heroClass.name} headgear`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${accessoriesSheet})`,
        backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
        backgroundPosition: `${(heroClass.col / (SHEET_COLS - 1)) * 100}% ${(heroClass.row / (SHEET_ROWS - 1)) * 100}%`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

export function HeroPortrait({ heroClass, size = 260, bob = false, className }: Props) {
  // headgear is sized relative to the head, which is ~55% of the portrait box
  const gearSize = size * heroClass.scale * 0.62;

  return (
    <div
      className={cn("relative select-none", bob && "hero-bob", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={heroBase}
        alt={`${heroClass.name} hero portrait`}
        width={size}
        height={size}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {heroClass.col >= 0 && (
        <div
          className="absolute"
          style={{
            width: gearSize,
            height: gearSize,
            left: `calc(50% - ${gearSize / 2}px + ${(heroClass.x / 100) * size}px)`,
            top: `${2 + heroClass.y * 0.6}%`,
            backgroundImage: `url(${accessoriesSheet})`,
            backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
            backgroundPosition: `${(heroClass.col / (SHEET_COLS - 1)) * 100}% ${(heroClass.row / (SHEET_ROWS - 1)) * 100}%`,
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
