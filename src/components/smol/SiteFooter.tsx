import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="smol-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">SMOL STUUF</div>
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
      </div>
    </footer>
  );
}
