import { useEffect, useState } from 'react'
import type { SortOrder, TableChange, TableQuery } from '@/utils/listQuery'

export function useTableQuery(defaultSort: string, defaultOrder: SortOrder = 'ascend') {
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortField, setSortField] = useState(defaultSort)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder)

  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const [seenSearch, setSeenSearch] = useState(appliedSearch)
  const pageForQuery = appliedSearch === seenSearch ? page : 1
  if (appliedSearch !== seenSearch) {
    setSeenSearch(appliedSearch)
    setPage(1)
  }

  function onChange(change: TableChange) {
    const nextField = change.sortField ?? defaultSort
    const nextOrder = change.sortOrder ?? defaultOrder
    const sizeChanged = change.pageSize !== pageSize
    const sortChanged = nextField !== sortField || nextOrder !== sortOrder
    setPageSize(change.pageSize)
    setPage(sizeChanged || sortChanged ? 1 : change.page)
    setSortField(nextField)
    setSortOrder(nextOrder)
  }

  const query: TableQuery = {
    search: appliedSearch,
    page: pageForQuery,
    pageSize,
    sortField,
    sortOrder,
  }

  return { search, onSearch: setSearch, onChange, query }
}
