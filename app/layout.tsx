// FILE: app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./components/layout/ClientLayout"; // UPDATED PATH
import { Toaster } from "react-hot-toast";
import { Suspense } from "react"; 

export const metadata: Metadata = {
  title: "Lab Seven",
  description: "Laboratory Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        {/* GLOBAL TOAST CONFIGURATION */}
        <Toaster 
            position="top-center" 
            reverseOrder={false} 
            toastOptions={{
                duration: 3000,
                style: {
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    color: '#1e293b',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                },
                success: {
                    iconTheme: { primary: '#10b981', secondary: '#ffffff' },
                },
                error: {
                    iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
                },
            }} 
        />

        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400 font-medium">
            Loading Lab Seven...
          </div>
        }>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}