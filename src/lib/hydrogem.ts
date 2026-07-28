import stanleySil from "/stanleysil.svg";
import owalaSil from "/owalasil.svg";
import hydroSil from "/hydrosil.svg";

export type BottleKind = "tumbler" | "sport" | "twist";
export type CrystalShape = "diamond" | "heart" | "circle" | "star" | "square";
export type BottleSize = "S" | "M" | "L";
export type BottleColorKey = "aqua-tide" | "deep-ocean" | "mint-mist" | "sun-glow" | "sea-glass";

export const BOTTLE_COLORS: Record<BottleColorKey, { name: string; hex: string; accent: string }> =
  {
    "aqua-tide": { name: "Aqua Tide", hex: "#2EC4B6", accent: "#0D6E6A" },
    "deep-ocean": { name: "Deep Ocean", hex: "#0D6E6A", accent: "#052E2C" },
    "mint-mist": { name: "Mint Mist", hex: "#F0FAF7", accent: "#B8DED6" },
    "sun-glow": { name: "Sun Glow", hex: "#FFD700", accent: "#B58A00" },
    "sea-glass": { name: "Sea Glass", hex: "#81E6D9", accent: "#3AB0A2" },
  };

export const BOTTLES: Record<
  BottleKind,
  {
    name: string;
    tagline: string;
    silhouette: string;
    priceWas: number;
    price: number;
  }
> = {
  tumbler: {
    name: "Amber",
    tagline: "Wide-base tumbler with curved handle",
    silhouette: stanleySil,
    priceWas: 12,
    price: 10,
  },
  twist: {
    name: "Coral",
    tagline: "Compact bottle with twist-lock lid",
    silhouette: owalaSil,
    priceWas: 10,
    price: 8,
  },
  sport: {
    name: "Ruby",
    tagline: "Tall slim flask with flip cap",
    silhouette: hydroSil,
    priceWas: 11,
    price: 9,
  },
};

export const BOTTLE_ORDER: BottleKind[] = ["tumbler", "twist", "sport"];

export const CRYSTAL_SHAPES: { key: CrystalShape; name: string }[] = [
  { key: "diamond", name: "Diamond" },
  { key: "heart", name: "Heart" },
  { key: "circle", name: "Circle" },
  { key: "star", name: "Star" },
  { key: "square", name: "Square" },
];

export const SIZES: { key: BottleSize; name: string; ml: string }[] = [
  { key: "S", name: "Small", ml: "400 ml" },
  { key: "M", name: "Medium", ml: "600 ml" },
  { key: "L", name: "Large", ml: "900 ml" },
];

export const SIZE_PRICE_DELTA: Record<BottleSize, number> = { S: 0, M: 0, L: 0 };

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
