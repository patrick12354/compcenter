import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata = {
  metadataBase: new URL("https://iris-competition-center.vercel.app"),
  title: "IRIS Competition Center",
  description:
    "Radar kompetisi IRIS untuk memantau event, deadline, guidebook, dan progres pendaftaran dari satu dashboard.",
  openGraph: {
    title: "IRIS Competition Center",
    description:
      "Radar kompetisi IRIS untuk memantau event, deadline, guidebook, dan progres pendaftaran dari satu dashboard.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "IRIS Competition Center",
    description:
      "Radar kompetisi IRIS untuk memantau event, deadline, guidebook, dan progres pendaftaran dari satu dashboard."
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${outfit.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}
