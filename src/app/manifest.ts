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
        src: "/icons/icon512_maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon512_rounded.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    orientation: "any",
    display: "standalone",
    dir: "auto",
    lang: "en-GB",
    name: "WTS Cloth Inventory",
    short_name: "WTS",
    start_url: "/",
    screenshots: [
      {
        src: "/apple-splash-2778-1284.jpg",
        sizes: "2778x1284",
        type: "image/jpeg",
        form_factor: "wide",
        label: "Dashboard wide view",
      },
      {
        src: "/apple-splash-1284-2778.jpg",
        sizes: "1284x2778",
        type: "image/jpeg",
        label: "Mobile portrait view",
      },
    ],
  };
}
