import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Create Flask app
app = Flask(__name__, static_folder='src/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app)
db = SQLAlchemy(app)

# Database Models
class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    lyrics = db.Column(db.Text, nullable=False)
    audio_file_path = db.Column(db.String(500), nullable=False)
    maqam = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    tempo = db.Column(db.Integer, nullable=False)
    emotion = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    composer = db.Column(db.String(200))
    poem_bahr = db.Column(db.String(50))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    file_size = db.Column(db.Integer)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'artist': self.artist,
            'lyrics': self.lyrics,
            'maqam': self.maqam,
            'style': self.style,
            'tempo': self.tempo,
            'emotion': self.emotion,
            'region': self.region,
            'composer': self.composer,
            'poem_bahr': self.poem_bahr,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'file_size': self.file_size
        }

# API Routes
@app.route('/api/dashboard/stats')
def dashboard_stats():
    try:
        songs_count = Song.query.count()
        return jsonify({
            'success': True,
            'stats': {
                'songs_count': songs_count,
                'generated_count': 0,
                'is_training': False,
                'model_accuracy': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/list')
def get_songs():
    try:
        songs = Song.query.all()
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/upload', methods=['POST'])
def upload_song():
    try:
        # For now, just return success (file upload will be added later)
        data = request.form
        
        # Create song record
        song = Song(
            title=data.get('title', 'Test Song'),
            artist=data.get('artist', 'Test Artist'),
            lyrics=data.get('lyrics', 'Test lyrics'),
            audio_file_path='placeholder.mp3',
            maqam=data.get('maqam', 'Unknown'),
            style=data.get('style', 'Classical'),
            tempo=int(data.get('tempo', 120)),
            emotion=data.get('emotion', 'Happy'),
            region=data.get('region', 'Egyptian'),
            composer=data.get('composer', ''),
            poem_bahr=data.get('poem_bahr', ''),
            file_size=0
        )
        
        db.session.add(song)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Song uploaded successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/status')
def training_status():
    return jsonify({
        'success': True,
        'status': 'not_started',
        'progress': 0
    })

@app.route('/api/generation/list')
def generation_list():
    return jsonify({
        'success': True,
        'generated_songs': []
    })

# Serve static files and main app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            return '''
            <html>
            <head><title>Arabic Music AI</title></head>
            <body>
                <h1>🎵 Arabic Music AI Generator</h1>
                <p>Your application is successfully deployed!</p>
                <p>Setting up the full interface...</p>
            </body>
            </html>
            '''

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
