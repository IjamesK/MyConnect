export type InternetPlan = {
  name: string;
  speedMbps: number;
  monthlyPriceUGX: number;
  deviceRange: string;
  tagline: string;
  features: string[];
  assistantUse: string;
};

export const INTERNET_PACKAGES: InternetPlan[] = [
  { name: "GO", speedMbps: 50, monthlyPriceUGX: 69000, deviceRange: "3–5", tagline: "Everyday essentials", features: ["Browsing and social media", "Video calls and HD streaming", "Ideal for lighter home use"], assistantUse: "everyday browsing, messaging and HD streaming" },
  { name: "FIT", speedMbps: 100, monthlyPriceUGX: 90000, deviceRange: "5–8", tagline: "For connected families", features: ["Work and online classes", "Multiple HD streams", "Balanced everyday household use"], assistantUse: "families, video calls and multiple HD streams" },
  { name: "START", speedMbps: 200, monthlyPriceUGX: 110000, deviceRange: "8–12", tagline: "More room for everyone", features: ["4K streaming on compatible devices", "Gaming and larger downloads", "Busy homes and small teams"], assistantUse: "4K streaming, gaming and busy households" },
  { name: "PREMIUM", speedMbps: 300, monthlyPriceUGX: 200000, deviceRange: "12–20", tagline: "For heavy internet use", features: ["Many concurrent connected devices", "High-bandwidth streaming and work", "Larger households and workspaces"], assistantUse: "many connected devices and heavy household or workspace use" },
];
