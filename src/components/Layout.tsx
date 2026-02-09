import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen gradient-hero">
      <main className="container mx-auto px-4 py-6 max-w-lg">
        {children}
      </main>
    </div>
  );
}
