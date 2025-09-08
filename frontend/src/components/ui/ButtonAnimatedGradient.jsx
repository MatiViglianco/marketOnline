import React, { useRef, useState } from 'react'

export default function ButtonAnimatedGradient({ children, className = '', ...props }) {
  const btnRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e) => {
    if (!btnRef.current || isFocused) return
    const rect = btnRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleFocus = () => { setIsFocused(true); setOpacity(1) }
  const handleBlur = () => { setIsFocused(false); setOpacity(0) }
  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={[
        'relative flex items-center justify-center overflow-hidden rounded-md',
        'border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600',
        'px-4 py-2 font-medium text-white shadow-md transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
        className,
      ].join(' ')}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.18), transparent 40%)`,
        }}
      />
      {children}
    </button>
  )
}
