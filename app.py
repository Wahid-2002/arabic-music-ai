import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS

# Create a simple Flask app first
app = Flask(__name__, static_folder='src/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Enable CORS for all routes
CORS(app)

# Simple route for testing
@app.route('/')
def home():
    return '''
    <html>
    <head><title>Arabic Music AI</title></head>
    <body>
        <h1>🎵 Arabic Music AI Generator</h1>
        <p>Your application is successfully deployed!</p>
        <p>The full interface will be available soon.</p>
    </body>
    </html>
    '''

@app.route('/health')
def health():
    return {'status': 'healthy', 'message': 'Arabic Music AI is running'}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
