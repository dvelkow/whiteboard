import React, { useState, useCallback } from 'react';
import ImageEditor from './ImageEditor';
import axios from 'axios';

const Whiteboard = () => {
  const [images, setImages] = useState([]);

  const handlePaste = useCallback(async (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const formData = new FormData();
        formData.append('image', blob);

        try {
          const response = await axios.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setImages(prevImages => [...prevImages, response.data.imageUrl]);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
        break;
      }
    }
  }, []);

  return (
    <div 
      style={{ 
        width: '100vw', 
        height: '80vh', 
        backgroundColor: '#f0f0f0', 
        position: 'relative' 
      }}
      onPaste={handlePaste}
    >
      {images.map((imageUrl, index) => (
        <ImageEditor key={index} imageUrl={imageUrl} />
      ))}
      {images.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          color: '#666'
        }}>
          Paste an image here (Ctrl+V)
        </div>
      )}
    </div>
  );
};

export default Whiteboard;