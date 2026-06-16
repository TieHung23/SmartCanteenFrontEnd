"use client";

export default function ManagerDashboard() {
  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Orders", value: "25.1k", color: "text-blue-600" },
          { title: "Total Profit", value: "$2,435k", color: "text-green-600" },
          { title: "Claims", value: "3.5M", color: "text-purple-600" },
          { title: "New Customers", value: "43.5k", color: "text-orange-600" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-sm font-medium">{item.title}</p>
            <p className={`text-3xl font-bold ${item.color} mt-2`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Chart Simulation Area */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Sales Reports Overview</h3>
        <div className="h-64 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">Chart Visualization Area (Placeholder)</p>
        </div>
      </div>
    </div>
  );
}
