export default function Loading() {
  return (
    <div className="lg:ml-64 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20 animate-pulse">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-8 w-64 bg-border rounded-md mb-2" />
          <div className="h-4 w-96 bg-border/60 rounded-md" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-full bg-border/40 rounded-md" />
          <div className="h-4 w-5/6 bg-border/40 rounded-md" />
          <div className="h-4 w-4/5 bg-border/40 rounded-md" />
          <div className="h-4 w-full bg-border/40 rounded-md" />
          <div className="h-4 w-3/4 bg-border/40 rounded-md" />
        </div>
      </div>
    </div>
  );
}