import React, { useState, useCallback, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import ImageEditor from './ImageEditor';

const Whiteboard = () => {
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const historyRef = useRef([]); // Stores the history of images
  const currentStateRef = useRef(0); // Keeps track of the current state index in history
  const nextZIndexRef = useRef(0); // Keeps track of the zIndex
  const whiteboardRef = useRef(null); // Ref for the whiteboard DOM element

  const saveState = useCallback((newImages) => {
    const nextIndex = currentStateRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push(newImages);
    currentStateRef.current = nextIndex;
  }, []);

  const handlePaste = useCallback((event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const url = URL.createObjectURL(blob);
        setImages(prevImages => {
          const newImages = [
            ...prevImages,
            { 
              id: Date.now(),
              url, 
              x: 50, 
              y: 50, 
              rotation: 0, 
              zIndex: nextZIndexRef.current++ 
            }
          ];
          saveState(newImages);
          return newImages;
        });
        break;
      }
    }
  }, [saveState]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const updateImagePosition = useCallback((id, x, y) => {
    setImages(prevImages => {
      const newImages = prevImages.map(img => 
        img.id === id ? { ...img, x, y } : img
      );
      saveState(newImages);
      return newImages;
    });
  }, [saveState]);

  const updateImageRotation = useCallback((id, rotation) => {
    setImages(prevImages => {
      const newImages = prevImages.map(img => 
        img.id === id ? { ...img, rotation } : img
      );
      saveState(newImages);
      return newImages;
    });
  }, [saveState]);

  const handleWhiteboardClick = () => {
    setSelectedImageIndex(null);
  };

  const handleImageSelect = (id) => {
    const index = images.findIndex(img => img.id === id);
    setSelectedImageIndex(index);
  };

  const handleMoveUp = () => {
    if (selectedImageIndex === null) return;
    setImages(prevImages => {
      const newImages = [...prevImages];
      const currentImage = newImages[selectedImageIndex];
      const highestZIndex = Math.max(...newImages.map(img => img.zIndex));
      if (currentImage.zIndex < highestZIndex) {
        currentImage.zIndex = highestZIndex + 1;
        nextZIndexRef.current = highestZIndex + 2;
      }
      saveState(newImages);
      return newImages;
    });
  };

  const handleMoveDown = () => {
    if (selectedImageIndex === null) return;
    setImages(prevImages => {
      const newImages = [...prevImages];
      const currentImage = newImages[selectedImageIndex];
      const lowestZIndex = Math.min(...newImages.map(img => img.zIndex));
      if (currentImage.zIndex > lowestZIndex) {
        currentImage.zIndex = lowestZIndex - 1;
      }
      saveState(newImages);
      return newImages;
    });
  };

  const handleErase = () => {
    if (selectedImageIndex === null) return;
    setImages(prevImages => {
      const newImages = prevImages.filter((_, index) => index !== selectedImageIndex);
      saveState(newImages);
      return newImages;
    });
    setSelectedImageIndex(null);
  };

  const handleUndo = useCallback(() => {
    if (currentStateRef.current > 0) {
      currentStateRef.current--;
      setImages(historyRef.current[currentStateRef.current]);
      setSelectedImageIndex(null);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (currentStateRef.current < historyRef.current.length - 1) {
      currentStateRef.current++;
      setImages(historyRef.current[currentStateRef.current]);
      setSelectedImageIndex(null);
    }
  }, []);

  // Keyboard event for handling undo (Ctrl + Z) and redo (Ctrl + Y)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      } else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const startSelection = (event) => {
    setIsSelecting(true);
    setSelectionStart({ x: event.clientX, y: event.clientY });
    setSelectionEnd({ x: event.clientX, y: event.clientY });
  };

  const updateSelection = (event) => {
    if (isSelecting) {
      setSelectionEnd({ x: event.clientX, y: event.clientY });
    }
  };

  const endSelection = () => {
    setIsSelecting(false);
  };

  const saveAsPNG = () => {
    if (isSelecting) {
      const selectionRect = {
        left: Math.min(selectionStart.x, selectionEnd.x),
        top: Math.min(selectionStart.y, selectionEnd.y),
        width: Math.abs(selectionEnd.x - selectionStart.x),
        height: Math.abs(selectionEnd.y - selectionStart.y)
      };

      html2canvas(whiteboardRef.current, {
        x: selectionRect.left,
        y: selectionRect.top,
        width: selectionRect.width,
        height: selectionRect.height,
        backgroundColor: null
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'whiteboard-selection.png';
        link.href = canvas.toDataURL();
        link.click();
      });

      setIsSelecting(false);
    } else {
      html2canvas(whiteboardRef.current, {
        backgroundColor: null
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  return (
    <div 
      ref={whiteboardRef}
      style={{ 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'white', 
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={handleWhiteboardClick}
      onMouseDown={startSelection}
      onMouseMove={updateSelection}
      onMouseUp={endSelection}
    >
      {images.map((image) => (
        <ImageEditor 
          key={image.id} 
          id={image.id}
          imageUrl={image.url} 
          initialX={image.x}
          initialY={image.y}
          initialRotation={image.rotation}
          zIndex={image.zIndex}
          isSelected={images.indexOf(image) === selectedImageIndex}
          onSelect={() => handleImageSelect(image.id)}
          onMove={(x, y) => updateImagePosition(image.id, x, y)}
          onRotate={(rotation) => updateImageRotation(image.id, rotation)}
        />
      ))}
      {images.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '24px',
            color: '#666',
            fontFamily: 'Arial, sans-serif',
            animation: 'pulse 2s infinite'
          }}>
            Paste an image to start editing!
          </p>
          <style>
            {`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
              }
            `}
          </style>
        </div>
      )}
      {selectedImageIndex !== null && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '20px',
          backgroundColor: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <button onClick={handleErase} style={buttonStyle} title="Delete">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={handleMoveUp} style={buttonStyle} title="Move Up">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 19V5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12L12 5L19 12" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={handleMoveDown} style={buttonStyle} title="Move Down">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 12L12 19L5 12" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
      <button 
        onClick={saveAsPNG} 
        style={{
          ...buttonStyle,
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '10px',
          backgroundColor: 'white',
          border: '1px solid black',
          borderRadius: '4px'
        }}
        title="Save as PNG"
      >
        Save as PNG
      </button>
      {isSelecting && (
        <div style={{
          position: 'absolute',
          left: Math.min(selectionStart.x, selectionEnd.x),
          top: Math.min(selectionStart.y, selectionEnd.y),
          width: Math.abs(selectionEnd.x - selectionStart.x),
          height: Math.abs(selectionEnd.y - selectionStart.y),
          border: '2px dashed blue',
          pointerEvents: 'none'
        }} />
      )}
    </div>
  );
};

const buttonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '4px',
  transition: 'background-color 0.3s',
};

export default Whiteboard;
