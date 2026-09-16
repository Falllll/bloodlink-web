import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BloodLink",
  description: "Manajemen stok dan permintaan darah antar fasilitas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${sora.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full blur-[42px]"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--color-glow-brand) 44%, transparent) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -right-40 top-1/4 h-[34rem] w-[34rem] rounded-full blur-[42px]"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--color-glow-indigo) 38%, transparent) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -left-32 bottom-[-10rem] h-[32rem] w-[32rem] rounded-full blur-[42px]"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--color-glow-teal) 28%, transparent) 0%, transparent 70%)",
            }}
          />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
