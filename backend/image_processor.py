from PIL import Image
import os

def process_image(filepath):
    # Open the image
    with Image.open(filepath) as img:
        # Perform some basic processing (e.g., resize)
        max_size = (800, 800)
        img.thumbnail(max_size)
        
        # Save the processed image
        filename = os.path.basename(filepath)
        processed_filename = f"processed_{filename}"
        processed_filepath = os.path.join(os.path.dirname(filepath), processed_filename)
        img.save(processed_filepath)
    
    return processed_filepath