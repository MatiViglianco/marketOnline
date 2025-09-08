import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'discount', label: 'Con descuento' },
  { value: 'price_high', label: 'Precio más alto' },
  { value: 'price_low', label: 'Precio más bajo' },
  { value: 'name_az', label: 'A - Z' },
  { value: 'name_za', label: 'Z - A' },
]

export default function SortDropdown({ value = 'relevance', onChange, className = '' }) {
  const [open, setOpen] = React.useState(false)
  const btnRef = React.useRef(null)
  const current = OPTIONS.find(o => o.value === value)?.label || 'Ordenar por'

  React.useEffect(() => {
    if (!open) return
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open])

  const select = (v) => { onChange?.(v); setOpen(false) }

  return (
    <div className={["relative inline-block text-left", className].join(' ')}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex w-full justify-between items-center gap-2 px-3 h-10 rounded-md border border-orange-600 text-orange-600 bg-white dark:bg-[#020617] hover:bg-orange-50 dark:hover:bg-[#020617]/90 transition"
      >
        {/* Icono proporcionado */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M7 5a1 1 0 0 1 1 1v9.584l1.293 -1.291a1 1 0 0 1 1.32 -.083l.094 .083a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1 -.112 .097l-.11 .071l-.114 .054l-.105 .035l-.149 .03l-.117 .006l-.075 -.003l-.126 -.017l-.111 -.03l-.111 -.044l-.098 -.052l-.096 -.067l-.09 -.08l-3 -3a1 1 0 0 1 1.414 -1.414l1.293 1.293v-9.586a1 1 0 0 1 1 -1m12 -2a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2zm-1.136 10.496l3.5 6a1 1 0 0 1 -.864 1.504h-7a1 1 0 0 1 -.864 -1.504l3.5 -6a1 1 0 0 1 1.728 0" />
        </svg>
        <span className="truncate max-w-[10rem] sm:max-w-[14rem]" title={current}>{current}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-80"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute z-50 mt-2 w-full sm:w-64 origin-top-left rounded-md border border-orange-600 bg-white dark:bg-[#020617] shadow-lg p-1"
            >
              {OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`w-full text-left px-3 py-2 rounded ${value === opt.value ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                  onClick={() => select(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
