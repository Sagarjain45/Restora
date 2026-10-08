import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading data...', size = 32 }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 2rem',
        width: '100%',
        gap: '1rem',
      }}
    >
      <Loader2
        size={size}
        color="#6366f1"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <span
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export const SkeletonCard = ({ height = '180px' }) => {
  return (
    <div
      className="glass-panel skeleton-shimmer"
      style={{
        height,
        borderRadius: 'var(--radius-lg)',
        width: '100%',
      }}
    />
  );
};

export const SkeletonGrid = ({ count = 6, height = '180px' }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} height={height} />
      ))}
    </div>
  );
};

export default LoadingSpinner;
