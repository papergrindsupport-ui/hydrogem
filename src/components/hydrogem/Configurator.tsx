import { useEffect, useState } from "react";
import {
  BOTTLES,
  BOTTLE_COLORS,
  BOTTLE_ORDER,
  CRYSTAL_SHAPES,
  LETTERS,
  SIZES,
  type BottleKind,
  type BottleSize,
  type CrystalShape,
  type BottleColorKey,
} from "@/lib/hydrogem";
import { KD, cartItemId, useCart } from "@/lib/cart";
import { LazyScene } from "./LazyScene";
import { LogoMarquee } from "./LogoMarquee";
import { Moon, Sun, ShoppingBag, Check, Trash2, Minus, Plus, Heart, Palette } from "lucide-react";
import hydrogemLogo from "/hydrogem.png";

const CUSTOM_PRESETS = [
  "#FF6B9D",
  "#C084FC",
  "#60A5FA",
  "#34D399",
  "#FBBF24",
  "#F97316",
  "#EF4444",
  "#0EA5E9",
  "#A855F7",
  "#10B981",
  "#FACC15",
  "#111827",
];

function darkenHex(hex: string, amount = 0.35): string {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = Math.max(0, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount)));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function Configurator() {
  const [kind, setKind] = useState<BottleKind>("tumbler");
  const [colorKey, setColorKey] = useState<BottleColorKey>("aqua-tide");
  const [customHex, setCustomHex] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [crystalShape, setCrystalShape] = useState<CrystalShape>("diamond");
  const [size, setSize] = useState<BottleSize>("M");
  const [hasKeychain, setHasKeychain] = useState(true);
  const [letter, setLetter] = useState("M");
  const [dark, setDark] = useState(true);
  const [themeKey, setThemeKey] = useState<BottleColorKey>("aqua-tide");
  const [themeOpen, setThemeOpen] = useState(false);

  const cart = useCart();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    document.documentElement.style.setProperty("--blush", BOTTLE_COLORS[themeKey].hex);
  }, [themeKey]);

  const bottle = BOTTLES[kind];
  const currentLetter = hasKeychain ? letter : null;
  const isCustom = colorKey === ("custom" as BottleColorKey) && !!customHex;
  const palette = isCustom
    ? { name: `Custom ${customHex}`, hex: customHex!, accent: darkenHex(customHex!, 0.4) }
    : BOTTLE_COLORS[colorKey];
  const effectiveColorKey = isCustom ? `custom-${customHex}` : colorKey;
  const currentId = cartItemId(kind, effectiveColorKey, crystalShape, size, currentLetter);
  const inBag = cart.has(currentId);
  const bagItem = cart.items.find((i) => i.id === currentId);

  const handleAdd = () => {
    if (inBag) {
      cart.remove(currentId);
      return;
    }
    cart.add({
      id: currentId,
      kind,
      name: bottle.name,
      colorKey: effectiveColorKey as BottleColorKey,
      colorName: palette.name,
      crystalShape,
      size,
      letter: currentLetter,
      price: bottle.price,
      priceWas: bottle.priceWas,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center" aria-label="HydroGem home">
            <img src={hydrogemLogo} alt="HydroGem" className="h-12 w-auto object-contain sm:h-14" />
          </a>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setThemeOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-accent"
                aria-label="Choose theme color"
                aria-expanded={themeOpen}
              >
                <Palette className="h-4 w-4 text-[var(--blush)]" />
              </button>
              {themeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setThemeOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 top-11 z-50 flex gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-xl">
                    {(Object.keys(BOTTLE_COLORS) as BottleColorKey[]).map((c) => {
                      const p = BOTTLE_COLORS[c];
                      const active = themeKey === c;
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            setThemeKey(c);
                            setThemeOpen(false);
                          }}
                          title={p.name}
                          aria-label={`Theme: ${p.name}`}
                          className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                            active ? "scale-110" : ""
                          }`}
                          style={{
                            background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${p.hex} 60%, white), ${p.hex} 65%, ${p.accent})`,
                          }}
                        >
                          {active && (
                            <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-foreground/70" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setDark((d) => !d)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-accent"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => cart.setOpen(true)}
              className="relative inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent"
              aria-label="Open bag"
            >
              <ShoppingBag className="h-4 w-4 text-[var(--blush)]" />
              <span className="hidden sm:inline">Bag</span>
              {cart.count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--blush)] px-1.5 text-[10px] font-bold text-white">
                  {cart.count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--blush)]/30 bg-[var(--blush)]/10 px-3 py-1 text-xs uppercase tracking-widest text-[var(--blush)]">
            <Heart className="h-3 w-3 fill-current" />
            Design your dream bottle
          </div>
          <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            Hydrate in <span className="italic text-[var(--blush)]">style.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Pick your bottle, dust it in crystals, and add a cute letter charm. Everything updates
            live in 3D 💖
          </p>
        </div>
      </section>

      {/* Configurator */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="relative aspect-[4/5] min-h-[420px] w-full overflow-hidden rounded-3xl border border-border/60 shadow-2xl shadow-black/40 lg:aspect-auto lg:h-[720px]">
          <div className="absolute inset-0" style={{ background: dark ? "#000000" : "#eef4f3" }}>
            <LazyScene
              kind={kind}
              colorKey={colorKey}
              palette={{ hex: palette.hex, accent: palette.accent }}
              crystalShape={crystalShape}
              letter={currentLetter}
              dark={dark}
            />
          </div>

          <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
            <div className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs uppercase tracking-widest text-white/85 backdrop-blur">
              {bottle.name} · {size}
            </div>
            <div className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] text-white/70 backdrop-blur">
              Drag to rotate · scroll to zoom
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 flex items-baseline gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 backdrop-blur">
            <span className="text-[10px] uppercase tracking-widest text-white/50 line-through">
              {KD(bottle.priceWas)}
            </span>
            <span className="text-sm font-black text-[var(--blush)]">{KD(bottle.price)}</span>
          </div>
        </div>

        {/* Controls */}
        <aside className="glass-panel space-y-6 rounded-3xl p-5 sm:p-6">
          {/* Bottle shape — silhouettes */}
          <ControlBlock label="Bottle shape">
            <div className="grid grid-cols-3 gap-2">
              {BOTTLE_ORDER.map((k) => {
                const active = kind === k;
                return (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`group flex flex-col items-center rounded-2xl border-2 p-3 transition-all ${
                      active
                        ? "border-[var(--blush)] bg-[var(--blush)]/10 shadow-md shadow-[var(--blush)]/20"
                        : "border-border hover:border-[var(--blush)]/60"
                    }`}
                  >
                    <img
                      src={BOTTLES[k].silhouette}
                      alt={BOTTLES[k].name}
                      className={`h-16 w-auto object-contain transition ${
                        active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                      } ${dark ? "invert" : ""}`}
                    />
                    <div className="mt-2 text-[11px] font-bold leading-tight">
                      {BOTTLES[k].name}
                    </div>
                  </button>
                );
              })}
            </div>
          </ControlBlock>

          {/* Bottle color — cute circles */}
          <ControlBlock label="Bottle color">
            <div className="flex flex-wrap gap-3">
              {(Object.keys(BOTTLE_COLORS) as BottleColorKey[]).map((c) => {
                const p = BOTTLE_COLORS[c];
                const active = !isCustom && colorKey === c;
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setColorKey(c);
                    }}
                    className={`relative h-11 w-11 rounded-full shadow-inner transition-transform hover:scale-110 ${
                      active ? "scale-110" : ""
                    }`}
                    style={{
                      background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${p.hex} 60%, white), ${p.hex} 65%, ${p.accent})`,
                    }}
                    aria-label={p.name}
                    title={p.name}
                  >
                    {active && (
                      <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-[var(--blush)]" />
                    )}
                  </button>
                );
              })}
              <div className="relative">
                <button
                  onClick={() => setCustomOpen((v) => !v)}
                  className={`relative grid h-11 w-11 place-items-center rounded-full border-2 border-dashed transition-transform hover:scale-110 ${
                    isCustom ? "scale-110 border-[var(--blush)]" : "border-border"
                  }`}
                  style={
                    isCustom
                      ? {
                          background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${palette.hex} 60%, white), ${palette.hex} 65%, ${palette.accent})`,
                        }
                      : undefined
                  }
                  aria-label="More colors"
                  aria-expanded={customOpen}
                  title="More colors"
                >
                  {!isCustom && <Plus className="h-4 w-4 text-muted-foreground" />}
                  {isCustom && (
                    <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-[var(--blush)]" />
                  )}
                </button>
                {customOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCustomOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute left-0 top-13 z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-3 shadow-xl">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        More colors
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {CUSTOM_PRESETS.map((hex) => {
                          const active = isCustom && customHex === hex;
                          return (
                            <button
                              key={hex}
                              onClick={() => {
                                setCustomHex(hex);
                                setColorKey("custom" as BottleColorKey);
                              }}
                              className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                                active ? "scale-110" : ""
                              }`}
                              style={{
                                background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${hex} 60%, white), ${hex} 65%, ${darkenHex(hex, 0.35)})`,
                              }}
                              title={hex}
                              aria-label={hex}
                            >
                              {active && (
                                <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-[var(--blush)]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 border-t border-border pt-3">
                        <label className="flex items-center justify-between gap-2 text-xs font-medium">
                          <span className="text-muted-foreground">Pick custom</span>
                          <input
                            type="color"
                            value={customHex ?? "#2EC4B6"}
                            onChange={(e) => {
                              setCustomHex(e.target.value);
                              setColorKey("custom" as BottleColorKey);
                            }}
                            className="h-8 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                            aria-label="Custom color picker"
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{palette.name}</div>
          </ControlBlock>

          {/* Crystal shape — cute circles */}
          <ControlBlock label="Crystal shape">
            <div className="flex flex-wrap gap-3">
              {CRYSTAL_SHAPES.map((s) => {
                const active = crystalShape === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setCrystalShape(s.key)}
                    className={`relative grid h-11 w-11 place-items-center rounded-full border-2 bg-gradient-to-br from-[var(--blush)]/15 to-[var(--aqua-tide)]/15 transition-transform hover:scale-110 ${
                      active ? "scale-110 border-[var(--blush)]" : "border-transparent"
                    }`}
                    title={s.name}
                    aria-label={s.name}
                  >
                    <CrystalIcon shape={s.key} />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {CRYSTAL_SHAPES.find((s) => s.key === crystalShape)?.name}
            </div>
          </ControlBlock>

          {/* Size */}
          <ControlBlock label="Size">
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((s) => {
                const active = size === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSize(s.key)}
                    className={`rounded-2xl border-2 p-2.5 text-center transition-all ${
                      active
                        ? "border-[var(--blush)] bg-[var(--blush)]/10"
                        : "border-border hover:border-[var(--blush)]/60"
                    }`}
                  >
                    <div className="font-display text-lg font-black">{s.key}</div>
                    <div className="text-[10px] text-muted-foreground">{s.ml}</div>
                  </button>
                );
              })}
            </div>
          </ControlBlock>

          {/* Letter keychain */}
          <ControlBlock label="Letter keychain">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background/50 p-3">
              <span className="text-sm font-medium">Include keychain</span>
              <span
                role="switch"
                aria-checked={hasKeychain}
                onClick={(e) => {
                  e.preventDefault();
                  setHasKeychain((v) => !v);
                }}
                className={`relative inline-block h-6 w-11 rounded-full transition-colors ${
                  hasKeychain ? "bg-[var(--blush)]" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    hasKeychain ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </span>
            </label>
            {hasKeychain && (
              <div className="mt-3">
                <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  Choose your letter
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
                  {LETTERS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLetter(l)}
                      className={`aspect-square rounded-xl border-2 text-xl font-black leading-none transition-all sm:text-2xl ${
                        letter === l
                          ? "border-[var(--blush)] bg-[var(--blush)] text-white shadow-md shadow-[var(--blush)]/30"
                          : "border-border bg-background/40 hover:border-[var(--blush)]/60"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ControlBlock>

          {/* Add to bag / Remove */}
          {inBag && bagItem ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-3">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  In your bag
                </span>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-1 py-1">
                  <button
                    onClick={() => cart.setQty(bagItem.id, bagItem.qty - 1)}
                    aria-label="Decrease"
                    className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-[var(--blush)]/15"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{bagItem.qty}</span>
                  <button
                    onClick={() => cart.setQty(bagItem.id, bagItem.qty + 1)}
                    aria-label="Increase"
                    className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-[var(--blush)]/15"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={handleAdd}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--blush)] py-3.5 text-sm font-bold uppercase tracking-widest text-[var(--blush)] transition-all hover:bg-[var(--blush)] hover:text-white active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" />
                Remove from bag
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--blush)] py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-[var(--blush)]/40 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <ShoppingBag className="h-4 w-4 transition-transform group-hover:-rotate-12 group-hover:scale-110" />
              Add to bag
              <Check className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </aside>
      </section>

      {/* Logo marquee footer */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Created with love by:
        </div>
        <LogoMarquee />
        <div className="mt-10 text-center text-xs text-muted-foreground">
          © HydroGem — Hydrate in style. 💗{" "}
          <a
            href="https://www.instagram.com/hydrogem.kw/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            @hydrogem.kw
          </a>
        </div>
      </section>
    </div>
  );
}

function ControlBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function CrystalIcon({ shape }: { shape: CrystalShape }) {
  const c = "var(--blush)";
  const s = 20;
  switch (shape) {
    case "diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <path d="M12 2l10 8-10 12L2 10z" />
        </svg>
      );
    case "heart":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <path d="M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11z" />
        </svg>
      );
    case "circle":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "square":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
          <path d="M12 2l3 7 7 .8-5.3 4.7L18 22l-6-3.5L6 22l1.3-7.5L2 9.8 9 9z" />
        </svg>
      );
  }
}
