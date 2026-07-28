import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { BottleColorKey, BottleKind, CrystalShape } from "@/lib/hydrogem";

const BottleScene = lazy(() => import("./Scene").then((m) => ({ default: m.BottleScene })));

interface Props {
  kind: BottleKind;
  colorKey: BottleColorKey;
  crystalShape: CrystalShape;
  letter: string | null;
  dark: boolean;
}

/**
 * Mounts the WebGL scene only once the stage scrolls into view and the
 * browser is idle, so the page paints and stays interactive immediately.
 */
export function LazyScene(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let idle: number | undefined;
    const start = () => {
      const ric = (
        globalThis as unknown as {
          requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
        }
      ).requestIdleCallback;
      idle = ric
        ? ric(() => setMount(true), { timeout: 800 })
        : window.setTimeout(() => setMount(true), 120);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (idle !== undefined) clearTimeout(idle);
    };
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0">
      {mount ? (
        <Suspense fallback={<StageLoader />}>
          <BottleScene {...props} />
        </Suspense>
      ) : (
        <StageLoader />
      )}
    </div>
  );
}

function StageLoader() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="hg-loader" />
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">
          Preparing your bottle
        </div>
      </div>
    </div>
  );
}

