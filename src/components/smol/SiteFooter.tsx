import { Link } from "@tanstack/react-router";
import fireKaiju from "@/assets/fire-kaiju-sticker.png";

export function SiteFooter() {
  return (
    <footer className="smol-footer">
      <div className="footer-sky" aria-hidden="true"><span>✦</span><span>★</span><span>✦</span></div>
      <div className="footer-flame" aria-hidden="true" />
      <div className="wrap footer-stage">
        <div className="footer-monster-wrap" aria-hidden="true">
          <img className="footer-monster" src={fireKaiju} alt="" loading="lazy" width={1280} height={1024} />
        </div>
        <div className="footer-city" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i />
        </div>
        <div className="footer-top">
          <div className="footer-brand"><span>SMOL</span> STUUF <small>BIG MOOD SINCE FOREVER</small></div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Shop</h4>
              <Link to="/shop">New stuuf</Link>
              <Link to="/shop">All stuuf</Link>
              <Link to="/shop">Weird ones</Link>
            </div>
            <div className="footer-col">
              <h4>Brand</h4>
              <Link to="/about">About</Link>
              <Link to="/about">Process</Link>
              <Link to="/about">Stockists</Link>
            </div>
            <div className="footer-col">
              <h4>Follow</h4>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer">
                TikTok
              </a>
              <Link to="/about">Newsletter</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SMOL STUUF. SMOL THINGS. BIG MOOD.</span>
          <span>Made in small batches.</span>
        </div>
        <div className="footer-marquee" aria-hidden="true"><span>SMOL ROAR! • GOOD STUUF! • CITY-SIZED MOOD! • SMOL ROAR! • GOOD STUUF! • CITY-SIZED MOOD! • </span></div>
      </div>
    </footer>
  );
}
