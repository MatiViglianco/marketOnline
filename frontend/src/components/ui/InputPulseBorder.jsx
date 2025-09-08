import React from 'react'

export default function InputPulseBorder({ className = '', ...props }) {
  return (
    <div className="relative">
      <div className="absolute top-0 flex w-full justify-center">
        <div className="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-[rgba(17,17,17,0)] via-gray-300 to-[rgba(17,17,17,0)] transition-all duration-1000" />
      </div>
      <input
        className={[
          'block h-12 w-full rounded-md border',
          'border-gray-300 bg-gray-100 text-gray-800',
          'px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 focus:ring-offset-white',
          // Modo oscuro: gris claro + texto blanco
          'dark:border-gray-400 dark:bg-gray-300 dark:text-white dark:placeholder-white/70',
          className,
        ].join(' ')}
        {...props}
      />
    </div>
  )
}
