import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, Command, LayoutDashboard, Menu, Package, PanelsTopLeft, Palette, Settings2, ShoppingBag, Sparkles, Sticker, Trophy, X, LogOut } from "lucide-react";
import { adminDashboard } from "@/lib/admin.functions";
import { ADMIN_KEY as KEY, AdminTokenContext as TokenCtx } from "@/lib/admin-session";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Console — SMOL STUUF" },
      { name: "description", content: "SMOL STUUF operations console." },
      { property: "og:title", content: "Admin Console — SMOL STUUF" },
      { property: "og:description", content: "SMOL STUUF operations console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShell,
});

const navigation = [
  { label: "Overview", items: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Orders", to: "/admin/orders", icon: ShoppingBag },
    { label: "Products", to: "/admin/products", icon: Package },
  ]},
  { label: "Storefront", items: [
    { label: "Hero slides", to: "/admin/campaigns", icon: PanelsTopLeft },
    { label: "Media", to: "/admin/media", icon: Palette },
    { label: "Stickers", to: "/admin/assets", icon: Sticker },
  ]},
  { label: "SMOL CLUB", items: [
    { label: "Card Library", to: "/admin/card-library", icon: Sparkles },
    { label: "Sets & rewards", to: "/admin/sets", icon: Trophy },
    { label: "Achievement Lab", to: "/admin/achievements", icon: Command },
  ]},
  { label: "System", items: [
    { label: "Settings", to: "/admin/settings", icon: Settings2 },
  ]},
] as const;

function AdminShell() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: state => state.location.pathname });
  useEffect(() => setToken(sessionStorage.getItem(KEY) ?? ""), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const t = String(new FormData(e.currentTarget).get("key") ?? "");
    try {
      await adminDashboard({ data: { token: t } });
      sessionStorage.setItem(KEY, t);
      setToken(t);
    } catch {
      setError("Wrong key.");
    }
  };

  if (token === null) return null;
  if (!token)
    return (
      <main className="admin-login">
        <form onSubmit={login} className="admin-panel">
          <span className="admin-led" /> <h1>SMOL CONSOLE</h1>
          <input name="key" type="password" placeholder="Admin key" autoFocus className="admin-input" />
          <button className="admin-btn">Power on</button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </main>
    );

  return (
    <TokenCtx.Provider value={token}>
      <div className="admin-shell admin-burger-shell">
        <header className="admin-topbar">
          <button className="admin-menu-trigger" type="button" aria-label={menuOpen ? "Close admin menu" : "Open admin menu"} aria-expanded={menuOpen} aria-controls="admin-navigation-drawer" onClick={() => setMenuOpen(open => !open)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
            <span>{menuOpen ? "CLOSE MENU" : "MENU"}</span>
          </button>
          <Link to="/admin" className="admin-topbar-brand" aria-label="SMOL Console dashboard">
            <span className="admin-brand-mark"><Command size={18} strokeWidth={2.8}/></span>
            <span>SMOL<span> CONSOLE</span><small>STORE OPERATIONS</small></span>
          </Link>
          <div className="admin-topbar-right"><span className="admin-online-dot"/><span>ADMIN MODE</span></div>
        </header>

        {menuOpen && <button className="admin-drawer-scrim" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
        <aside id="admin-navigation-drawer" className={`admin-navigation-drawer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
          <div className="admin-drawer-heading"><div><span className="admin-drawer-eyebrow">NAVIGATION</span><h2>Control room<span>.</span></h2></div><span className="admin-drawer-count">09</span></div>
          <nav className="admin-drawer-nav" aria-label="Admin navigation">
            {navigation.map(group => <section className="admin-nav-group" key={group.label}>
              <h3>{group.label}</h3>
              {group.items.map(item => {
                const Icon = item.icon;
                return <Link key={item.to} to={item.to} activeOptions={"exact" in item && item.exact ? {exact:true} : undefined} activeProps={{className:"admin-nav-link is-active"}} className="admin-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="admin-nav-icon"><Icon size={18} strokeWidth={1.9}/></span><span>{item.label}</span><ChevronRight className="admin-nav-chevron" size={16}/>
                </Link>;
              })}
            </section>)}
          </nav>
          <div className="admin-drawer-footer">
            <Link to="/" className="admin-store-link"><span className="admin-nav-icon"><ArrowUpRight size={18}/></span><span>View storefront</span><ArrowUpRight size={15}/></Link>
            <button className="admin-logout-link" onClick={() => { sessionStorage.removeItem(KEY); setToken(""); setMenuOpen(false); }}><LogOut size={17}/><span>Power off console</span></button>
            <div className="admin-drawer-version"><span>SMOL STUUF</span><span>CONTROL PANEL / 01</span></div>
          </div>
        </aside>
        <main className="admin-main admin-main-with-topbar"><Outlet /></main>
      </div>
    </TokenCtx.Provider>
  );
}
