import React from 'react'

export default function ErrorView({ message = 'Ocurrió un error' }) {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-600 mb-4"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-red-600 font-semibold">{message}</p>
    </div>
  )
}
