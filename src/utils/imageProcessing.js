export const processImage = (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        // Set maximum dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
  
        let width = img.width;
        let height = img.height;
  
        // Resize the image if it exceeds the maximum dimensions
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width *= ratio;
          height *= ratio;
        }
  
        canvas.width = width;
        canvas.height = height;
  
        // Draw the resized image on the canvas
        ctx.drawImage(img, 0, 0, width, height);
  
        // Convert the canvas to a data URL and resolve the promise
        resolve(canvas.toDataURL('image/png'));
      };
  
      img.src = imageDataUrl;
    });
  };