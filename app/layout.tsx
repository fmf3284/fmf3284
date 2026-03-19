import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminBar from "@/components/AdminBar";
import { ToastProvider } from "@/components/Toast";
import PageTracker from "@/components/PageTracker";

export const metadata: Metadata = {
  title: "Find My Fitness - Find Your Fitness Anywhere",
  description: "Discover the perfect workout for you, wherever you are. Browse gyms, yoga studios, personal trainers, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider>
          <AdminBar />
          <PageTracker />
          <Navbar />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
