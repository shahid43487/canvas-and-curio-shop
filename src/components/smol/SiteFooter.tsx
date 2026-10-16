import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Music2, Youtube } from "lucide-react";
import { useSite, DEFAULT_SOCIALS } from "@/lib/site";
import dancingDragon from "@/assets/dancing-dragon.png";

export function SiteFooter() {
  const so = useSite()?.socials ?? DEFAULT_SOCIALS;
  return (
    <footer className="smol-footer">
      <div className="footer-sky" aria-hidden="true"><span>✦</span><span>★</span><span>✦</span></div>
      <div className="wrap footer-stage">
        <div className="footer-monster-wrap" aria-hidden="true">
          <img className="footer-monster" src={dancingDragon} alt="" loading="lazy" width={1024} height={1024} />
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
            <div className="footer-col footer-social">
              <h4>Follow</h4>
              <div className="footer-social-icons">
                {so.instagram && <a href={so.instagram} target="_blank" rel="noreferrer" className="social-sticker sticker-ig" aria-label="Instagram">
                  <Instagram size={22} strokeWidth={2.4} />
                </a>}
                {so.facebook && <a href={so.facebook} target="_blank" rel="noreferrer" className="social-sticker sticker-fb" aria-label="Facebook">
                  <Facebook size={22} strokeWidth={2.4} />
                </a>}
                {so.tiktok && <a href={so.tiktok} target="_blank" rel="noreferrer" className="social-sticker sticker-tt" aria-label="TikTok">
                  <Music2 size={22} strokeWidth={2.4} />
                </a>}
                {so.youtube && <a href={so.youtube} target="_blank" rel="noreferrer" className="social-sticker sticker-fb" aria-label="YouTube"><Youtube size={22} strokeWidth={2.4} /></a>}
                {so.email ? <a href={`mailto:${so.email}`} className="social-sticker sticker-mail" aria-label="Email"><Mail size={22} strokeWidth={2.4} /></a> : <Link to="/about" className="social-sticker sticker-mail" aria-label="Newsletter"><Mail size={22} strokeWidth={2.4} /></Link>}
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SMOL STUUF. SMOL THINGS. BIG MOOD.</span>
          <span>Made in small batches.</span>
        </div>
        <div className="footer-marquee" aria-hidden="true"><span>WIGGLE MODE! • GOOD STUUF! • CITY-SIZED MOOD! • WIGGLE MODE! • GOOD STUUF! • CITY-SIZED MOOD! • </span></div>
      </div>
    </footer>
  );
}
