import { Inter, Roboto_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoSerif = Roboto_Serif({
  variable: "--font-roboto-serif",
  subsets: ["latin"],
  preload: false,
});

export const metadata = {
  title: "Spelinsikt Admin",
  description: "Spelinsikt administration panel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv" className={`${inter.variable} ${robotoSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
