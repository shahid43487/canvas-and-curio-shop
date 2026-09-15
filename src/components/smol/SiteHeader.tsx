import { Link } from "@tanstack/react-router";
import logo from "@/assets/smol-stuuf-logo.png.asset.json";
import { useCart } from "@/hooks/use-cart";
import { CartSheet } from "./CartSheet";

export function SiteHeader() {
  const { totalItems, setIsOpen } = useCart();

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
        <button className="cart-btn button-spring" type="button" onClick={() => setIsOpen(true)}>
          Cart · {totalItems}
        </button>
      </div>
      <CartSheet />
    </header>
  );
}
