import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Configurator } from "@/components/hydrogem/Configurator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HydroGem 3D Bottle Configurator" },
      {
        name: "description",
        content:
          "Customize crystal-studded HydroGem bottles in 3D with plastic finishes, lattice crystals, glass charms, and interactive keychains.",
      },
      { property: "og:title", content: "HydroGem 3D Bottle Configurator" },
      {
        property: "og:description",
        content:
          "Customize crystal-studded HydroGem bottles in 3D with detailed finishes, organized crystals, and playful keychains.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly
      fallback={
        <div className="grid min-h-screen place-items-center bg-black text-white">
          <div className="animate-pulse text-sm uppercase tracking-[0.3em]">
            HydroGem
          </div>
        </div>
      }
    >
      <Configurator />
    </ClientOnly>
  );
}
