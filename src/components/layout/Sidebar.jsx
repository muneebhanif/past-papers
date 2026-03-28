import { DEPARTMENTS } from "../../constants/departments";

export function Sidebar({ selectedDepartment, setDepartment }) {
  return (
    <aside className="hidden w-64 shrink-0 xl:block">
      <div className="sticky top-20 rounded-xl bg-slate-50 p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Departments</h3>
        <div className="space-y-1">
          {DEPARTMENTS.map((department) => (
            <button
              key={department}
              onClick={() => setDepartment(department)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                selectedDepartment === department
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {department}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
