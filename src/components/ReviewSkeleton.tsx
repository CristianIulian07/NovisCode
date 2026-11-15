export function ReviewSkeleton() {
  return (
    <div
      className="space-y-5 animate-pulse"
      aria-busy="true"
      aria-label="Se analizează codul..."
      data-testid="review-skeleton"
    >
      {/* Verdict skeleton */}
      <div className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 space-y-2.5">
        <div className="h-5 w-40 rounded bg-[#232730]" />
        <div className="h-4 w-5/6 rounded bg-[#1E222B]" />
      </div>

      {/* Strengths skeleton */}
      <div className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 space-y-2.5">
        <div className="h-4 w-36 rounded bg-[#232730]" />
        <div className="h-3.5 w-4/5 rounded bg-[#1E222B]" />
        <div className="h-3.5 w-3/5 rounded bg-[#1E222B]" />
      </div>

      {/* Top priorities skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-[#232730]" />
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-48 rounded-md bg-[#1B1F27] border border-[#262A33]" />
          <div className="h-9 w-44 rounded-md bg-[#1B1F27] border border-[#262A33]" />
          <div className="h-9 w-40 rounded-md bg-[#1B1F27] border border-[#262A33]" />
        </div>
      </div>

      {/* Issue card skeletons */}
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 rounded bg-[#232730]" />
            <div className="h-4 w-24 rounded bg-[#1E222B]" />
            <div className="h-4 w-16 rounded bg-[#1E222B] ml-auto" />
          </div>
          <div className="h-5 w-2/3 rounded bg-[#232730]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded bg-[#1E222B]" />
            <div className="h-3.5 w-5/6 rounded bg-[#1E222B]" />
          </div>
          <div className="h-16 w-full rounded bg-[#111318] border border-[#22262F]" />
        </div>
      ))}

      {/* Mentor note skeleton */}
      <div className="rounded-lg border border-[#262A33] bg-[#14161B] p-4 space-y-2">
        <div className="h-4 w-28 rounded bg-[#232730]" />
        <div className="h-3.5 w-full rounded bg-[#1E222B]" />
      </div>
    </div>
  );
}
