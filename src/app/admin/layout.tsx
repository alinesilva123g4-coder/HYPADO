import { AdminSidebar } from "./_components/Sidebar";

export const metadata = {
  title: "Admin · HYPADO",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <AdminSidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="px-4 pt-16 md:pt-10 md:px-10 pb-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
