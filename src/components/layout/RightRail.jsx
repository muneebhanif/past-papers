export function RightRail() {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-20 space-y-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-sm font-bold text-slate-700">Top Contributors</h4>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between"><span>Zain M.</span><span className="font-bold text-emerald-700">142</span></div>
            <div className="flex items-center justify-between"><span>Sara Ali</span><span className="font-bold text-emerald-700">98</span></div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 p-5 text-white shadow-[0px_20px_40px_rgba(0,74,198,0.12)]">
          <h4 className="text-lg font-bold">Help the Community</h4>
          <p className="mt-2 text-sm text-blue-100">Upload quality papers and support thousands of students.</p>
        </div>
      </div>
    </aside>
  );
}
