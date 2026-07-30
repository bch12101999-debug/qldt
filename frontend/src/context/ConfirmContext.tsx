import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

interface ConfirmContextValue {
  state: ConfirmState | null
  confirm: (options: ConfirmOptions) => Promise<boolean>
  handleClose: (value: boolean) => void
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setState({ ...options, resolve })
    })
  }, [])

  const handleClose = useCallback((value: boolean) => {
    resolveRef.current?.(value)
    resolveRef.current = null
    setState(null)
  }, [])

  return <ConfirmContext.Provider value={{ state, confirm, handleClose }}>{children}</ConfirmContext.Provider>
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm phải dùng trong ConfirmProvider')
  return ctx.confirm
}

export function useConfirmState() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirmState phải dùng trong ConfirmProvider')
  return ctx
}
