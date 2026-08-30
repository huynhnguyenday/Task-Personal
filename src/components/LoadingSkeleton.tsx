type SkeletonProps = {
  className?: string;
  width?: string;
};

export function Skeleton({ className = "", width }: SkeletonProps) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} style={width ? { width } : undefined} />;
}

export function TaskTableSkeleton() {
  return (
    <div className="min-w-[1000px]" role="status" aria-label="Đang tải danh sách công việc">
      <div className="grid grid-cols-[2.2fr_1.35fr_1.15fr_1.15fr_1.2fr_1fr_1.15fr_80px] gap-4 px-4 pb-3">
        {[72, 58, 64, 52, 68, 55, 62, 45].map((width, index) => <Skeleton key={index} className="h-3" width={`${width}%`} />)}
      </div>
      <div className="overflow-hidden border border-[#e3e7e9] bg-white">
        {Array.from({ length: 7 }).map((_, row) => (
          <div key={row} className="grid min-h-[62px] grid-cols-[2.2fr_1.35fr_1.15fr_1.15fr_1.2fr_1fr_1.15fr_80px] items-center gap-4 border-b border-[#edf0ee] px-4 last:border-b-0">
            {Array.from({ length: 8 }).map((__, column) => <Skeleton key={column} className={`h-3 ${column === 0 ? "w-4/5" : column === 7 ? "w-8" : row % 2 ? "w-2/3" : "w-3/4"}`} />)}
          </div>
        ))}
      </div>
      <span className="sr-only">Đang tải công việc...</span>
    </div>
  );
}

export function SettingListSkeleton() {
  return (
    <div className="mt-[17px] grid gap-2" role="status" aria-label="Đang tải cấu hình">
      {["w-3/4", "w-1/2", "w-4/5", "w-2/3", "w-3/5"].map((width, index) => (
        <div key={index} className="flex min-h-10 items-center justify-between bg-[#f5f7f5] px-3">
          <Skeleton className={`h-3 ${width}`} />
          <div className="flex gap-2"><Skeleton className="h-6 w-6" /><Skeleton className="h-6 w-6" /></div>
        </div>
      ))}
      <span className="sr-only">Đang tải cấu hình...</span>
    </div>
  );
}

export function ExportPreviewSkeleton() {
  return (
    <div className="mx-auto mt-5 max-w-[760px] border border-[#dce2de] bg-white p-6 shadow-[0_12px_35px_rgba(32,37,43,0.06)] sm:p-9" role="status" aria-label="Đang tạo bản xem trước">
      <div className="flex items-center justify-between border-b border-[#edf0ee] pb-5">
        <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-5 w-64 max-w-[60vw]" /></div>
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="mt-6 grid grid-cols-4 gap-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
      <div className="mt-5 space-y-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-9 w-full" />)}</div>
      <span className="sr-only">Đang tải bản xem trước...</span>
    </div>
  );
}
