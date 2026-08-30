import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChartColumn,
  faFileExport,
  faGear,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

const workspaceRoutes = [
  {
    href: "/task",
    title: "Công việc",
    description: "Theo dõi, thêm mới và cập nhật tiến độ công việc hằng ngày.",
    icon: faListCheck,
  },
  {
    href: "/analytics",
    title: "Phân tích công việc",
    description: "Theo dõi số lượng task, trạng thái và nhu cầu hỗ trợ trong tháng.",
    icon: faChartColumn,
  },
  {
    href: "/export",
    title: "Xuất dữ liệu",
    description: "Xem trước và xuất báo cáo công việc theo khoảng thời gian.",
    icon: faFileExport,
  },
  {
    href: "/setting",
    title: "Cấu hình",
    description: "Quản lý danh mục, phòng ban, công ty và trạng thái sử dụng.",
    icon: faGear,
  },
];

export default function MainPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f5] bg-[radial-gradient(circle_at_90%_0%,#dcece3_0,transparent_34%)] px-4 py-8 text-[#20252b] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1120px]">
        <header className="border-b border-[#d9e0dc] pb-8 pl-14 sm:pl-0">
          <p className="mb-2 text-[10px] font-bold tracking-[1.8px] text-[#28745b]">
            PERSONAL WORKSPACE
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-1px] sm:text-5xl">
            Trung tâm quản lý công việc
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#687169] sm:text-base">
            Chọn khu vực bạn muốn làm việc. Mỗi chức năng được tổ chức thành một
            route riêng để dễ quản lý và mở rộng.
          </p>
        </header>

        <section
          className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Chức năng chính"
        >
          {workspaceRoutes.map((route, index) => (
            <Link
              key={route.href}
              href={route.href}
              className="group flex min-h-[250px] flex-col border border-[#dce2de] bg-white p-6 text-inherit no-underline shadow-[0_10px_30px_rgba(32,37,43,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#28745b] hover:shadow-[0_16px_38px_rgba(32,37,43,0.1)]"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center bg-[#e3f0e9] text-lg text-[#28745b]">
                  <FontAwesomeIcon icon={route.icon} />
                </span>
                <span className="text-xs font-bold text-[#a2aaa5]">
                  0{index + 1}
                </span>
              </div>
              <h2 className="mt-8 text-xl font-semibold">{route.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#727a82]">
                {route.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-[#28745b]">
                Truy cập{" "}
                <FontAwesomeIcon
                  className="transition-transform group-hover:translate-x-1"
                  icon={faArrowRight}
                />
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
