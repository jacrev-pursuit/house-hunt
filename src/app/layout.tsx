import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { AuthProvider } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "North Fork House Hunt",
  description: "Find the perfect home on the North Fork of Long Island",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "House Hunt",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4a6475",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLogin = pathname === "/login";

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="h-full bg-sand-50 text-foreground">
        <AuthProvider initialUser={user}>
          <div className="max-w-lg mx-auto min-h-full flex flex-col">
            <main className={`flex-1 ${!isLogin && user ? "pb-20" : ""}`}>
              {children}
            </main>
            {!isLogin && user && <BottomNav />}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
