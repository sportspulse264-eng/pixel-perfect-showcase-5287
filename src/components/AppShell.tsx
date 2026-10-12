import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle, BarChart3, Bell, Boxes, FileText, FlaskConical, HeartHandshake, Home, LayoutDashboard,
  Map, Menu, Phone, Search, Settings, ShieldPlus, Shuffle, MapPin, User,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportDialog } from "./ReportDialog";
import { cn } from "@/lib/utils";
import { minsAgo } from "./common";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/resources", label: "Resources", icon: Boxes },
  { to: "/map", label: "Map View", icon: Map },
  { to: "/allocation", label: "Allocation", icon: Shuffle },
  { to: "/community", label: "Community", icon: HeartHandshake },
  { to: "/shelters", label: "Shelters", icon: Home },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/simulator", label: "Simulator", icon: FlaskConical },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Sidebar({ onNav }: { onNav?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-full flex-col gap-1 p-3">
      {NAV.map((n) => (
        <Link key={n.to} to={n.to} onClick={onNav} activeOptions={{ exact: n.to === "/" }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
          <n.icon className="h-4 w-4" />{n.label}
        </Link>
      ))}
      <div className="mt-auto rounded-lg border border-critical/20 bg-critical-soft p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-critical"><Phone className="h-4 w-4" />Emergency Help</div>
        <div className="mt-1 text-2xl font-bold text-critical">112</div>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">Demo only — this app is not connected to real dispatch. In a real emergency, call 112.</p>
        <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => setOpen(true)}>Report Emergency</Button>
      </div>
      <ReportDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function GlobalSearch() {
  const { search, setSearch, incidents, resources, shelters, community } = useStore();
  const navigate = useNavigate();
  const q = search.trim().toLowerCase();
  const hits = q.length < 2 ? [] : [
    ...incidents.filter((i) => `${i.title} ${i.area} ${i.id}`.toLowerCase().includes(q)).map((i) => ({ k: i.id, label: i.title, kind: "Incident", to: "/incidents" as const })),
    ...resources.filter((r) => `${r.name} ${r.base}`.toLowerCase().includes(q)).map((r) => ({ k: r.id, label: r.name, kind: "Resource", to: "/resources" as const })),
    ...shelters.filter((s) => `${s.name} ${s.area}`.toLowerCase().includes(q)).map((s) => ({ k: s.id, label: s.name, kind: "Shelter", to: "/shelters" as const })),
    ...community.filter((c) => `${c.name} ${c.provider}`.toLowerCase().includes(q)).map((c) => ({ k: c.id, label: c.name, kind: "Community", to: "/community" as const })),
  ].slice(0, 8);
  return (
    <div className="relative hidden w-full max-w-sm md:block">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents, resources, shelters…" className="pl-9" />
      {hits.length > 0 && (
        <div className="absolute z-[1000] mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {hits.map((h) => (
            <button key={h.k} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => { navigate({ to: h.to }); setSearch(""); }}>
              <span className="truncate">{h.label}</span><span className="text-xs text-muted-foreground">{h.kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const { notifications, markAllRead, location, setLocation } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-[1100] flex h-16 items-center gap-4 border-b bg-card px-4">
        <button className="lg:hidden" onClick={() => setMobile(!mobile)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldPlus className="h-5 w-5" /></div>
          <div className="leading-tight">
            <div className="font-bold">ResQFlow</div>
            <div className="text-[11px] text-muted-foreground">Emergency Resource Allocation</div>
          </div>
        </Link>
        <span className="hidden rounded-md border border-warning/30 bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning sm:inline">DEMO MODE</span>
        <div className="flex flex-1 justify-center"><GlobalSearch /></div>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="hidden w-48 sm:flex"><MapPin className="h-4 w-4 text-primary" /><SelectValue /></SelectTrigger>
          <SelectContent className="z-[1200]">
            {["Ballari, Karnataka", "Hosapete, Karnataka", "Sandur, Karnataka"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative rounded-md p-2 hover:bg-accent" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-primary-foreground">{unread}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="z-[1200] w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-semibold">Notifications<button className="text-xs text-primary" onClick={markAllRead}>Mark all read</button></div>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 && <div className="p-4 text-sm text-muted-foreground">No notifications</div>}
              {notifications.map((n) => (
                <div key={n.id} className={cn("border-b px-3 py-2 text-sm", !n.read && "bg-accent/50")}>
                  <div className={cn(n.level === "critical" && "text-critical")}>{n.message}</div>
                  <div className="text-[11px] text-muted-foreground">{minsAgo(n.createdAt)}</div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-accent"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"><User className="h-4 w-4" /></div><span className="hidden text-sm font-medium xl:inline">Demo Operator</span></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[1200]">
            <DropdownMenuLabel>Demo Operator</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/reports">Reports</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex">
        <aside className={cn("fixed inset-y-16 left-0 z-[1050] w-60 border-r bg-sidebar transition-transform lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0", mobile ? "translate-x-0" : "-translate-x-full")}>
          <Sidebar onNav={() => setMobile(false)} />
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
