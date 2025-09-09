import React, { useEffect, useState, forwardRef } from 'react'

function QuantityStepper({ value = 1, onDecrement, onIncrement, onSet, className = '' }, ref) {
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
        className="col-span-1 py-2 hover:opacity-90 focus:outline-none"
        aria-label="Disminuir"
      >
        −
      </button>
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={0}
        step={1}
        value={inner}
        onChange={(e) => {
          const raw = e.target.value
          if (/^\d*$/.test(raw)) {
            setInner(raw)
            if (raw !== '') {
              const v = parseInt(raw, 10)
              onSet?.(v)
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
        className="col-span-1 py-2 hover:opacity-90 focus:outline-none"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  )
}

export default forwardRef(QuantityStepper)
