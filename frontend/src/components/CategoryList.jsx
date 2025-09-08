export default function CategoryList({ categories, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600 ${selected === null ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white dark:bg-[#020617] dark:text-gray-100'}`}
      >
        Todas
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600 ${selected === cat.id ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white dark:bg-[#020617] dark:text-gray-100'}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
