import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoInk from "@/assets/smol-stuuf-logo.png.asset.json";
import headerLogo from "@/assets/smol-header-logo.png.asset.json";
import normalTexture from "@/assets/header-normal-reference.jpg.asset.json";
import vaultTexture from "@/assets/header-vault-reference.jpg.asset.json";
import { useCart } from "@/hooks/use-cart";
import { CartSheet } from "./CartSheet";

export function SiteHeader({ secret = false }: { secret?: boolean }) {
  const { totalItems, setIsOpen } = useCart();
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("smol-dark")), []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("smol-dark", next);
    window.localStorage.setItem("smol-theme", next ? "dark" : "light");
  };

  return (
    <header className={secret ? "smol-header smol-header-secret" : "smol-header"}>
      <img className="smol-header-texture" src={secret ? vaultTexture.url : normalTexture.url} alt="" aria-hidden="true" />
      <div className="navbar">
        <Link to="/" className="brandmark">
          <img className="logo-lockup" src={secret ? logoInk.url : headerLogo.url} alt="SMOL STUUF" />
        </Link>
        <nav className="links" aria-label="Main navigation">
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
        <Button className="theme-btn button-spring" variant="ghost" size="icon" type="button" onClick={toggleTheme} aria-label="Toggle dark mode" aria-pressed={dark} title={dark ? "Switch to light mode" : "Switch to dark mode"}>
          {dark ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
        <Button className="cart-btn button-spring" type="button" onClick={() => setIsOpen(true)}>
          Cart · {totalItems}
        </Button>
        <span className="header-sticker hs-drop" aria-hidden="true">
          BATCH 04 /
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
