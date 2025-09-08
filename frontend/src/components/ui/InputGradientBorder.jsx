import React from 'react'

export default function InputGradientBorder({ className = '', ...props }) {
  const base = [
    'block h-12 w-full rounded-md',
    'border border-transparent',
    // Dual background trick for gradient border
    'bg-[linear-gradient(#000,#000),linear-gradient(to_right,#334454,#334454)]',
    'bg-origin-border [background-clip:padding-box,_border-box]',
    'px-3 py-2 text-slate-200 placeholder:text-slate-500',
    'transition-all duration-500 focus:outline-none',
    'focus:bg-[linear-gradient(#000,#000),linear-gradient(to_right,#c7d2fe,#8678f9)]',
  ].join(' ')

  return <input className={[base, className].join(' ')} {...props} />
}

