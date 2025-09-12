import React from 'react'

export default function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center items-center py-10 ${className}`}>
      <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
