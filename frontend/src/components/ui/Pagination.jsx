import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import './Pagination.css';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination items (with ellipsis for large totalPages)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className={`pagination${totalPages <= 1 ? ' pagination--single-page' : ''}${className ? ` ${className}` : ''}`}>
      <div className="pagination__info-wrapper">
        <p className="pagination__info">
          Showing <span className="pagination__highlight">{startItem}</span> to{' '}
          <span className="pagination__highlight">{endItem}</span> of{' '}
          <span className="pagination__highlight">{totalItems}</span> results
        </p>
      </div>

      {totalPages <= 1 ? (
        <div className="pagination__single-status">
          <span className="pagination__single-badge">Page 1 of 1</span>
        </div>
      ) : (
        <div className="pagination__controls" role="navigation" aria-label="Pagination">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            leftIcon={ChevronLeft}
            className="pagination__nav-btn"
          >
            Prev
          </Button>

          <div className="pagination__cluster">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="pagination__ellipsis" aria-hidden="true">
                    &hellip;
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  type="button"
                  className={`pagination__page-btn${p === currentPage ? ' pagination__page-btn--active' : ''}`}
                  onClick={() => onPageChange(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            rightIcon={ChevronRight}
            className="pagination__nav-btn"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
