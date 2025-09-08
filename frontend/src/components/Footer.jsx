import React from 'react'
import { getSiteConfig } from '../api.js'

export default function Footer() {
  const [phone, setPhone] = React.useState('')
  const year = new Date().getFullYear()

  React.useEffect(() => {
    getSiteConfig()
      .then(cfg => {
        const env = (import.meta.env.VITE_WHATSAPP_PHONE || '').replace(/[^0-9+]/g, '')
        const cfgPhone = (cfg?.whatsapp_phone || '').replace(/[^0-9+]/g, '')
        setPhone(env || cfgPhone)
      })
      .catch(() => {
        const env = (import.meta.env.VITE_WHATSAPP_PHONE || '').replace(/[^0-9+]/g, '')
        setPhone(env)
      })
  }, [])

  const addr = 'Ordoñez 69, La Carlota, Córdoba'

  return (
    <footer className="mt-auto border-t border-orange-600 dark:border-orange-600 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-sm">
      {/* Contenedor centrado */}
      <div className="max-w-3xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center text-center md:text-left">
        {/* Redes sociales a la izquierda */}
        <div className="flex gap-4 justify-center md:justify-start">
          <a
            href="https://www.instagram.com/naranja.autoservicio/?igsh=MWYydDF5dDdmMHIxbQ%3D%3D#"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-orange-600 dark:text-slate-200 dark:hover:text-orange-500 transition-colors"
          >
            <span className="text-orange-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
                <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                <path d="M16.5 7.5v.01" />
              </svg>
            </span>
            <span className="text-sm">Instagram</span>
          </a>

          <a
            href={phone ? `https://wa.me/${phone}` : '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-orange-600 dark:text-slate-200 dark:hover:text-orange-500 transition-colors"
          >
            <span className="text-orange-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                <path d="M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0 -1h-1a.5.5 0 0 0 0 1" />
              </svg>
            </span>
            <span className="text-sm">WhatsApp</span>
          </a>
        </div>

        {/* Dirección a la derecha */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center md:justify-end gap-2 text-slate-700 hover:text-orange-600 dark:text-slate-200 dark:hover:text-orange-500 transition-colors"
          aria-label={`Abrir ubicación en Google Maps: ${addr}`}
          title={addr}
        >
          <span className="text-orange-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
            </svg>
          </span>
          <span className="text-sm">{addr}</span>
        </a>
      </div>

      {/* Derechos reservados */}
      <div className="mt-2 mb-8 text-center text-sm text-slate-600 dark:text-slate-300">
        {/* Mobile: dos líneas */}
        <div className="md:hidden">
          <div className="font-semibold">© {year} Naranja Autoservicio.</div>
          <div>Todos los derechos reservados.</div>
        </div>

        {/* Desktop: una sola línea */}
        <div className="hidden md:flex items-center justify-center gap-2">
          <span className="font-semibold">© {year} Naranja Autoservicio.</span>
          <span aria-hidden className="select-none">•</span>
          <span>Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  )
}
