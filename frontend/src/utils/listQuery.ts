export type SortOrder = 'ascend' | 'descend'

export type TableQuery = {
  search: string
  page: number
  pageSize: number
  sortField?: string
  sortOrder?: SortOrder
}

export type TableChange = {
  page: number
  pageSize: number
  sortField?: string
  sortOrder?: SortOrder
}

export type ListParams = {
  limit: number
  offset: number
  q?: string
  sort: string
  order: 'asc' | 'desc'
}

export function toListParams(query: TableQuery, defaultSort: string): ListParams {
  return {
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
    q: query.search || undefined,
    sort: query.sortField ?? defaultSort,
    order: query.sortOrder === 'descend' ? 'desc' : 'asc',
  }
}

export function toQueryString(params: ListParams): string {
  const search = new URLSearchParams()
  search.set('limit', String(params.limit))
  search.set('offset', String(params.offset))
  search.set('sort', params.sort)
  search.set('order', params.order)
  if (params.q) search.set('q', params.q)
  return search.toString()
}
