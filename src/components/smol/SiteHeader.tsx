import { Link } from "@tanstack/react-router";
import logoInk from "@/assets/smol-stuuf-logo.png.asset.json";
import headerLogo from "@/assets/smol-header-logo.png.asset.json";
import headerTexture from "@/assets/smol-header-texture.png.asset.json";
import { useCart } from "@/hooks/use-cart";
import { CartSheet } from "./CartSheet";

export function SiteHeader({ secret = false }: { secret?: boolean }) {
  const { totalItems, setIsOpen } = useCart();

  return (
    <header className={secret ? "smol-header smol-header-secret" : "smol-header"}>
      {!secret && <img className="smol-header-texture" src={headerTexture.url} alt="" aria-hidden="true" />}
      <div className="navbar">
        <Link to="/" className="brandmark">
          <img className="logo-lockup" src={secret ? logoInk.url : headerLogo.url} alt="SMOL STUUF" />
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
