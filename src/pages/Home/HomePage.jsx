import { useEffect } from "react";
import { Link } from "react-router-dom";
import { appConfig } from "../../config/appConfig";
import Navbar from "../../components/public/Navbar";
import HeroSection from "../../components/public/HeroSection";
import AboutSection from "../../components/public/AboutSection";
import FeaturesSection from "../../components/public/FeaturesSection";

const footerLinks = [
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePage() {
  useEffect(() => {
    document.title = `${appConfig.appName} | Book a salon`;
  }, []);

  return (
    <div id="top" className="min-h-screen w-full bg-white text-stone-900">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
      </main>
      <footer className="border-t border-white/10 bg-[#080808] text-stone-300">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <img
                  src={`${import.meta.env.BASE_URL}${appConfig.logo}`}
                  alt="Catchy Admin"
                  className="h-16 w-auto object-contain"
                />
              </button>
              <p className="mt-3 max-w-xs text-sm text-stone-400">
                Public marketplace for salon bookings.
              </p>
            </div>
            <nav className="flex flex-col gap-3 text-sm">
              {footerLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="w-fit text-left text-stone-300 hover:text-[#f3ddb0]"
                >
                  {item.label}
                </button>
              ))}
              <Link to="/login" className="w-fit hover:text-[#f3ddb0]">
                Partner login
              </Link>
            </nav>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-sm text-stone-400">
            <a
              href="https://www.immortaltechnovation.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#f3ddb0]"
            >
              © 2026 Immortal Technovation. All rights reserved.
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
