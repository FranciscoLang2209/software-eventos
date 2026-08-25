import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Software Eventos",
  description:
    "Gestion de eventos, salones, pagos y reportes financieros para empresas de catering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
