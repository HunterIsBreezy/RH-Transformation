import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-inner">
          <div>© RH Transformation · Rylan &amp; Hunter</div>
          <div>
            <a href="https://instagram.com/rhtransformation" target="_blank" rel="noopener noreferrer">
              @rhtransformation
            </a>
            {" · "}
            <a href="https://instagram.com/rylanrunlift" target="_blank" rel="noopener noreferrer">
              @rylanrunlift
            </a>
            {" · "}
            <a href="https://instagram.com/hunterrr.1" target="_blank" rel="noopener noreferrer">
              @hunterrr.1
            </a>
          </div>
          <div>
            <Link href="/terms">Terms</Link>
            {" · "}
            <Link href="/privacy">Privacy</Link>
            {" · "}
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
