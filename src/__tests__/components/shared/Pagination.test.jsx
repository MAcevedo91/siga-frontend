import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '@/components/shared/Pagination'

describe('Pagination', () => {
  it('renders page info and navigation buttons', () => {
    const handlePageChange = vi.fn()
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={handlePageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    )

    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('Anterior')).toBeDisabled()
    expect(screen.getByText('Siguiente')).not.toBeDisabled()
  })

  it('calls onPageChange when clicking next or page numbers', () => {
    const handlePageChange = vi.fn()
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={handlePageChange}
        itemsPerPage={10}
        totalItems={50}
      />
    )

    fireEvent.click(screen.getByText('Siguiente'))
    expect(handlePageChange).toHaveBeenCalledWith(3)

    fireEvent.click(screen.getByText('Anterior'))
    expect(handlePageChange).toHaveBeenCalledWith(1)
  })
})
