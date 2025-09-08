import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCategories, getProducts } from '../api.js'
// import CategoryList from '../components/CategoryList.jsx'
import CategoryDropdown from '../components/CategoryDropdown.jsx'
import SortDropdown from '../components/SortDropdown.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBar from '../components/SearchBar.jsx'

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [category, setCategory] = useState(null)
  const [sort, setSort] = useState('relevance')
  
  // Cerrar con tecla Escape cuando el panel está abierto
  useEffect(() => {
    if (!overlayOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setOverlayOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [overlayOpen])

  useEffect(() => {
    Promise.all([getCategories(), getProducts({})])
      .then(([cats, prods]) => {
        setCategories(cats)
        setProducts(prods)
      })
      .catch(() => setError('No se pudo cargar el catálogo'))
      .finally(() => setLoading(false))
  }, [])

  // Resetear buscador al venir desde el logo del navbar
  useEffect(() => {
    if (location.state && location.state.resetSearch) {
      setSearch('')
      setQuery('')
      setCategory(null)
      setOverlayOpen(false)
      // limpiar el state para no repetir al navegar dentro del Home
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state])

  const filtered = useMemo(() => {
    let list = products
    if (category) list = list.filter(p => p.category && p.category.id === category)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }
    // Ordenamientos
    const priceOf = (p) => Number(p.offer_price ?? p.price ?? 0)
    const hasDiscount = (p) => p.offer_price && Number(p.offer_price) < Number(p.price)
    const created = (p) => new Date(p.created_at || 0).getTime() || Number(p.id || 0)
    const byName = (p) => (p.name || '').toLowerCase()
    switch (sort) {
      case 'recent':
        list = [...list].sort((a,b) => created(b) - created(a)); break
      case 'discount':
        list = [...list].sort((a,b) => Number(hasDiscount(b)) - Number(hasDiscount(a))); break
      case 'price_high':
        list = [...list].sort((a,b) => priceOf(b) - priceOf(a)); break
      case 'price_low':
        list = [...list].sort((a,b) => priceOf(a) - priceOf(b)); break
      case 'name_az':
        list = [...list].sort((a,b) => byName(a).localeCompare(byName(b))); break
      case 'name_za':
        list = [...list].sort((a,b) => byName(b).localeCompare(byName(a))); break
      default:
        // relevance: keep API order
        break
    }
    // Siempre: productos con stock primero, sin stock al final, conservando el orden
    const withStock = list.filter(p => Number(p.stock ?? 0) > 0)
    const withoutStock = list.filter(p => Number(p.stock ?? 0) <= 0)
    return [...withStock, ...withoutStock]
  }, [products, query, category, sort])

  if (loading) return <div>Cargando...</div>
  if (error) return <div className="text-red-600">{error}</div>

  const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
  const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

  //

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative">
        <div className="w-full sm:w-96">
          <SearchBar
            value={search}
            onChange={e => { setSearch(e.target.value); setOverlayOpen(true) }}
            onSubmit={() => { setQuery(search); setOverlayOpen(false) }}
            onBlur={() => setOverlayOpen(false)}
          />
        </div>
        <div className="ml-auto w-full sm:w-auto flex items-stretch gap-2">
          <CategoryDropdown className="flex-1" categories={categories} selected={category} onSelect={setCategory} />
          <SortDropdown className="flex-1" value={sort} onChange={setSort} />
        </div>

        {/* Overlay de sugerencias mientras se escribe */}
        <AnimatePresence>
        {search && search !== query && overlayOpen && (
          <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOverlayOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-3 w-full z-50 pointer-events-auto rounded-xl border border-orange-600 bg-white/70 dark:bg-[#020617]/80 backdrop-blur shadow-xl p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Columna sugerencias */}
              <div>
                <div className="text-xl font-bold text-orange-600 mb-2">Sugerencias</div>
                <ul className="space-y-1">
                  {categories
                    .filter(c => c.name?.toLowerCase()?.includes(search.toLowerCase()))
                    .slice(0, 8)
                    .map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="text-left w-full px-2 py-1 rounded hover:bg-orange-50 dark:hover:bg-orange-500/10"
                          onMouseDown={(e) => { e.preventDefault(); setSearch(c.name); setQuery(c.name); setOverlayOpen(false) }}
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
                        </button>
                      </li>
                    ))}
                  {categories.filter(c => c.name?.toLowerCase()?.includes(search.toLowerCase())).length === 0 && (
                    <li className="text-slate-500">Sin sugerencias</li>
                  )}
                </ul>
              </div>

              {/* Columna productos de vista previa */}
              <div className="md:col-span-2">
                <div className="text-xl font-bold text-orange-600 mb-2">Productos para "{search}"</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {products
                    .filter(p => (p.name + ' ' + (p.description || '')).toLowerCase().includes(search.toLowerCase()))
                    .slice(0, 3)
                    .map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setSearch(p.name); setQuery(p.name); setOverlayOpen(false) }}
                        className="text-left rounded-lg border border-orange-600/40 bg-white dark:bg-[#020617] p-2 hover:shadow-md hover:border-orange-600 transition"
                      >
                        <div className="aspect-[4/3] rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
                          {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="text-sm font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">${Number(p.offer_price ?? p.price).toFixed(2)}</div>
                      </button>
                    ))}
                  {products.filter(p => (p.name + ' ' + (p.description || '')).toLowerCase().includes(search.toLowerCase())).length === 0 && (
                    <div className="col-span-full text-slate-500">Escribe para ver coincidencias…</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          </>
        )}
        </AnimatePresence>
      </div>

      <motion.div variants={listVariants} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 items-stretch">
        {filtered.map(p => (
          <motion.div key={p.id} variants={itemVariants} className="h-full">
            <ProductCard product={p} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full">
            <div className="rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-white/70 dark:bg-[#020617]/60 backdrop-blur p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-center">
                <div className="flex justify-center md:justify-start">
                  <img src="/searchNone.png" alt="Sin resultados" className="w-64 md:w-72 h-auto select-none" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-orange-600 mb-3">
                    No encontramos productos que coincidan con tu búsqueda
                  </h3>
                  <ul className="space-y-2 text-slate-700 dark:text-slate-200">
                    {[
                      'Verificá la ortografía',
                      'Intentá utilizar una sola palabra',
                      'Probá con nombres de categorías',
                      'Escribí sinónimos'
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-600 translate-y-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M9 11l3 3l8 -8" />
                            <path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" />
                          </svg>
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
