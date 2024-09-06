from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from image_processor import process_image

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        processed_filepath = process_image(filepath)
        return jsonify({'imageUrl': f'/uploads/{os.path.basename(processed_filepath)}'}), 200

if __name__ == '__main__':
    app.run(debug=True)