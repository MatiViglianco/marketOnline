import React, { useRef, useState } from 'react'

export default function CardSpotlight({ className = '', children }) {
  const divRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => { setIsFocused(true); setOpacity(1) }}
      onBlur={() => { setIsFocused(false); setOpacity(0) }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={[
        'relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700',
        // Hover/resaltado sutil naranja similar al fondo de la card (un poco más notorio)
        'hover:border-orange-600 dark:hover:border-orange-600 transition-colors',
        // Fondo: claro blanco, oscuro #020617
        'bg-white dark:bg-[#020617] shadow-sm',
        className,
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          // Usar naranja-500 para el brillo, a juego con el botón
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(249,115,22,.16), transparent 40%)`,
        }}
      />
      {children}
    </div>
  )
}
