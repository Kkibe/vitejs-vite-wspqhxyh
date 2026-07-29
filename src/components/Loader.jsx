import React from 'react';
import './Loader.scss';

export default function Loader({ size = 'medium', fullPage = false }) {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px',
  };

  const loaderSize = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`loader-wrapper ${fullPage ? 'full-page' : ''}`}>
      <div
        className="loader"
        style={{
          width: loaderSize,
          height: loaderSize,
          borderWidth:
            size === 'small' ? '2px' : size === 'large' ? '4px' : '3px',
        }}
      >
        <div className="loader-spinner"></div>
      </div>
    </div>
  );
}
