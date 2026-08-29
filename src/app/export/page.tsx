import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport } from "@fortawesome/free-solid-svg-icons";

export default function ExportPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f5] bg-[radial-gradient(circle_at_90%_0%,#e4efe7_0,transparent_32%)] px-4 py-8 text-[#20252b]">
      <section className="mx-auto max-w-[1440px] border-b border-[#e3e7e9] pb-7 pl-14 sm:pl-0">
        <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">PERSONAL WORKSPACE</p>
        <h1 className="text-2xl tracking-[-0.4px]">Xuất dữ liệu</h1>
      </section>
      <section className="mx-auto mt-6 max-w-[1440px] border border-[#e3e7e9] bg-white p-8">
        <div className="mb-5 grid h-12 w-12 place-items-center bg-[#e3f0e9] text-xl text-[#28745b]"><FontAwesomeIcon icon={faFileExport} /></div>
        <h2 className="text-lg">Xuất danh sách công việc</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#727a82]">Trang xuất dữ liệu đã được tách thành một thư mục riêng. Chức năng chọn định dạng và tải tệp có thể được bổ sung ở bước tiếp theo.</p>
        <Link href="/" className="mt-6 inline-block bg-[#28745b] px-5 py-3 text-sm font-bold text-white no-underline transition hover:bg-[#1e604a]">Về trang công việc</Link>
      </section>
    </main>
  );
}
