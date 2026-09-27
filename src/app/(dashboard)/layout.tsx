import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSessionUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/contacts", label: "Contacts" },
  { href: "/programs", label: "Programs & Pricing" },
  { href: "/calendar", label: "Calendar" },
  { href: "/funnels", label: "Email Funnels" },
  { href: "/surveys", label: "Surveys" },
  { href: "/settings/team", label: "Your Team" },
  { href: "/settings/api-keys", label: "API Keys" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white p-4">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-brand-dark">Divine Collective</p>
          <p className="text-xs text-gray-500">CRM</p>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-gray-200 pt-4 px-2">
          <p className="text-xs text-gray-500">{user.name}</p>
          <p className="truncate text-xs text-gray-400">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
