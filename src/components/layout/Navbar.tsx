import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      style={{ backgroundColor: "#F2EDE4", borderBottom: "1px solid #D4C9BC" }}
      className="px-8 py-5 flex items-center justify-between sticky top-0 z-50"
    >
      {/* Logo */}
      <Link href="/">
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "#2C1810",
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          SPOTRUCK
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-10">
        {[
          { label: "MARKETPLACE", href: "/marketplace" },
          { label: "ÉVÉNEMENTS", href: "/events" },
          { label: "COMMENT ÇA MARCHE", href: "#" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontFamily: "'Inter', Helvetica, sans-serif",
              color: "#2C1810",
              fontSize: "0.7rem",
              fontWeight: 300,
              letterSpacing: "0.2em",
              textDecoration: "none",
              opacity: 0.75,
            }}
            className="hover:opacity-100 transition-opacity"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <Link
          href="/auth/login"
          style={{
            fontFamily: "'Inter', Helvetica, sans-serif",
            color: "#2C1810",
            fontSize: "0.7rem",
            fontWeight: 300,
            letterSpacing: "0.2em",
            opacity: 0.75,
          }}
          className="hidden md:block hover:opacity-100 transition-opacity"
        >
          CONNEXION
        </Link>
        <Link
          href="/auth/register"
          style={{
            fontFamily: "'Inter', Helvetica, sans-serif",
            color: "#C4622D",
            fontSize: "0.7rem",
            fontWeight: 400,
            letterSpacing: "0.2em",
            border: "1px solid #C4622D",
            padding: "0.6rem 1.2rem",
            textDecoration: "none",
          }}
          className="hover:bg-[#C4622D] hover:text-white transition-colors"
        >
          S'INSCRIRE
        </Link>
      </div>
    </nav>
  );
}
