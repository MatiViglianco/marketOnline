import React, { useEffect, useState, forwardRef } from 'react'

function QuantityStepper({ value = 1, min = 1, max = Infinity, onDecrement, onIncrement, onSet, className = '' }, ref) {
  const [inner, setInner] = useState(String(value))
  useEffect(() => { setInner(String(value)) }, [value])

  return (
    <div
      className={[
        'grid grid-cols-3 items-stretch overflow-hidden rounded-md w-full',
        // Borde exterior naranja más fino
        'border border-orange-600',
        'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md',
        className,
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        className={["col-span-1 py-2 focus:outline-none", value <= min ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"].join(' ')}
        aria-label="Disminuir"
      >
        −
      </button>
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        step={1}
        value={inner}
        onChange={(e) => {
          const raw = e.target.value
          if (/^\d*$/.test(raw)) {
            setInner(raw)
            if (raw !== '') {
              let v = parseInt(raw, 10)
              if (v < min) v = min
              if (v > max) v = max
              onSet?.(v)
              if (v !== parseInt(raw, 10)) setInner(String(v))
            }
          }
        }}
        onBlur={() => { if (inner === '') setInner(String(value)) }}
        className="quantity-input col-span-1 py-2 bg-white text-orange-600 font-semibold text-center outline-none w-full border border-orange-600"
        aria-label="Cantidad"
      />
      <button
        type="button"
        onClick={onIncrement}
        disabled={value >= max}
        className={["col-span-1 py-2 focus:outline-none", value >= max ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"].join(' ')}
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  )
}

export default forwardRef(QuantityStepper)
