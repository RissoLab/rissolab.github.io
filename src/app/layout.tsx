import SearchModal from "@/components/SearchModal";
import config from "@/config/config.json";
import Announcement from "@/helpers/Announcement";
import TwSizeIndicator from "@/helpers/TwSizeIndicator";
import Footer from "@/partials/Footer";
import Header from "@/partials/Header";
import Providers from "@/partials/Providers";
import "@/styles/main.css";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Inter } from "next/font/google";

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html suppressHydrationWarning={true} lang="en" className={inter.variable}>
      {/* google tag manager */}
      {config.google_tag_manager.enable && (
        <GoogleTagManager gtmId={config.google_tag_manager.gtm_id} />
      )}
      {googleAnalyticsId && <GoogleAnalytics gaId={googleAnalyticsId} />}

      {/* head */}
      <head>
        {/* responsive meta */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />

        {/* favicon */}
        <link rel="shortcut icon" href={config.site.favicon} />
        {/* theme meta */}
        <meta name="theme-name" content="nextplate" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#fff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#000"
        />
      </head>

      {/* body */}
      <body
        suppressHydrationWarning={true}
        className="flex min-h-screen flex-col font-sans"
        style={
          {
            "--background-image-url": `url("${basePath}/images/spatial-transcriptomics-background.webp")`,
          } as React.CSSProperties
        }
      >
        <Providers>
          <Announcement />
          <Header />
          <SearchModal />
          <main className="grow">{children}</main>
          <Footer />
        </Providers>
        <TwSizeIndicator />
      </body>
    </html>
  );
}
