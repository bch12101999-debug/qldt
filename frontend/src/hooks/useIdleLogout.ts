import { useEffect } from 'react'

const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 phút

interface UseIdleLogoutOptions {
  enabled: boolean
  onLogout: () => void
}

export function useIdleLogout({
  enabled,
  onLogout,
}: UseIdleLogoutOptions) {
  useEffect(() => {
    if (!enabled) return

    let timeoutId: ReturnType<typeof setTimeout>

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        onLogout()
        window.location.replace('/dang-nhap')
      }, IDLE_TIMEOUT)
    }

    const events: Array<keyof WindowEventMap> = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ]

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimeout, {
        passive: true,
      })
    })

    resetTimeout()

    return () => {
      clearTimeout(timeoutId)

      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimeout)
      })
    }
  }, [enabled, onLogout])
}
