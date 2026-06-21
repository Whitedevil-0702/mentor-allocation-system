import { useState, useMemo } from 'react';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi2';

export default function DataTable({
  columns = [],
  data = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = false,
  pageSize = 10,
  emptyMessage = 'No data available',
  emptyIcon = null,
  actions = null,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = pagination ? Math.ceil(sorted.length / pageSize) : 1;
  const display = pagination
    ? sorted.slice((page - 1) * pageSize, page * pageSize)
    : sorted;

  // Reset page when data changes
  useMemo(() => setPage(1), [data, search]);

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="data-table-container">
      {(searchable || actions) && (
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            {searchable && (
              <input
                className="search-input"
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          </div>
          {actions && <div className="table-toolbar-right">{actions}</div>}
        </div>
      )}

      {display.length === 0 ? (
        <div className="empty-state">
          {emptyIcon && <div className="empty-state-icon">{emptyIcon}</div>}
          <h3>{emptyMessage}</h3>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                  >
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="sort-icon">
                        {sortDir === 'asc' ? (
                          <HiOutlineChevronUp />
                        ) : (
                          <HiOutlineChevronDown />
                        )}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {display.map((row, idx) => (
                <tr key={row.id || row.student_id || row.mentor_id || idx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && totalPages > 1 && (
        <div className="table-pagination">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="table-pagination-btns">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
