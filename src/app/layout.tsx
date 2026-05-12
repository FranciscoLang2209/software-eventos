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
      <body className="min-h-full bg-[#f6f8fb] text-slate-950">
        {children}
      </body>
    </html>
  );
}
