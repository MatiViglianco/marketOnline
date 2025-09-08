// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '../store/cart.jsx'
import { createOrder, getSiteConfig, validateCoupon } from '../api.js'
import { toast } from 'sonner'
import ButtonAnimatedGradient from '../components/ui/ButtonAnimatedGradient.jsx'

export default function Checkout() {
  const { items, setQty, remove, clear, subtotal } = useCart()

  // Config & form
  const [cfg, setCfg] = useState({ whatsapp_phone: '', alias_or_cbu: '', shipping_cost: 0 })
  const [form, setForm] = useState({
    name: '', phone: '', address: '', notes: '',
    payment_method: 'cash', delivery_method: 'delivery'
  })
  const [loading, setLoading] = useState(false)

  // Cupón
  const [coupon, setCoupon] = useState('')
  const [couponInfo, setCouponInfo] = useState(null)
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState(false)

  // Modal transferencia
  const [showTransferModal, setShowTransferModal] = useState(false)

  useEffect(() => { getSiteConfig().then(setCfg).catch(() => {}) }, [])

  const effectiveShipping = useMemo(() => {
    if (form.delivery_method === 'pickup') return 0
    if (couponInfo?.valid && couponInfo.type === 'free_shipping' && subtotal >= Number(couponInfo.min_subtotal || 0)) return 0
    return Number(cfg.shipping_cost || 0)
  }, [form.delivery_method, couponInfo, subtotal, cfg])

  const estDiscount = useMemo(() => {
    if (!couponInfo?.valid) return 0
    if (subtotal < Number(couponInfo.min_subtotal || 0)) return 0
    if (couponInfo.type === 'fixed') return Math.min(Number(couponInfo.amount || 0), subtotal)
    if (couponInfo.type === 'percent') {
      const raw = subtotal * (Number(couponInfo.percent || 0) / 100)
      const cap = Number(couponInfo.percent_cap || 0)
      return cap > 0 ? Math.min(raw, cap) : raw
    }
    return 0
  }, [couponInfo, subtotal])

  const estTotal = useMemo(
    () => Math.max(0, subtotal - estDiscount + effectiveShipping),
    [subtotal, estDiscount, effectiveShipping]
  )

  // Desglose de descuentos
  const productSavingsLines = useMemo(() => {
    return items.flatMap(it => {
      const price = Number(it.product.price ?? 0)
      const offer = Number(it.product.offer_price ?? price)
      const diff = Math.max(0, price - offer) * Number(it.quantity ?? 0)
      if (diff <= 0) return []
      const name = String(it.product.name || 'Producto')
      const short = name.length > 34 ? name.slice(0, 31) + '…' : name
      return [{ label: short, amount: diff }]
    })
  }, [items])

  const shippingSavingsLine = useMemo(() => {
    const freeShip = couponInfo?.valid && couponInfo.type === 'free_shipping' && subtotal >= Number(couponInfo.min_subtotal || 0)
    if (form.delivery_method === 'delivery' && freeShip && Number(cfg.shipping_cost || 0) > 0) {
      return { label: 'Cupón: Envío gratis', amount: Number(cfg.shipping_cost || 0) }
    }
    return null
  }, [couponInfo, form.delivery_method, subtotal, cfg])

  const couponSavingsLine = useMemo(() => {
    if (estDiscount <= 0) return null
    if (couponInfo?.type === 'percent') return { label: `${Number(couponInfo.percent || 0)}% OFF${couponInfo?.name ? ` · ${couponInfo.name}` : ''}`, amount: estDiscount }
    return { label: `Cupón${couponInfo?.name ? ` · ${couponInfo.name}` : ''}`, amount: estDiscount }
  }, [estDiscount, couponInfo])

  // Fix de textos rotos (mojibake) y placeholders
  const rootRef = useRef(null)
  useEffect(() => {
    const fixes = new Map([
      ['Tu carrito estǭ vac��o', 'Tu carrito está vacío'],
      ['TelǸfono', 'Teléfono'],
      ['Direcci��n', 'Dirección'],
      ['Ubicaci��n', 'Ubicación'],
      ['Env��o', 'Envío'],
      ['Cup��n', 'Cupón'],
      ['Cup��n de descuento', 'Cupón de descuento'],
      ['��Hola!', '¡Hola!'],
      ['abri��', 'abrirá'],
      ['Ordo��ez', 'Ordoñez'],
      ['C��rdoba', 'Córdoba'],
    ])
    const el = rootRef.current
    if (!el) return
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    nodes.forEach(n => {
      let t = n.nodeValue, changed = false
      fixes.forEach((v, k) => { if (t.includes(k)) { t = t.replaceAll(k, v); changed = true } })
      if (changed) n.nodeValue = t
    })
    el.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(inp => {
      const ph = inp.getAttribute('placeholder') || ''
      const fixed = ph.replace('TelǸfono','Teléfono').replace('Direcci��n','Dirección').replace('Cup��n de descuento','Cupón de descuento')
      if (fixed !== ph) inp.setAttribute('placeholder', fixed)
    })
  }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const formatArs = (v) => Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

  // ===== Cantidad editable =====
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
  const handleQtyInput = (productId, raw, max) => {
    if (raw === '') return setQty(productId, '')
    const val = Number.parseInt(raw, 10)
    if (Number.isNaN(val)) return
    setQty(productId, clamp(val, 1, max))
  }
  const handleQtyBlur = (productId, current, max) => {
    const val = Number.parseInt(current, 10)
    const normalized = Number.isNaN(val) ? 1 : clamp(val, 1, max)
    setQty(productId, normalized)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (items.length === 0) { toast.error('Tu carrito está vacío.'); throw new Error('carrito vacío') }

      const payload = {
        name: form.name,
        phone: form.phone,
        address: form.delivery_method === 'pickup' ? '' : form.address,
        notes: form.notes,
        payment_method: form.payment_method,
        delivery_method: form.delivery_method,
        items: items.map(it => ({ product_id: it.product.id, quantity: Number(it.quantity || 1) }))
      }
      const order = await createOrder({ ...payload, coupon_code: coupon })

      const phone = (import.meta.env.VITE_WHATSAPP_PHONE || cfg.whatsapp_phone || '').replace(/[^0-9+]/g, '')
      const tienda = 'Naranja autoservicio'
      const fecha = new Date(order.created_at || Date.now()).toLocaleString('es-AR', { hour12: false })
      const paymentLabel = order.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'
      const deliveryLabel = (order.delivery_method || form.delivery_method) === 'pickup' ? 'Retiro' : 'Delivery'
      const shopAddress = 'Ordoñez 69, La Carlota, Córdoba'
      const userAddress = form.address || order.address || ''
      const mapsLink = deliveryLabel === 'Delivery'
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(userAddress)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopAddress)}`

      const lines = [
        '¡Hola! Te paso el resumen de mi pedido', '',
        `Pedido: #${order.id}`, `Tienda: ${tienda}`, `Fecha: ${fecha}`, `Nombre: ${order.name}`, `Teléfono: ${order.phone}`, '',
        `Forma de pago: ${paymentLabel}`, `Total: ${formatArs(order.total)}`, '',
        `Entrega: ${deliveryLabel}`,
        ...(deliveryLabel === 'Delivery' && userAddress ? [`Dirección: ${userAddress}`] : []),
        ...(deliveryLabel === 'Retiro' ? [`Retiro: ${shopAddress}`] : []),
        `Ubicación: ${mapsLink}`, '',
        'Mi pedido es',
        ...items.map(it => `${it.quantity}x ${it.product.name}: ${formatArs(Number(it.product.price) * Number(it.quantity || 1))}`),
        '', `Subtotal: ${formatArs(items.reduce((a,it)=>a+Number((it.product.offer_price ?? it.product.price))*Number(it.quantity||1),0))}`
      ]

      if ((order.payment_method || form.payment_method) === 'transfer') {
        setShowTransferModal(true)
      }
      if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')

      clear()
      toast.success('¡Pedido enviado por WhatsApp!')
    } catch {
      toast.error('No pudimos crear el pedido. Revisá los datos e intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async () => {
    setCouponMessage(''); setCouponInfo(null); setCouponError(false)
    if (!coupon.trim()) return
    try {
      const info = await validateCoupon(coupon.trim())
      setCouponInfo(info)
      if (!info.valid) { setCouponError(true); setCouponMessage('Cupón inválido') }
      else if (subtotal < Number(info.min_subtotal || 0)) { setCouponError(true); setCouponMessage(`Monto mínimo: ${formatArs(Number(info.min_subtotal || 0))}`) }
      else { setCouponMessage('Cupón aplicado') }
    } catch {
      setCouponError(true); setCouponMessage('No se pudo validar el cupón')
    }
  }

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(cfg.alias_or_cbu || '')
      toast.success('Datos de transferencia copiados')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  // Grid de filas del carrito (desktop)
  const GRID = 'md:grid-cols-[56px_1fr_110px_140px_120px_36px]'

  // Toggle pill (switch)
  const TogglePill = ({ options = [], value, onChange }) => (
    <div className="inline-flex items-center gap-1 rounded-full border border-orange-600 p-1 bg-white dark:bg-[#020617] shadow-sm transition-colors">
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'px-3 py-1 rounded-full text-sm transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-200 hover:text-orange-600 hover:bg-orange-500/10'
            ].join(' ')}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )

  // Control de cantidad
  const QtyControl = ({ it, max }) => (
  <div
    className="
      rounded-md
      inline-flex items-stretch overflow-hidden
      rounded-none                                   /* <-- cuadrado */
      border border-orange-600
      bg-white dark:bg-transparent
      shadow-sm
    "
  >
    <button
      aria-label="Disminuir"
      disabled={Number(it.quantity || 1) <= 1}
      onClick={() =>
        Number(it.quantity || 1) > 1 &&
        setQty(it.product.id, Number(it.quantity || 1) - 1)
      }
      className="
        px-4 h-9 text-white bg-orange-600 hover:bg-orange-700
        disabled:opacity-40 disabled:cursor-not-allowed
        rounded-none                                  /* <-- cuadrado */
      "
    >
      −
    </button>

    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={isFinite(max) ? max : undefined}
      value={String(it.quantity ?? 1)}
      onChange={(e) =>
        handleQtyInput(
          it.product.id,
          e.target.value,
          isFinite(max) ? max : 999999
        )
      }
      onBlur={(e) =>
        handleQtyBlur(
          it.product.id,
          e.target.value,
          isFinite(max) ? max : 999999
        )
      }
      className="
        w-12 h-9 text-center font-semibold outline-none
        border-x border-orange-600 bg-white text-slate-900
        dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100
        appearance-none [appearance:textfield] [-moz-appearance:textfield]
        [&::-webkit-outer-spin-button]:appearance-none
        [&::-webkit-inner-spin-button]:appearance-none
        rounded-none                                  /* <-- cuadrado */
      "
    />

    <button
      aria-label="Aumentar"
      disabled={isFinite(max) && Number(it.quantity || 1) >= max}
      onClick={() =>
        (!isFinite(max) || Number(it.quantity || 1) < max) &&
        setQty(it.product.id, Number(it.quantity || 1) + 1)
      }
      className="
        px-4 h-9 text-white bg-orange-600 hover:bg-orange-700
        disabled:opacity-40 disabled:cursor-not-allowed
        rounded-none                                  /* <-- cuadrado */
      "
    >
      +
    </button>
  </div>
)
  return (
    <div ref={rootRef} className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
      {/* IZQUIERDA: Carrito */}
      <div className="
        md:col-span-1 rounded-2xl p-4
        bg-white border border-slate-200 shadow-sm
        dark:bg-transparent dark:border-slate-700/60
        dark:shadow-[0_0_0_1px_rgba(148,163,184,0.28),0_20px_40px_-20px_rgba(0,0,0,0.65)]
      ">
        <h3 className="text-2xl md:text-3xl font-extrabold text-center text-orange-600 mb-4 tracking-tight">
          Carrito
        </h3>

        {items.length > 0 && (
          <>
            <div className={`hidden md:grid ${GRID} text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 px-2`}>
              <div /> <div className="text-left">Producto</div>
              <div className="text-center">Precio</div>
              <div className="text-center">Cantidad</div>
              <div className="text-right">Total</div>
              <div />
            </div>
            <hr className="hidden md:block my-2 border-slate-200 dark:border-slate-700/40" />
          </>
        )}

        {/* Filas o empty state */}
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="
              my-4 rounded-xl border border-slate-200 p-10 text-center bg-white shadow-sm
              dark:bg-transparent dark:border-slate-700/60
              dark:shadow-[0_0_0_1px_rgba(148,163,184,0.28),0_20px_40px_-20px_rgba(0,0,0,0.65)]
            ">
              <h4 className="text-2xl md:text-3xl font-extrabold text-orange-600 mb-2">Su carrito está vacío</h4>
              <p className="text-slate-600 dark:text-slate-300 mb-6">No tenés artículos en tu carrito de compras.</p>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                CONTINUAR COMPRANDO
              </button>
            </div>
          )}

          {items.map(it => {
            const price = Number(it.product.price)
            const offer = Number(it.product.offer_price ?? price)
            const unit = offer < price ? offer : price
            const lineTotal = unit * Number(it.quantity || 1)
            const hasOffer = offer < price
            const max = Number(it.product.stock ?? Infinity)

            return (
              <div key={it.product.id} className="
                bg-white border border-slate-200 rounded-xl px-3 py-3 overflow-hidden shadow-sm
                dark:bg-transparent dark:border-slate-700/40
              ">
                <div className={`md:grid ${GRID} md:items-center md:gap-3 flex flex-col gap-2`}>
                  {/* Imagen + nombre */}
                  <div className="flex items-center gap-3 min-w-0 col-span-2">
                    {it.product.image && <img src={it.product.image} alt={it.product.name} className="w-10 h-10 md:w-12 md:h-12 object-cover rounded" />}
                    <div className="min-w-0">
                      <div className="font-medium text-sm md:text-base truncate" title={it.product.name}>{it.product.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Stock: {Number(it.product.stock ?? 0)}</div>
                    </div>
                  </div>

                  {/* Precio (solo desktop) */}
                  <div className="hidden md:block text-center font-semibold text-[15px] md:text-[16px] text-gray-700 dark:text-gray-100 whitespace-nowrap">
                    {hasOffer ? (
                      <div>
                        <div className="text-xs text-slate-400 line-through">{formatArs(price)}</div>
                        <div className="font-semibold text-orange-600">{formatArs(offer)}</div>
                      </div>
                    ) : (
                      <span className="text-orange-600">{formatArs(price)}</span>
                    )}
                  </div>

                  {/* Cantidad (desktop) */}
                  <div className="hidden md:flex items-center justify-center">
                    <QtyControl it={it} max={max} />
                  </div>

                  {/* Total por ítem (desktop) */}
                  <div className="hidden md:flex items-center justify-end whitespace-nowrap">
                    <span className="truncate text-[15px] md:text-[16px] text-orange-600">{formatArs(lineTotal)}</span>
                  </div>

                  {/* Eliminar (desktop) */}
                  <div className="hidden md:flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => remove(it.product.id)}
                      className="text-orange-600 hover:text-orange-700"
                      aria-label="Eliminar ítem"
                      title="Eliminar ítem"
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
                  </div>

                  {/* ===== MOBILE: SOLO cantidad | total + eliminar ===== */}
                  <div className="md:hidden grid grid-cols-2 gap-2 w-full">
                    {/* Cantidad */}
                    <div className="flex items-center justify-center">
                      <QtyControl it={it} max={max} />
                    </div>
                    {/* Total + eliminar */}
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-[15px] md:text-[16px] text-orange-600">{formatArs(lineTotal)}</span>
                      <button onClick={() => remove(it.product.id)} className="text-orange-600 hover:text-orange-700" aria-label="Eliminar ítem" title="Eliminar ítem">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
                  {/* ===== FIN MOBILE ===== */}
                </div>

                {/* Alerta máximo */}
                {isFinite(max) && Number(it.quantity||1) >= max && (
                  <div className="mt-2 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-xs md:text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z" />
                    </svg>
                    <span>Cantidad máxima permitida</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Vaciar carrito */}
        {items.length > 0 && (
          <div className="flex justify-end items-center gap-2 pt-3">
            <button
              type="button"
              onClick={clear}
              className="text-orange-600 hover:text-orange-700 font-semibold uppercase text-sm flex items-center gap-2"
            >
              <span>VACIAR EL CARRITO</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 7l16 0" />
                <path d="M10 11l0 6" />
                <path d="M14 11l0 6" />
                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
              </svg>
            </button>
          </div>
        )}

        {/* Resumen de la compra */}
        <div className="
          mt-5 rounded-2xl p-5
          bg-slate-50/60 border border-slate-200
          dark:bg-transparent dark:border-slate-700/60
          dark:shadow-[0_0_0_1px_rgba(148,163,184,0.22)]
        ">
          <h4 className="text-2xl md:text-3xl font-extrabold text-center text-orange-600 mb-4 tracking-tight">
            Resumen de la compra
          </h4>

          <div className="grid grid-cols-2 items-center text-base md:text-lg px-2 py-1">
            <span className="text-slate-700 dark:text-slate-200">Subtotal</span>
            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{formatArs(subtotal)}</span>
          </div>

          <div className="grid grid-cols-2 items-center text-base md:text-lg px-2 py-1">
            <span className="text-slate-700 dark:text-slate-200">Envío</span>
            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{effectiveShipping === 0 ? '$ 0,00' : formatArs(effectiveShipping)}</span>
          </div>

          {/* Descuentos */}
          <div className="mt-3 space-y-1 px-2">
            {productSavingsLines.map((d, i) => (
              <div key={`prod-disc-${i}`} className="grid grid-cols-2 items-center">
                <span className="font-bold text-red-700 uppercase text-sm md:text-base truncate">{d.label}</span>
                <span className="text-right font-bold text-red-700">-{formatArs(d.amount)}</span>
              </div>
            ))}
            {couponSavingsLine && (
              <div className="grid grid-cols-2 items-center">
                <span className="font-bold text-red-700 uppercase text-sm md:text-base truncate">{couponSavingsLine.label}</span>
                <span className="text-right font-bold text-red-700">-{formatArs(couponSavingsLine.amount)}</span>
              </div>
            )}
            {shippingSavingsLine && (
              <div className="grid grid-cols-2 items-center">
                <span className="font-bold text-red-700 uppercase text-sm md:text-base truncate">{shippingSavingsLine.label}</span>
                <span className="text-right font-bold text-red-700">-{formatArs(shippingSavingsLine.amount)}</span>
              </div>
            )}
          </div>

          {/* TOTAL */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/40 px-2">
            <div className="grid grid-cols-2 items-center">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Total</span>
              <span className="text-right text-2xl font-extrabold text-slate-900 dark:text-slate-100">{formatArs(estTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DERECHA: Finalizar compra */}
      <div className="md:col-span-1 md:sticky md:top-6 h-fit">
        <div className="
          space-y-4 rounded-2xl p-4
          bg-white border border-slate-200 shadow-sm
          dark:bg-transparent dark:border-slate-700/60
          dark:shadow-[0_0_0_1px_rgba(148,163,184,0.28),0_20px_40px_-20px_rgba(0,0,0,0.65)]
        ">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-orange-600 mb-4 tracking-tight">
            Finalizar compra
          </h2>

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="name" value={form.name} onChange={onChange} className="border rounded px-3 py-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="Nombre" required />
              <input name="phone" value={form.phone} onChange={onChange} className="border rounded px-3 py-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="Teléfono" required />
            </div>
            <input name="address" value={form.address} onChange={onChange} className="border rounded px-3 py-2 w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="Dirección" disabled={form.delivery_method==='pickup'} required={form.delivery_method!=='pickup'} />
            <textarea name="notes" value={form.notes} onChange={onChange} className="border rounded px-3 py-2 w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" placeholder="Notas (opcional)" />

            <div className="flex items-center gap-4">
              <TogglePill
                value={form.payment_method}
                onChange={(v) => setForm(prev => ({ ...prev, payment_method: v }))}
                options={[
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'transfer', label: 'Transferencia' }
                ]}
              />
            </div>
            <div className="flex items-center gap-4">
              <TogglePill
                value={form.delivery_method}
                onChange={(v) => setForm(prev => ({ ...prev, delivery_method: v }))}
                options={[
                  { value: 'delivery', label: 'Envío a domicilio' },
                  { value: 'pickup', label: 'Retiro en tienda' }
                ]}
              />
            </div>

            <ButtonAnimatedGradient disabled={loading}>
              {loading ? 'Enviando...' : 'Confirmar pedido y abrir WhatsApp'}
            </ButtonAnimatedGradient>

            {/* Cupón */}
            <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/80 dark:bg-orange-950/20 p-4 mt-2">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2c5.523 0 10 4.477 10 10a10 10 0 0 1 -20 0l.004 -.28c.148 -5.393 4.566 -9.72 9.996 -9.72m3 12.12a1 1 0 0 0 -1 1v.015a1 1 0 0 0 2 0v-.015a1 1 0 0 0 -1 -1m.707 -5.752a1 1 0 0 0 -1.414 0l-6 6a1 1 0 0 0 1.414 1.414l6 -6a1 1 0 0 0 0 -1.414m-6.707 -.263a1 1 0 0 0 -1 1v.015a1 1 0 1 0 2 0v-.015a1 1 0 0 0 -1 -1" /></svg>
                </span>
                <div>
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">¿Tenés cupones de descuento?</div>
                  <div className="text-base font-semibold text-slate-800 dark:text-slate-200">Ingresalos acá:</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  value={coupon}
                  onChange={e=>setCoupon(e.target.value)}
                  placeholder="Código"
                  className="border rounded px-3 py-2 flex-1 border-orange-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-orange-800 dark:bg-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="px-4 py-2 rounded font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
                >
                  APLICAR
                </button>
              </div>

              {couponMessage && (
                <div className={`mt-2 text-xs ${couponError ? 'text-red-700' : 'text-green-700'}`}>{couponMessage}</div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* MODAL: datos de transferencia */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTransferModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Datos para transferencia</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                Usá estos datos para realizar tu pago por transferencia. Luego envianos el comprobante por WhatsApp.
              </p>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 mb-3">
                <pre className="whitespace-pre-wrap break-words text-sm text-slate-900 dark:text-slate-100">{cfg.alias_or_cbu || 'Sin datos configurados'}</pre>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={copyAlias}
                  className="px-4 py-2 rounded font-semibold text-white bg-orange-600 hover:bg-orange-700"
                >
                  Copiar datos
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded font-semibold border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
