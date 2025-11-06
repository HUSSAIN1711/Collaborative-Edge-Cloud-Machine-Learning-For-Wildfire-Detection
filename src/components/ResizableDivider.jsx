import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';

function ResizableDivider({ 
  orientation = 'vertical', // 'vertical' or 'horizontal'
  onResize,
  minSize = 20,
  maxSize = 80,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      if (orientation === 'vertical') {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        onResize(Math.max(minSize, Math.min(maxSize, newWidth)));
      } else {
        // For horizontal, calculate height from bottom of viewport
        const newHeight = window.innerHeight - e.clientY;
        onResize(Math.max(minSize, Math.min(maxSize, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, orientation, onResize, minSize, maxSize]);

  return (
    <Box
      ref={dividerRef}
      onMouseDown={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      sx={{
        width: orientation === 'vertical' ? '4px' : '100%',
        height: orientation === 'vertical' ? '100%' : '4px',
        cursor: orientation === 'vertical' ? 'col-resize' : 'row-resize',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderLeft: orientation === 'vertical' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        borderRight: orientation === 'vertical' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        borderTop: orientation === 'horizontal' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        borderBottom: orientation === 'horizontal' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
        zIndex: 1000,
        position: 'relative',
      }}
    />
  );
}

export default ResizableDivider;

