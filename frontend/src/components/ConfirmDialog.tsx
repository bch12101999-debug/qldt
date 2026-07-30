import { AnimatePresence, motion } from 'framer-motion'
import { useConfirmState } from '@/context/ConfirmContext'

export function ConfirmDialog() {
  const { state, handleClose } = useConfirmState()

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          onClick={() => handleClose(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg"
          >
            <h2 className="text-base font-semibold text-gray-800">{state.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{state.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => handleClose(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {state.cancelLabel ?? 'Hủy'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                  state.danger ? 'bg-accent-red hover:bg-accent-red/90' : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {state.confirmLabel ?? 'Xác nhận'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
