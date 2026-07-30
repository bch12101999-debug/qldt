import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast, type ToastType } from '@/context/ToastContext'

const STYLES: Record<ToastType, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-brand-green/30 bg-white text-brand-green' },
  error: { icon: XCircle, className: 'border-accent-red/30 bg-white text-accent-red' },
  warning: { icon: AlertTriangle, className: 'border-accent-orange/30 bg-white text-accent-orange' },
  info: { icon: Info, className: 'border-primary/30 bg-white text-primary' },
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[100] flex w-full max-w-xs flex-col gap-2 sm:right-4 sm:top-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const { icon: Icon, className } = STYLES[t.type]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-lg ${className}`}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1 text-gray-700">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100" aria-label="Đóng thông báo">
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
