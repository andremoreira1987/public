import "./globals.css";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata = {
  title: "Vixe Maria - Escola de Dança",
  description: "Aprenda a dançar com a Vixe Maria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={poppins.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
