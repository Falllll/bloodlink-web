import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { IntlClientProvider } from "@/i18n/intl-client-provider";
import type { Locale } from "@/i18n/routing";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
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
        <IntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </IntlClientProvider>
      </body>
    </html>
  );
}
