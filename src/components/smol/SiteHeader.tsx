import { Link } from "@tanstack/react-router";
import logoInk from "@/assets/smol-stuuf-logo.png.asset.json";
import logoPaper from "@/assets/smol-stuuf-logo-paper.png";
import { useCart } from "@/hooks/use-cart";
import { CartSheet } from "./CartSheet";

export function SiteHeader({ secret = false }: { secret?: boolean }) {
  const { totalItems, setIsOpen } = useCart();

  return (
    <header className={secret ? "smol-header smol-header-secret" : "smol-header"}>
      <div className="navbar">
        <Link to="/" className="brandmark">
          <img className="logo-lockup" src={secret ? logoInk.url : logoPaper} alt="SMOL STUUF" />
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
        <span className="header-sticker hs-drop" aria-hidden="true">
          BATCH 04 ✓
        </span>
        <span className="header-sticker hs-smol" aria-hidden="true">
          SMOL THINGS. BIG MOOD.
        </span>
        <span className="header-sticker hs-star" aria-hidden="true">
          ✦
        </span>
      </div>
      <CartSheet />
    </header>
  );
}
