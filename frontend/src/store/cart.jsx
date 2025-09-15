import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const CartContext = createContext(null)
const KEY = 'cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const add = (product, quantity = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.product.id === product.id)
      if (idx >= 0) {
        const copy = [...prev]
        const nextQty = Math.min((copy[idx].quantity + quantity), Number(product.stock ?? Infinity))
        if (nextQty === copy[idx].quantity) {
          toast.error(`Stock insuficiente para ${product.name}`)
          return copy
        }
        copy[idx] = { ...copy[idx], quantity: nextQty }
        toast.success(`Agregado: ${product.name}`)
        return copy
      }
      const initialQty = Math.min(quantity, Number(product.stock ?? Infinity))
      if (initialQty <= 0) { toast.error(`Sin stock para ${product.name}`); return prev }
      toast.success(`Agregado: ${product.name}`)
      return [...prev, { product, quantity: initialQty }]
    })
  }

  const remove = (productId) => {
    setItems(prev => prev.filter(p => p.product.id !== productId))
    toast.info('Producto eliminado del carrito')
  }

  const setQty = (productId, quantity) => {
    setItems(prev => prev.map(p => {
      if (p.product.id !== productId) return p
      const max = Number(p.product.stock ?? Infinity)
      const next = Math.max(1, Math.min(quantity, max))
      if (next < quantity) toast.error(`Stock máximo: ${max}`)
      return { ...p, quantity: next }
    }))
  }

  const clear = () => { setItems([]); toast.warning('Carrito vaciado') }

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + Number((it.product.offer_price ?? it.product.price)) * it.quantity, 0),
    [items]
  )
  const count = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items])

  useEffect(() => {
    const originalTitle = 'Naranja Autoservicio'
    let interval
    const handleVisibility = () => {
      clearInterval(interval)
      if (document.hidden && count > 0) {
        document.title = '¡Volvé por tu carrito!'
        let showCartTitle = false
        interval = setInterval(() => {
          document.title = showCartTitle ? '¡Volvé por tu carrito!' : originalTitle
          showCartTitle = !showCartTitle
        }, 5000)
      } else {
        document.title = originalTitle
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    handleVisibility()
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
      document.title = originalTitle
    }
  }, [count])

  const value = { items, add, remove, setQty, clear, subtotal, count }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}

