import Link from "next/link";
import { BarChart3, Coins, Receipt, TrendingUp, Utensils } from "lucide-react";

const reportMetrics = [
  { title: "Orders", value: "-", hint: "Connect manager order feed", icon: Receipt },
  { title: "Revenue", value: "-", hint: "Connect payment summary", icon: Coins },
  { title: "Refund rate", value: "-", hint: "Use refund module data", icon: TrendingUp },
  { title: "Dish demand", value: "-", hint: "Use session finalization data", icon: Utensils },
];

const reportLinks = [
  { label: "Serving Sessions", href: "/manager/sessions" },
  { label: "Refund Requests", href: "/manager/refunds" },
  { label: "Menu Settings", href: "/manager/menu" },
];

export default function ManagerReportsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Sales Reports</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Reporting workspace for order volume, revenue, refunds, and menu performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {reportMetrics.map((metric) => (
          <div
            key={metric.title}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  {metric.title}
                </p>
                <p className="text-3xl font-black text-gray-900 mt-2">{metric.value}</p>
                <p className="text-sm font-semibold text-gray-400 mt-2">{metric.hint}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shrink-0">
                <metric.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Report data is not connected yet</h2>
        </div>
        <div className="h-72 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center px-6 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300" />
          <p className="text-lg font-bold text-gray-400 mt-4 max-w-2xl">
            Charts will render here after manager analytics endpoints are available.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {reportLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-5 py-3 bg-white text-gray-600 hover:text-[#D35400] rounded-2xl border border-gray-100 hover:border-orange-200 text-sm font-black transition-all shadow-sm"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
