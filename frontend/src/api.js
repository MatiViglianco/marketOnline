const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function authFetch(url, options = {}) {
  const token = localStorage.getItem('authToken')
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Token ${token}`
  return fetch(url, { credentials: 'include', ...options, headers })
}

export async function getCategories() {
  const r = await authFetch(`${API_URL}/categories/`)
  if (!r.ok) throw new Error('Error al cargar categorías')
  return r.json()
}

export async function getProducts(params = {}) {
  const url = new URL(`${API_URL}/products/`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })
  const r = await authFetch(url)
  if (!r.ok) throw new Error('Error al cargar productos')
  return r.json()
}

export async function getSiteConfig() {
  const r = await authFetch(`${API_URL}/config/`)
  if (!r.ok) throw new Error('Error al cargar configuración')
  return r.json()
}

export async function createOrder(payload) {
  const r = await authFetch(`${API_URL}/orders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    let err
    try { err = await r.json() } catch { err = { detail: 'Error al crear pedido' } }
    throw new Error(err.detail || JSON.stringify(err))
  }
  return r.json()
}

export async function validateCoupon(code) {
  const url = new URL(`${API_URL}/coupons/validate/`)
  url.searchParams.set('code', code)
  const r = await authFetch(url)
  if (!r.ok) throw new Error('No se pudo validar el cupón')
  return r.json()
}

export async function getAnnouncements() {
  const r = await authFetch(`${API_URL}/announcements/`)
  if (!r.ok) throw new Error('Error al cargar anuncios')
  return r.json()
}
