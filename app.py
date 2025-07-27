import os
import sys
import uuid
from werkzeug.utils import secure_filename

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

# Create upload directory
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
            'file_size': self.file_size,
            'audio_file_path': self.audio_file_path
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
        songs = Song.query.order_by(Song.upload_date.desc()).all()
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/upload', methods=['POST'])
def upload_song():
    try:
        # Check if file is present
        if 'audio_file' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        file = request.files['audio_file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type. Please upload MP3, WAV, FLAC, or M4A files.'}), 400
        
        # Get form data
        title = request.form.get('title', '').strip()
        artist = request.form.get('artist', '').strip()
        lyrics = request.form.get('lyrics', '').strip()
        maqam = request.form.get('maqam', '').strip()
        style = request.form.get('style', '').strip()
        tempo = request.form.get('tempo', type=int)
        emotion = request.form.get('emotion', '').strip()
        region = request.form.get('region', '').strip()
        composer = request.form.get('composer', '').strip()
        poem_bahr = request.form.get('poem_bahr', '').strip()
        
        # Validate required fields
        if not all([title, artist, lyrics, maqam, style, tempo, emotion, region]):
            return jsonify({'success': False, 'error': 'All required fields must be filled'}), 400
        
        if not (60 <= tempo <= 180):
            return jsonify({'success': False, 'error': 'Tempo must be between 60 and 180 BPM'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create database entry
        song = Song(
            title=title,
            artist=artist,
            lyrics=lyrics,
            audio_file_path=file_path,
            maqam=maqam,
            style=style,
            tempo=tempo,
            emotion=emotion,
            region=region,
            composer=composer,
            poem_bahr=poem_bahr,
            file_size=file_size
        )
        
        db.session.add(song)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Song uploaded successfully!',
            'song': song.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/<int:song_id>', methods=['PUT'])
def update_song(song_id):
    try:
        song = Song.query.get_or_404(song_id)
        
        # Update fields
        song.title = request.json.get('title', song.title)
        song.artist = request.json.get('artist', song.artist)
        song.lyrics = request.json.get('lyrics', song.lyrics)
        song.maqam = request.json.get('maqam', song.maqam)
        song.style = request.json.get('style', song.style)
        song.tempo = request.json.get('tempo', song.tempo)
        song.emotion = request.json.get('emotion', song.emotion)
        song.region = request.json.get('region', song.region)
        song.composer = request.json.get('composer', song.composer)
        song.poem_bahr = request.json.get('poem_bahr', song.poem_bahr)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Song updated successfully!',
            'song': song.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    try:
        song = Song.query.get_or_404(song_id)
        
        # Delete file if it exists
        if os.path.exists(song.audio_file_path):
            os.remove(song.audio_file_path)
        
        db.session.delete(song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Song deleted successfully!'
        })
        
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
# Training endpoints
@app.route('/api/training/start', methods=['POST'])
def start_training():
    try:
        # Get configuration from request
        config = request.get_json() or {}
        
        # Validate that we have songs
        songs_count = Song.query.count()
        if songs_count < 5:
            return jsonify({
                'success': False, 
                'error': f'Need at least 5 songs to start training. Currently have {songs_count} songs.'
            }), 400
        
        # Check that songs have required data
        songs_with_lyrics = Song.query.filter(Song.lyrics != '', Song.lyrics.isnot(None)).count()
        if songs_with_lyrics < songs_count:
            return jsonify({
                'success': False, 
                'error': 'All songs must have lyrics to start training.'
            }), 400
        
        # Simulate training start
        session_id = str(uuid.uuid4())
        
        # Store training session info (in a real app, you'd save this to database)
        app.config['CURRENT_TRAINING'] = {
            'session_id': session_id,
            'status': 'training',
            'progress': 0,
            'current_epoch': 0,
            'total_epochs': config.get('epochs', 25),
            'start_time': datetime.utcnow(),
            'config': config
        }
        
        return jsonify({
            'success': True,
            'message': 'Training started successfully!',
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    try:
        # Clear current training
        if 'CURRENT_TRAINING' in app.config:
            app.config['CURRENT_TRAINING']['status'] = 'stopped'
        
        return jsonify({
            'success': True,
            'message': 'Training stopped successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/reset', methods=['POST'])
def reset_training():
    try:
        # Clear training data
        if 'CURRENT_TRAINING' in app.config:
            del app.config['CURRENT_TRAINING']
        
        return jsonify({
            'success': True,
            'message': 'Model reset successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/status')
def get_training_status():
    try:
        # Check if training is active
        if 'CURRENT_TRAINING' not in app.config:
            return jsonify({
                'success': True,
                'status': {
                    'status': 'not_started',
                    'progress': 0
                }
            })
        
        training = app.config['CURRENT_TRAINING']
        
        # Simulate training progress
        if training['status'] == 'training':
            # Calculate progress based on time elapsed
            elapsed = (datetime.utcnow() - training['start_time']).total_seconds()
            total_time = training['total_epochs'] * 60  # 1 minute per epoch simulation
            progress = min((elapsed / total_time) * 100, 100)
            
            current_epoch = min(int(elapsed / 60) + 1, training['total_epochs'])
            
            # Simulate completion
            if progress >= 100:
                training['status'] = 'completed'
                training['progress'] = 100
            else:
                training['progress'] = progress
                training['current_epoch'] = current_epoch
        
        return jsonify({
            'success': True,
            'status': {
                'status': training['status'],
                'progress': training.get('progress', 0),
                'current_epoch': training.get('current_epoch', 0),
                'total_epochs': training.get('total_epochs', 25),
                'loss': round(max(0.5 - (training.get('progress', 0) / 200), 0.05), 4),
                'accuracy': round(min(0.6 + (training.get('progress', 0) / 150), 0.95), 3),
                'eta': f"{max(training.get('total_epochs', 25) - training.get('current_epoch', 0), 0)} minutes"
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/history')
def get_training_history():
    try:
        # In a real app, you'd fetch this from database
        # For now, return empty history
        return jsonify({
            'success': True,
            'history': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    try:
        return jsonify({
            'success': True,
            'message': 'Training stopped successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/reset', methods=['POST'])
def reset_training():
    try:
        return jsonify({
            'success': True,
            'message': 'Model reset successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/status')
def training_status():
    # Simulate training progress
    import random
    return jsonify({
        'success': True,
        'status': {
            'status': 'training',
            'progress': random.randint(0, 100),
            'current_epoch': random.randint(1, 25),
            'loss': random.uniform(0.1, 0.5),
            'accuracy': random.uniform(0.7, 0.95),
            'eta': '45 minutes'
        }
    })

@app.route('/api/training/history')
def training_history():
    return jsonify({
        'success': True,
        'history': []
    })

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

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
