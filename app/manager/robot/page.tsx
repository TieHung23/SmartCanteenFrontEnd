import Link from "next/link";
import { Cpu, PackageCheck, Radio, Utensils } from "lucide-react";

const robotLanes = [
  { label: "Pickup lane A", status: "Ready", icon: PackageCheck },
  { label: "Pickup lane B", status: "Standby", icon: PackageCheck },
  { label: "Holding area", status: "Monitoring", icon: Utensils },
];

const robotSteps = [
  "Paid orders can create serving jobs through the robot serving API.",
  "The current API docs expose job creation, but not a manager job list endpoint.",
  "This page keeps the manager robot route available until live telemetry is connected.",
];

export default function ManagerRobotPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Robot Slots</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Monitor serving lanes and robot handoff readiness from the manager portal.
          </p>
        </div>
        <Link
          href="/manager/sessions"
          className="shrink-0 inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#D35400] text-white rounded-2xl font-black text-base hover:bg-[#b84900] transition-all shadow-md active:scale-95"
        >
          <Utensils className="w-5 h-5" />
          View Sessions
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {robotLanes.map((lane) => (
          <div
            key={lane.label}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  {lane.label}
                </p>
                <p className="text-xl font-black text-gray-900 mt-2">{lane.status}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shrink-0">
                <lane.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Robot telemetry is pending</h2>
            <p className="text-base text-gray-500 mt-2 max-w-3xl">
              The available robot module currently supports creating serving jobs for orders. A live
              manager feed can be added here when the backend exposes queue, tray, or robot-status
              endpoints.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Radio className="w-5 h-5 text-[#D35400]" />
          <h3 className="text-xl font-black text-gray-900">Integration checklist</h3>
        </div>
        <div className="space-y-4">
          {robotSteps.map((step, index) => (
            <div key={step} className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-black shrink-0">
                {index + 1}
              </span>
              <p className="text-base font-medium text-gray-600">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
