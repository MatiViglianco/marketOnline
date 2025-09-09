import React from 'react'
import QuantityStepper from '../ui/QuantityStepper.jsx'

// Estructura de carrito agrupado por categoría.
// Props esperadas:
// - items: [{ product: {id, name, description, image, price, offer_price, category:{id,name}}, quantity }]
// - onInc(productId), onDec(productId), onRemove(productId)
// - onSetQty(productId, quantity)
// - alertMessages?: array de strings para mostrar debajo del listado
export default function CartGrouped({
  items = [],
  onInc = () => {},
  onDec = () => {},
  onRemove = () => {},
  onClear = () => {},
  onSetQty = () => {},
  alertMessages = [],
}) {
  // Agrupar por categoría (name como clave legible; si no hay categoría usa 'Sin categoría')
  const groups = React.useMemo(() => {
    const map = new Map()
    for (const it of items) {
      const cat = it?.product?.category?.name || 'Sin categoría'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(it)
    }
    return Array.from(map.entries()) // [ [catName, items[]], ... ]
  }, [items])

  const formatArs = (v) => Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

  return (
    <div className="space-y-6">
      {/* Encabezado (desktop) */}
      <div className="hidden md:grid md:grid-cols-[1fr_100px_140px_140px] text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 px-3">
        <div>Producto</div>
        <div className="text-center">Precio</div>
        <div className="text-center">Cantidad</div>
        <div className="text-center">Total</div>
      </div>
      <hr className="hidden md:block my-2 border-gray-200 dark:border-gray-700" />

      {/* Grupos por categoría */}
      {groups.map(([catName, groupItems]) => (
        <section key={catName} className="space-y-2">
          {/* Título de categoría + contador */}
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-100">{catName}</h4>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {groupItems.reduce((sum, it) => sum + Number(it.quantity || 0), 0)} ítem(s)
            </span>
          </div>

          {/* Items del grupo */}
          <div className="space-y-2">
            {groupItems.map(({ product, quantity }) => {
              const unit = Number(product.offer_price ?? product.price)
              const lineTotal = unit * quantity
              const hasOffer = product.offer_price && Number(product.offer_price) < Number(product.price)
              const max = Number(product.stock ?? Infinity)
              const percentOff = hasOffer ? Math.round((1 - unit / Number(product.price)) * 100) : 0

              return (
                <article
                  key={product.id}
                  className="relative bg-white dark:bg-[#020617] border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  {/* Desktop: grid de 4 columnas. Mobile: 2 filas */}
                  <div className="md:grid md:grid-cols-[1fr_100px_140px_140px] md:gap-3 flex flex-col gap-3">
                    {/* Columna Producto */}
                    <div className="flex items-start gap-3 min-w-0">
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="min-w-0">
                        {/* Promoción opcional */}
                        {hasOffer && (
                          <div className="text-[11px] font-semibold text-red-600">{percentOff}% OFF{isFinite(max) ? ` MAX ${max} UNIDADES` : ''}</div>
                        )}
                        <div className="font-medium text-sm md:text-base leading-tight truncate" title={product.name}>{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</div>
                        )}
                      </div>
                    </div>

                    {/* Precio unitario */}
                    <div className="hidden md:flex items-center justify-center font-semibold text-orange-600">
                      {hasOffer ? (
                        <div className="flex flex-col items-start md:items-center">
                          <span className="text-[11px] text-slate-400 line-through">{formatArs(product.price)}</span>
                          <span className="text-orange-600">{formatArs(unit)}</span>
                        </div>
                      ) : (
                        <span>{formatArs(unit)}</span>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="flex items-center justify-center">
                      <QuantityStepper
                        value={quantity}
                        onDecrement={() => quantity > 1 && onDec(product.id)}
                        onIncrement={() => quantity < max && onInc(product.id)}
                        onSet={(v) => onSetQty(product.id, v)}
                        className="h-9 md:h-10 w-28"
                      />
                    </div>
                    {/* Total + eliminar */}
                    <div className="flex items-center justify-end md:justify-between gap-2">
                      <button
                        onClick={() => onRemove(product.id)}
                        className="hidden md:inline-flex text-orange-600 hover:text-orange-700"
                        aria-label="Eliminar producto"
                        title="Eliminar producto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M4 7l16 0" />
                          <path d="M10 11l0 6" />
                          <path d="M14 11l0 6" />
                          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                        </svg>
                      </button>
                      <span className="font-semibold text-orange-600 whitespace-nowrap">{formatArs(lineTotal)}</span>
                    </div>

                    {isFinite(max) && quantity >= max && (
                      <div className="col-span-full mt-2 rounded-md border border-red-300 dark:border-red-500 bg-white dark:bg-[#020617] text-red-700 dark:text-red-300 px-3 py-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z" />
                        </svg>
                        <span className="text-xs md:text-sm font-semibold uppercase">CANTIDAD MÁXIMA PERMITIDA</span>
                      </div>
                    )}
                  </div>
                  {/* Botón eliminar mobile */}
                  <button
                    onClick={() => onRemove(product.id)}
                    className="md:hidden absolute top-2 left-2 text-orange-600 hover:text-orange-700"
                    aria-label="Eliminar producto"
                    title="Eliminar producto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M4 7l16 0" />
                      <path d="M10 11l0 6" />
                      <path d="M14 11l0 6" />
                      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      {/* Mensajes de alerta debajo del listado */}
      {alertMessages.length > 0 && (
        <div className="space-y-1">
          {alertMessages.map((m, idx) => (
            <div key={idx} className="text-xs md:text-sm text-red-600">{m}</div>
          ))}
        </div>
      )}

      {/* Acción final */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onClear}
          className="text-orange-600 hover:text-orange-700 font-semibold uppercase text-sm flex items-center gap-2"
        >
          <span>Vaciar el carrito</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 7l16 0" />
            <path d="M10 11l0 6" />
            <path d="M14 11l0 6" />
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
