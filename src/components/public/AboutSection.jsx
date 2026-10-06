import { useEffect, useRef, useState } from "react";

const videoSrc = `${import.meta.env.BASE_URL}gemini_generated_video_03561e21.mp4`;

const points = [
  "Salons reviewed before they join the marketplace.",
  "Stylists, services, and open slots in one place.",
  "A confirmation you can trust before you reach the chair.",
];

export default function AboutSection() {
  const videoRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  }, [reduceMotion]);

  return (
    <section id="about" className="scroll-mt-20 bg-[#0c0c0c] text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#e8d2a2]">
            About
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            The chair, the craft, and the booking in between.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-300 sm:text-base">
            Catchy is the public side of the salon. Guests find a room they
            trust, pick the service, and arrive already confirmed. Partners
            keep the chair full without living on the phone.
          </p>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-stone-300">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#e8d2a2]" />
                {point}
              </li>
            ))}
          </ul>
          <a
            href="https://www.immortaltechnovation.com/product/catchy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-[#f6e7c1] to-[#c6964a] px-5 py-3 text-sm font-semibold text-stone-950 hover:brightness-105"
          >
            Request Demo
          </a>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#e8d2a2]/40 bg-black shadow-2xl shadow-black/40">
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="A look inside a Catchy salon"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
