import React, { useState, useRef, useEffect } from 'react';

const ImageEditor = ({ id, imageUrl, initialX, initialY, initialRotation, zIndex, isSelected, onSelect, onMove, onRotate }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: 200, height: 200 });
  const [rotation, setRotation] = useState(initialRotation);
  const imageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setSize({ width: img.width, height: img.height });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = (event) => {
    event.stopPropagation();
    onSelect(id);
    const startX = event.clientX - position.x;
    const startY = event.clientY - position.y;

    const handleMouseMove = (moveEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      setPosition({ x: newX, y: newY });
      onMove(id, newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleScale = (direction) => (event) => {
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      if (direction.includes('w')) {
        setSize(prev => ({ ...prev, width: Math.max(50, startWidth - dx) }));
        setPosition(prev => ({ ...prev, x: position.x + dx }));
      }
      if (direction.includes('e')) {
        setSize(prev => ({ ...prev, width: Math.max(50, startWidth + dx) }));
      }
      if (direction.includes('n')) {
        setSize(prev => ({ ...prev, height: Math.max(50, startHeight - dy) }));
        setPosition(prev => ({ ...prev, y: position.y + dy }));
      }
      if (direction.includes('s')) {
        setSize(prev => ({ ...prev, height: Math.max(50, startHeight + dy) }));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotate = (event) => {
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const rect = imageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startAngle = Math.atan2(startY - centerY, startX - centerX);

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      let newRotation = ((angle - startAngle) * 180 / Math.PI + rotation) % 360;
      if (newRotation < 0) newRotation += 360;
      setRotation(newRotation);
      onRotate(id, newRotation);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex: zIndex
      }}
    >
      <div
        ref={imageRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'move',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      >
        <img 
          src={imageUrl} 
          alt="Editable" 
          style={{ width: '100%', height: '100%', display: 'block' }}
          draggable="false"
        />
      </div>
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          border: '2px solid red',
          pointerEvents: 'none'
        }}>
          <div 
            className="rotate-handle" 
            onMouseDown={handleRotate} 
            style={{
              position: 'absolute',
              top: '-30px',
              left: '50%',
              width: '2px',
              height: '30px',
              backgroundColor: 'red',
              cursor: 'grab',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-5px',
              left: '50%',
              width: '10px',
              height: '10px',
              backgroundColor: 'red',
              borderRadius: '50%',
              transform: 'translateX(-50%)'
            }} />
          </div>
          {['nw', 'ne', 'sw', 'se'].map(direction => (
            <div
              key={direction}
              className={`resize-handle ${direction}`}
              onMouseDown={handleScale(direction)}
              style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                borderRadius: '50%',
                ...(direction.includes('n') ? { top: '-5px' } : { bottom: '-5px' }),
                ...(direction.includes('w') ? { left: '-5px' } : { right: '-5px' }),
                cursor: `${direction}-resize`,
                pointerEvents: 'auto'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageEditor;