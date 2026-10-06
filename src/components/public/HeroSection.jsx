import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const base = import.meta.env.BASE_URL;
const videoSrc = `${base}gemini_generated_video_eee26f20.mp4`;

const clients = [
  `${base}firstclient.png`,
  `${base}secnodclient.png`,
  `${base}0062347d-334f-477b-88df-21cdab7d4f25.jpg`,
];

const services = [
  {
    title: "Hair Cut & Styling",
    subtitle: "Trendy Looks",
    icon: (
      <>
        <circle cx="7.2" cy="7.2" r="2.1" />
        <circle cx="7.2" cy="16.8" r="2.1" />
        <path d="m8.8 8.6 9.4 9.2M8.8 15.4 18.2 6.2" />
      </>
    ),
  },
  {
    title: "Hair Color",
    subtitle: "Vibrant Shades",
    icon: (
      <>
        <path d="M14.2 4.8 19 9.6 11.2 17.4H7.4v-3.8L14.2 4.8Z" />
        <path d="m12.6 6.4 4.8 4.8" />
      </>
    ),
  },
  {
    title: "Hair Spa",
    subtitle: "Deep Nourishment",
    icon: (
      <path d="M12 4.5s4.5 4.2 4.5 8.1a4.5 4.5 0 0 1-9 0C7.5 8.7 12 4.5 12 4.5Z" />
    ),
  },
  {
    title: "Facial",
    subtitle: "Glowing Skin",
    icon: (
      <>
        <circle cx="12" cy="12.2" r="6" />
        <path d="M9.4 11.4h.01M14.6 11.4h.01M9.7 14.5c.7.8 1.5 1.2 2.3 1.2s1.6-.4 2.3-1.2" />
      </>
    ),
  },
  {
    title: "Beard Grooming",
    subtitle: "Sharp & Smart",
    icon: (
      <path d="M8.2 10.2V8.2a3.8 3.8 0 0 1 7.6 0v2M8.2 11c.3 3.6 1.6 6.2 3.8 7.2 2.2-1 3.5-3.6 3.8-7.2M9.7 13.4h.01M14.3 13.4h.01" />
    ),
  },
];

export default function HeroSection() {
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
    <section
      id="home-hero"
      className="relative isolate min-h-screen overflow-hidden bg-black text-white"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25 md:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/45 to-transparent md:block" />
      <div className="absolute inset-0 hidden bg-gradient-to-t from-black/50 via-transparent to-black/35 md:block" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-end px-4 pb-6 pt-28 sm:px-6 lg:pb-8">
        <div className="max-w-xl lg:mb-6">
          <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
            The grooming room
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Sit down.
            <span className="block text-amber-100">Leave sharper.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-stone-200 sm:text-lg">
            Warm light, a steady hand, and a chair already set for the work.
            Book the cut, the beard, and the finish you see in the mirror.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#features"
              className="rounded-full bg-white px-5 py-3 text-sm font-medium text-stone-950 hover:bg-amber-50"
            >
              Find your chair
            </a>
            <a
              href="https://www.immortaltechnovation.com/product/catchy-"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
            >
              Request Demo
            </a>
          </div>
        </div>

        <div className="mt-8 w-full md:mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2">
              {clients.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="size-9 rounded-full border-2 border-black/70 object-cover object-[center_20%]"
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-white">100+ Happy Customers</p>
            <p className="flex items-center gap-1.5 text-sm text-white">
              <span className="flex text-[#f3ddb0]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-3.5 fill-current" />
                ))}
              </span>
              <span className="font-semibold">4.9</span>
              <span className="text-white/75">(500+ Reviews)</span>
            </p>
          </div>

          <div className="mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-full min-w-max items-center justify-between gap-2 rounded-[28px] border border-[#e8d2a2]/45 bg-black/45 px-3 py-3 backdrop-blur-md sm:gap-4 sm:px-5 lg:min-w-0">
              {services.map((service) => (
                <li key={service.title} className="flex items-center gap-3 px-2">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e8d2a2]/70 text-[#f3ddb0]">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {service.icon}
                    </svg>
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="block text-sm font-semibold text-white">
                      {service.title}
                    </span>
                    <span className="block text-xs text-[#f3ddb0]/80">
                      {service.subtitle}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
