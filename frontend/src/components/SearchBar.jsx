import React from 'react'

// Search bar with responsive placeholder and orange search button
export default function SearchBar({ value, onChange, onSubmit, onBlur, className = '' }) {
  const [ph, setPh] = React.useState('Buscar de todo en naranja Autoservicio')

  React.useEffect(() => {
    const set = () => {
      if (window.innerWidth < 640) setPh('Buscar todo')
      else setPh('Buscar de todo en naranja Autoservicio')
    }
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  const submit = (e) => {
    e?.preventDefault?.()
    onSubmit?.()
  }

  return (
    <form onSubmit={submit} className={["relative", className].join(' ')}>
      {/* Input con modo claro/oscuro y foco naranja */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={ph}
        className={[
          'w-full h-12 rounded-xl pl-3 pr-12 shadow-sm',
          // Light mode
          'bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300',
          // Dark mode: mismo color que navbar
          'dark:bg-[#020617] dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-gray-800',
          // Focus ring naranja
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
          'transition-colors duration-200',
        ].join(' ')}
        aria-label="Buscar"
      />

      {/* Botón lupita a la derecha */}
      <button
        type="submit"
        aria-label="Buscar"
        className={[
          'absolute top-1 right-1 h-10 w-10 rounded-md flex items-center justify-center',
          'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
          'text-white shadow-sm',
          'transition-colors',
        ].join(' ')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <path d="M21 21l-6 -6" />
        </svg>
      </button>
    </form>
  )
}
