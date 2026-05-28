export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <header className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md bg-neutral-200" />
          <div className="h-3 w-32 rounded bg-neutral-200/70" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-neutral-200" />
      </header>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="bg-neutral-50 h-10 border-b border-neutral-200" />
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="h-10 w-10 rounded-md bg-neutral-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-neutral-200" />
                <div className="h-2.5 w-1/5 rounded bg-neutral-200/70" />
              </div>
              <div className="h-3 w-16 rounded bg-neutral-200 hidden sm:block" />
              <div className="h-3 w-20 rounded bg-neutral-200" />
              <div className="h-5 w-16 rounded-full bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
