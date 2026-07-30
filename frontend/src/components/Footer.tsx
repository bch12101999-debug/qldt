export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-white px-4 py-3 text-xs text-gray-500">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <img src="/assets/logo-phuong-hiep-binh.png" alt="Logo phường Hiệp Bình" className="size-6 rounded-full" />
          <span>
            <strong>Ủy ban nhân dân phường Hiệp Bình</strong> — Địa chỉ: 719 Quốc lộ 13, phường Hiệp Bình, Thành phố
            Hồ Chí Minh
          </span>
        </div>
        <span>Phiên bản 1.0.0</span>
      </div>
    </footer>
  )
}
