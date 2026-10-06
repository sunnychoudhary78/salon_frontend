import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu, X } from "lucide-react";
import { appConfig } from "../../config/appConfig";
import { selectAuth } from "../../store/auth/authSlice";

const links = [
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const demoRequestClass =
  "rounded-full border border-[#e8c98a]/55 bg-[#2a1c10]/90 px-4 py-2 text-sm font-semibold text-[#f6e7c1] backdrop-blur hover:bg-[#3d2a16]";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { user } = useSelector(selectAuth);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("home-hero");
      if (!hero) return;
      setPinned(hero.getBoundingClientRect().bottom <= 64);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b text-white transition-colors ${
        pinned
          ? "border-white/10 bg-black/80 backdrop-blur"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center"
        >
          <img
            src={`${import.meta.env.BASE_URL}${appConfig.logo}`}
            alt="Catchy Admin"
            className="h-12 w-auto rounded-md object-contain sm:h-14"
          />
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToSection(link.id)}
              className="text-sm font-medium text-white/80 hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="https://www.immortaltechnovation.com/product/catchy"
            target="_blank"
            rel="noopener noreferrer"
            className={demoRequestClass}
          >
            Demo Request
          </a>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="rounded-full bg-gradient-to-r from-[#f6e7c1] to-[#c6964a] px-4 py-2 text-sm font-semibold text-stone-950 hover:brightness-105"
          >
            {user ? "Dashboard" : "login"}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/15 bg-black/70 px-4 py-4 text-white backdrop-blur md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                className="text-left text-sm font-medium text-white/90"
                onClick={() => {
                  setOpen(false);
                  scrollToSection(link.id);
                }}
              >
                {link.label}
              </button>
            ))}
            <a
              href="https://www.immortaltechnovation.com/product/catchy"
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 text-center ${demoRequestClass}`}
              onClick={() => setOpen(false)}
            >
              Demo Request
            </a>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="rounded-full bg-gradient-to-r from-[#f6e7c1] to-[#c6964a] px-4 py-2 text-center text-sm font-semibold text-stone-950 hover:brightness-105"
              onClick={() => setOpen(false)}
            >
              {user ? "Dashboard" : "login"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
