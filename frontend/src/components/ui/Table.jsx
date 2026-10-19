import './Table.css';

/*
 * Empty-state note for consuming pages:
 * When `data` is an empty array this component renders a centred "No data
 * available" row spanning all columns.  Consuming pages may override this
 * by passing a custom empty-state component in its own wrapper, but the
 * built-in fallback ensures zero-data tables never render a blank container.
 */

export default function Table({ columns = [], data = [], className = '' }) {
  return (
    <div className={`table-container ${className}`}>
      <table className="table" role="table">
        <thead className="table__head">
          <tr className="table__row" role="row">
            {columns.map((col) => (
              <th
                key={col.key}
                className="table__header"
                role="columnheader"
                scope="col"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr className="table__row" role="row">
              <td
                className="table__cell table__cell--empty"
                colSpan={columns.length}
                role="cell"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx} className="table__row" role="row">
                {columns.map((col) => (
                  <td key={col.key} className="table__cell" role="cell">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
