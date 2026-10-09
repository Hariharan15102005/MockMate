import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No data available',
  emptyDescription = 'No records have been recorded yet.',
  emptyActionLabel,
  onEmptyAction,
  pagination = null, // { currentPage, totalPages, onPageChange, totalItems }
  className = '',
  style = {}
}) => {
  if (loading) {
    return <LoadingSkeleton type="table" rows={5} columns={columns.length || 4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={`table-container ${className}`} style={style}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  width: col.width || 'auto',
                  textAlign: col.align || 'left'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={row.id || rIdx}>
              {columns.map((col, cIdx) => (
                <td
                  key={cIdx}
                  style={{
                    textAlign: col.align || 'left'
                  }}
                >
                  {col.render ? col.render(row, rIdx) : (row[col.accessor] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.4)',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Showing Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
            {pagination.totalItems !== undefined && ` (${pagination.totalItems} items)`}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              iconPosition="right"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
