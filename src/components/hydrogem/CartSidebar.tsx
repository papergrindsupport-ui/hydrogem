import { Minus, Plus, ShoppingBag, Trash2, X, Heart } from "lucide-react";
import { KD, useCart } from "@/lib/cart";

export function CartSidebar() {
  const { items, open, setOpen, setQty, remove, total, totalWas, count } = useCart();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Your bag"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[var(--blush)]" />
            <h2 className="font-display text-lg font-bold">
              Your bag <span className="text-sm font-medium text-muted-foreground">({count})</span>
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <Heart className="h-8 w-8 text-[var(--blush)]" />
              <p className="text-sm text-muted-foreground">
                Your bag is empty — go design something sparkly.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="rounded-2xl border border-border bg-background/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-bold">{i.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {i.colorName} · {i.crystalShape} · size {i.size}
                        {i.letter ? ` · keychain "${i.letter}"` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(i.id)}
                      aria-label={`Remove ${i.name}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-1 py-1">
                      <button
                        onClick={() => setQty(i.id, i.qty - 1)}
                        aria-label="Decrease quantity"
                        className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-[var(--blush)]/15"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{i.qty}</span>
                      <button
                        onClick={() => setQty(i.id, i.qty + 1)}
                        aria-label="Increase quantity"
                        className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-[var(--blush)]/15"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground line-through">
                        {KD(i.priceWas * i.qty)}
                      </div>
                      <div className="text-sm font-bold text-[var(--blush)]">
                        {KD(i.price * i.qty)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-border px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="flex items-baseline gap-2">
              {totalWas > total && (
                <span className="text-xs text-muted-foreground line-through">{KD(totalWas)}</span>
              )}
              <span className="font-display text-lg font-black">{KD(total)}</span>
            </span>
          </div>
          <button
            disabled={items.length === 0}
            className="w-full rounded-2xl bg-[var(--blush)] py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-[var(--blush)]/30 transition-transform hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Checkout
          </button>
          <p className="text-center text-[10px] text-muted-foreground">
            Free sparkly gift wrap on every order 💗
          </p>
        </div>
      </aside>
    </>
  );
}
