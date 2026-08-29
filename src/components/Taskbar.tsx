"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faFileExport, faGear, faHouse, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

const navigation = [
  { href: "/", label: "Công việc", icon: faHouse },
  { href: "/setting", label: "Cấu hình", icon: faGear },
  { href: "/export", label: "Xuất dữ liệu", icon: faFileExport },
];

export default function Taskbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <>
      <button type="button" className="fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center border border-[#d7ded9] bg-white text-[#28745b] shadow-[0_8px_24px_rgba(32,37,43,0.12)] transition hover:bg-[#e3f0e9]" aria-label="Mở thanh điều hướng" aria-expanded={isOpen} aria-controls="workspace-taskbar" onClick={() => setIsOpen(true)}>
        <FontAwesomeIcon icon={faBars} />
      </button>

      <div className={`fixed inset-0 z-50 bg-[#20252b]/30 transition-opacity duration-300 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!isOpen} onClick={() => setIsOpen(false)} />

      <aside id="workspace-taskbar" className={`fixed inset-y-0 left-0 z-[60] flex w-[280px] max-w-[85vw] flex-col bg-[#173f33] p-5 text-white shadow-[12px_0_40px_rgba(20,35,29,0.25)] transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Thanh điều hướng" aria-hidden={!isOpen}>
        <div className="mb-10 flex items-center justify-between border-b border-white/15 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-white text-lg font-bold text-[#28745b]">T</span>
            <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#a9d7c5]">PERSONAL</p><p className="text-sm font-semibold">Workspace</p></div>
          </div>
          <button type="button" className="grid h-9 w-9 place-items-center bg-white/10 text-white transition hover:bg-white/20" aria-label="Đóng thanh điều hướng" onClick={() => setIsOpen(false)}><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <nav className="grid gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-4 px-4 py-3.5 text-sm font-semibold no-underline transition ${isActive ? "bg-white text-[#28745b]" : "text-white/80 hover:bg-white/10 hover:text-white"}`} aria-current={isActive ? "page" : undefined} tabIndex={isOpen ? 0 : -1}>
              <span className="grid w-5 place-items-center text-base"><FontAwesomeIcon icon={item.icon} /></span>{item.label}
            </Link>;
          })}
        </nav>
        <p className="mt-auto border-t border-white/15 pt-5 text-[11px] leading-5 text-white/50">Quản lý công việc cá nhân</p>
      </aside>
    </>
  );
}
