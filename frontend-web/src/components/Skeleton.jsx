import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  variant = 'rect', 
  width, 
  height, 
  borderRadius, 
  className = '', 
  style = {} 
}) => {
  const baseStyle = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '12px' : '100px'),
    borderRadius: borderRadius || (variant === 'circle' ? '50%' : '8px'),
    ...style
  };

  return (
    <div 
      className={`skeleton-base skeleton-shimmer ${variant} ${className}`} 
      style={baseStyle}
    />
  );
};

export default Skeleton;
