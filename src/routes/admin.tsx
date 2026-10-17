import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
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

function AdminShell() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => setToken(sessionStorage.getItem(KEY) ?? ""), []);

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
      <div className="admin-shell">
        <nav className="admin-rail">
          <strong>SMOL<br />CONSOLE</strong>
          <Link to="/admin" activeOptions={{ exact: true }}>Dashboard</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/campaigns">Hero slides</Link>
          <Link to="/admin/coupons">Coupons</Link>
          <Link to="/admin/media">Media</Link>
          <Link to="/admin/assets">Stickers</Link>
          <Link to="/admin/settings">Settings</Link>
          <a href="/">← Store</a>
          <button className="admin-btn ghost" onClick={() => { sessionStorage.removeItem(KEY); setToken(""); }}>Power off</button>
        </nav>
        <main className="admin-main"><Outlet /></main>
      </div>
    </TokenCtx.Provider>
  );
}
