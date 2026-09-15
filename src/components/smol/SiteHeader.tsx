import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/smol-stuuf-logo.png.asset.json";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (count === 0) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 520);
    return () => window.clearTimeout(t);
  }, [count]);

  return (
    <header className="smol-header">
      <div className="navbar">
        <Link to="/" className="brandmark">
          <img className="logo-lockup" src={logo.url} alt="SMOL STUUF" />
        </Link>
        <nav className="links">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "active" }}>
            Home
          </Link>
          <Link to="/shop" activeProps={{ className: "active" }}>
            Shop
          </Link>
          <Link to="/about" activeProps={{ className: "active" }}>
            About
          </Link>
        </nav>
        <Link to="/cart" className={bump ? "cart-btn button-spring cart-bump" : "cart-btn button-spring"}>
          Cart · {count}
        </Link>
      </div>
    </header>
  );
}
