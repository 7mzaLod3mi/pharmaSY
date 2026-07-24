import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PharmaSY",
    short_name: "PharmaSY",
    description: "B2B pharmacy operations, supplier marketplace, inventory and reporting platform",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f0e",
    theme_color: "#0d9488",
    orientation: "portrait",
    categories: ["business", "medical"],
    lang: "ar",
  };
}
