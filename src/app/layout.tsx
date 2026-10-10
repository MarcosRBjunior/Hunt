import { ptBR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "nova · Descubra o próximo grande app",
    template: "%s · nova",
  },
  description:
    "Vitrine pública de produtos de startups, ordenada pelos votos da comunidade.",
};

/** Componentes do Clerk com as cores e a fonte do design "nova". */
const clerkAppearance = {
  variables: {
    colorPrimary: "#6258e8",
    colorForeground: "#17202e",
    fontFamily: "inherit",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} antialiased`}>
      <body className="font-sans">
        <ClerkProvider localization={ptBR} appearance={clerkAppearance}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
