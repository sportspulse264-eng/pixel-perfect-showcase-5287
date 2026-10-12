import { lazy, Suspense, type ComponentProps } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type MapViewType from "./MapView";

const MapView = lazy(() => import("./MapView"));

export function LazyMap(props: ComponentProps<typeof MapViewType>) {
  const fb = <div style={{ height: props.height ?? 420 }} className="animate-pulse rounded-md border bg-muted" />;
  return (
    <ClientOnly fallback={fb}>
      <Suspense fallback={fb}><MapView {...props} /></Suspense>
    </ClientOnly>
  );
}

export function MapLegend() {
  const items: [string, string][] = [["bg-critical", "Critical incident"], ["bg-warning", "High priority"], ["bg-success", "Available resource"], ["bg-primary", "Deployed resource"], ["bg-info", "Shelter"]];
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${c}`} />{l}</span>)}
    </div>
  );
}
