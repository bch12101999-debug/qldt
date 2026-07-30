const HAN_XU_LY_KEY = 'hiepbinh_han_xu_ly_mac_dinh'

export function getHanXuLyMacDinh(): number {
  const saved = localStorage.getItem(HAN_XU_LY_KEY)
  return saved ? Number(saved) : 30
}

export function setHanXuLyMacDinh(soNgay: number) {
  localStorage.setItem(HAN_XU_LY_KEY, String(soNgay))
}
