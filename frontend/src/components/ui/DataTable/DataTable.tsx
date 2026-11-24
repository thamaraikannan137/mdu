import { Alert, Card, Empty, Input, Pagination, Select, Spin, Table } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { SortOrder, TableChange } from '@/utils/listQuery'

export type DataTableProps<T extends object> = {
  columns: TableColumnsType<T>
  rows: T[]
  rowKey: keyof T & string
  isPending: boolean
  errorMessage?: string
  emptyText: string
  total: number
  page: number
  pageSize: number
  search: string
  sortField?: string
  sortOrder?: SortOrder
  searchPlaceholder?: string
  onSearch: (value: string) => void
  onChange: (change: TableChange) => void
  onRowClick?: (row: T) => void
}

type ColumnField = {
  key: string
  title: string
  sortable: boolean
}

function columnFields<T extends object>(columns: TableColumnsType<T>): ColumnField[] {
  return columns.flatMap((column) => {
    if (!('dataIndex' in column) || typeof column.dataIndex !== 'string') return []
    const title = typeof column.title === 'string' ? column.title : column.dataIndex
    return [{ key: column.dataIndex, title, sortable: column.sorter === true }]
  })
}

function cellText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return ''
}

function sortedColumns<T extends object>(
  columns: TableColumnsType<T>,
  sortField: string | undefined,
  sortOrder: SortOrder | undefined,
): TableColumnsType<T> {
  return columns.map((column) => {
    if (!('dataIndex' in column) || column.sorter !== true) return column
    const field = typeof column.dataIndex === 'string' ? column.dataIndex : undefined
    return { ...column, sortOrder: field === sortField ? sortOrder : null }
  })
}

export function DataTable<T extends object>({
  columns,
  rows,
  rowKey,
  isPending,
  errorMessage,
  emptyText,
  total,
  page,
  pageSize,
  search,
  sortField,
  sortOrder,
  searchPlaceholder = 'Search',
  onSearch,
  onChange,
  onRowClick,
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const fields = columnFields(columns)
  const sortChoices = fields
    .filter((field) => field.sortable)
    .flatMap((field) => [
      { value: `${field.key}:ascend`, label: `${field.title} A–Z` },
      { value: `${field.key}:descend`, label: `${field.title} Z–A` },
    ])

  const handleChange: TableProps<T>['onChange'] = (pagination, _filters, sorter) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter
    const field = typeof active?.field === 'string' ? active.field : undefined
    const order = active?.order === 'ascend' || active?.order === 'descend' ? active.order : undefined
    onChange({
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? pageSize,
      sortField: order ? field : undefined,
      sortOrder: order,
    })
  }

  function changePage(nextPage: number, nextPageSize: number) {
    onChange({
      page: nextPageSize === pageSize ? nextPage : 1,
      pageSize: nextPageSize,
      sortField,
      sortOrder,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-3 md:max-w-xs">
        <Input
          allowClear
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="w-full"
        />
        {isMobile && sortChoices.length > 0 ? (
          <Select
            className="w-full"
            value={sortField && sortOrder ? `${sortField}:${sortOrder}` : undefined}
            options={sortChoices}
            onChange={(value: string) => {
              const [field, order] = value.split(':')
              onChange({
                page: 1,
                pageSize,
                sortField: field,
                sortOrder: order === 'descend' ? 'descend' : 'ascend',
              })
            }}
          />
        ) : null}
      </div>
      {errorMessage ? <Alert type="error" title={errorMessage} showIcon /> : null}
      {isMobile ? (
        <div className="flex flex-col gap-3">
          {isPending ? <Spin /> : null}
          {!isPending && rows.length === 0 ? <Empty description={emptyText} /> : null}
          {rows.map((row) => {
            const [primary, ...details] = fields
            return (
              <Card
                key={String(row[rowKey])}
                size="small"
                title={primary ? cellText(row[primary.key as keyof T]) : undefined}
                hoverable={Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {details.length > 0 ? (
                  <dl className="flex flex-col gap-2">
                    {details.map((field) => (
                      <div key={field.key} className="flex flex-col">
                        <dt className="text-xs text-neutral-500">{field.title}</dt>
                        <dd className="break-words">{cellText(row[field.key as keyof T])}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </Card>
            )
          })}
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            size="small"
            showSizeChanger
            pageSizeOptions={[10, 20, 50, 100]}
            onChange={changePage}
          />
        </div>
      ) : (
        <Table<T>
          rowKey={rowKey}
          dataSource={rows}
          columns={sortedColumns(columns, sortField, sortOrder)}
          loading={isPending}
          onChange={handleChange}
          locale={{ emptyText: isPending ? <Spin /> : <Empty description={emptyText} /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count, range) => `${range[0]}-${range[1]} of ${count}`,
          }}
          onRow={
            onRowClick
              ? (row) => ({
                  onClick: () => onRowClick(row),
                  className: 'cursor-pointer',
                })
              : undefined
          }
        />
      )}
    </div>
  )
}
