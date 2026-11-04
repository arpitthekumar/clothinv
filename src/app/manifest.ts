import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    theme_color: "#3b82f6",
    background_color: "#111827",
    id: "/",
    scope: "/",
    description: "Offline-capable clothing management system",
    icons: [
      {
        src: "/icons/icon-192.webp",
        sizes: "192x192",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/icons/icon512_maskable.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "maskable",
      },
      {
        src: "/icons/icon512_rounded.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "any",
      },
    ],
    orientation: "any",
    display: "standalone",
    dir: "auto",
    lang: "en-GB",
    name: "wtscloth Inventory",
    short_name: "wtscloth",
    start_url: "/",
    screenshots: [
      {
        src: "/apple-splash-2778-1284.webp",
        sizes: "2778x1284",
        type: "image/webp",
        form_factor: "wide",
        label: "Dashboard wide view",
      },
      {
        src: "/apple-splash-1284-2778.webp",
        sizes: "1284x2778",
        type: "image/webp",
        label: "Mobile portrait view",
      },
    ],
  };
}
