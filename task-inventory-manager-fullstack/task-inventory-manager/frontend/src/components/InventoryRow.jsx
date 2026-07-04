export default function InventoryRow({ item, canManage, onEdit, onDelete, onAdjust }) {
  return (
    <tr className={item.low_stock ? "row-low-stock" : ""}>
      <td>
        <div className="inv-name">{item.name}</div>
        <div className="mono inv-sku">{item.sku}</div>
      </td>
      <td>{item.category}</td>
      <td className="mono">${item.unit_price.toFixed(2)}</td>
      <td>
        <div className="qty-control">
          <button
            className="btn btn-ghost qty-btn"
            disabled={!canManage}
            onClick={() => onAdjust(item, -1)}
          >
            −
          </button>
          <span className="mono qty-value">{item.quantity}</span>
          <button className="btn btn-ghost qty-btn" disabled={!canManage} onClick={() => onAdjust(item, 1)}>
            +
          </button>
        </div>
      </td>
      <td>
        {item.low_stock ? (
          <span className="stamp stamp-admin">Low stock</span>
        ) : (
          <span className="mono ok-stock">In stock</span>
        )}
      </td>
      {canManage && (
        <td>
          <div className="inv-actions">
            <button className="btn btn-ghost" onClick={() => onEdit(item)}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => onDelete(item)}>
              Delete
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
