import { Link } from "@tanstack/react-router";
import logo from "@/assets/smol-stuuf-logo.png.asset.json";

export function SiteHeader() {
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
        <button className="cart-btn" type="button">
          Cart · 0
        </button>
      </div>
    </header>
  );
}
