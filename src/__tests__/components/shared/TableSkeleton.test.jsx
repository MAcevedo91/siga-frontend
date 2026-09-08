import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TableSkeleton from '@/components/shared/TableSkeleton'

describe('TableSkeleton', () => {
  it('renders with default rows and columns', () => {
    const { container } = render(<TableSkeleton />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(5)
    const headerCols = container.querySelectorAll('thead th')
    expect(headerCols.length).toBe(5)
  })

  it('renders with custom rows and columns', () => {
    const { container } = render(<TableSkeleton rows={10} columns={6} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(10)
    const headerCols = container.querySelectorAll('thead th')
    expect(headerCols.length).toBe(6)
  })
})
