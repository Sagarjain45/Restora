import {
  Clock,
  Edit2,
  Trash2,
  Power,
} from 'lucide-react';

const MenuItemCard = ({
  item,
  isOwner,
  onToggleAvailability,
  onEdit,
  onDelete,
  isProcessing = false,
  currency = 'INR',
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        background: item.isAvailable ? 'rgba(15, 23, 42, 0.7)' : 'rgba(15, 23, 42, 0.4)',
        borderColor: item.isAvailable ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.2)',
        opacity: item.isActive ? (item.isAvailable ? 1 : 0.75) : 0.5,
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Header: Dietary Dot, Title, Category Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Indian standard Veg/Non-Veg symbol */}
            <div
              title={item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
              style={{
                width: '18px',
                height: '18px',
                border: `2px solid ${item.isVegetarian ? '#10b981' : '#ef4444'}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: item.isVegetarian ? '50%' : '2px',
                  backgroundColor: item.isVegetarian ? '#10b981' : '#ef4444',
                }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, lineHeight: 1.3 }}>
                {item.name}
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  fontWeight: 500,
                }}
              >
                {item.category}
              </span>
            </div>
          </div>

          {/* Availability Status Badge */}
          <span
            className={`badge ${item.isAvailable ? 'badge-success' : 'badge-gray'}`}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}
          >
            {item.isAvailable ? 'In Stock' : 'Sold Out'}
          </span>
        </div>

        {/* Description */}
        {item.description ? (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </p>
        ) : (
          <div style={{ marginBottom: '1rem' }} />
        )}
      </div>

      {/* Footer Info: Price & Prep Time & Actions */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            marginBottom: '0.85rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Price</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {currencySymbol}{item.price.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Prep Time</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Clock size={13} />
              <span>{item.preparationTime || 15}m</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          {/* Quick Availability Toggle (Kitchen / Floor staff & Owner) */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onToggleAvailability(item._id, !item.isAvailable)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: item.isAvailable ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${item.isAvailable ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              color: item.isAvailable ? '#f87171' : '#34d399',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
          >
            <Power size={12} />
            <span>{item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}</span>
          </button>

          {/* Owner Operations (Edit & Delete) */}
          {isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => onEdit(item)}
                style={{
                  padding: '0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
                title="Edit Item"
              >
                <Edit2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                style={{
                  padding: '0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--accent-danger)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
                title="Deactivate / Delete Item"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
