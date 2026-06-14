import { useEffect, useMemo, useState } from 'react'

export function useClientPagination(items, { pageSize = 10, query = '', filterFn = null } = {}) {
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const list = items || []
    if (!query?.trim() || !filterFn) return list
    return list.filter((item) => filterFn(item, query.trim()))
  }, [items, query, filterFn])

  useEffect(() => {
    setPage(1)
  }, [query, items?.length, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1)
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  return {
    page: safePage,
    setPage,
    totalPages,
    totalItems: filtered.length,
    pageItems,
    pageSize,
    hasPagination: filtered.length > pageSize,
  }
}

export function normalizeSearchText(value = '') {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function matchStudentSearch(student, query) {
  const haystack = normalizeSearchText(
    `${student.first_name || student.firstName || ''} ${student.last_name || student.lastName || ''} ${student.email || ''} ${student.file_number || ''}`,
  )
  const q = normalizeSearchText(query)
  return q.split(/\s+/).filter(Boolean).every((part) => haystack.includes(part))
}
