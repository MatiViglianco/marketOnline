import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function CategoryDropdown({ categories = [], selected = null, onSelect, className = '' }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (!open) return
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open])

  const current = selected == null ? 'Categorías' : (categories.find(c => c.id === selected)?.name || 'Categorías')

  const handleSelect = (id) => {
    onSelect?.(id)
    setOpen(false)
  }

  return (
    <div ref={ref} className={["relative inline-block text-left", className].join(' ')}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex w-full justify-between items-center gap-2 px-3 h-10 rounded-md border border-orange-600 text-orange-600 bg-white dark:bg-[#020617] hover:bg-orange-50 dark:hover:bg-[#020617]/90 transition"
      >
        {/* Icono proporcionado */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h16" /><path d="M4 12h16" /><path d="M4 4h16" /></svg>
        <span className="truncate max-w-[10rem] sm:max-w-[14rem]" title={current}>{current}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-80"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop para click afuera */}
            <motion.button
              type="button"
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
            />
            {/* Panel con animación similar al buscador */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute z-50 mt-2 w-full sm:w-64 origin-top-left rounded-md border border-orange-600 bg-white dark:bg-[#020617] shadow-lg p-1"
            >
              <button
                className={`w-full text-left px-3 py-2 rounded ${selected === null ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                onClick={() => handleSelect(null)}
              >
                Categorías
              </button>
              <div className="max-h-64 overflow-auto pr-1">
                {categories.map(c => (
                  <button
                    key={c.id}
                    className={`w-full text-left px-3 py-2 rounded ${selected === c.id ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                    onClick={() => handleSelect(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
