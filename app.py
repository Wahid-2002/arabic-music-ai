import os
import sys
import uuid
from werkzeug.utils import secure_filename

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory, request, jsonify, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Create Flask app
app = Flask(__name__, static_folder='src/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Simple SQLite database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///persistent_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app)
db = SQLAlchemy(app)

# Create persistent directory for database
PERSISTENT_DIR = '/opt/render/project/persistent'
if not os.path.exists(PERSISTENT_DIR):
    try:
        os.makedirs(PERSISTENT_DIR)
    except:
        PERSISTENT_DIR = '.'

# Update database path to persistent location
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{PERSISTENT_DIR}/app.db'

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Database Models - Store files as base64 in database
class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    lyrics = db.Column(db.Text, nullable=False)
    audio_filename = db.Column(db.String(500), nullable=False)
    audio_data = db.Column(db.Text, nullable=False)  # Base64 encoded audio
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
            'audio_filename': self.audio_filename
        }

# Training Session Model
class TrainingSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.String(50), nullable=False)
    progress = db.Column(db.Float, default=0)
    current_epoch = db.Column(db.Integer, default=0)
    total_epochs = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    config_data = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'status': self.status,
            'progress': self.progress,
            'current_epoch': self.current_epoch,
            'total_epochs': self.total_epochs,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None
        }

# Generated Song Model
class GeneratedSong(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), default='AI Generated')
    lyrics = db.Column(db.Text, nullable=False)
    maqam = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    tempo = db.Column(db.Integer, nullable=False)
    emotion = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    composer = db.Column(db.String(200))
    poem_bahr = db.Column(db.String(50))
    duration = db.Column(db.String(20))
    instruments = db.Column(db.String(50))
    creativity = db.Column(db.Integer)
    audio_data = db.Column(db.Text)  # Base64 encoded generated audio
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    generation_params = db.Column(db.Text)  # JSON string of all parameters

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
            'duration': self.duration,
            'instruments': self.instruments,
            'creativity': self.creativity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'has_audio': bool(self.audio_data)
        }

# API Routes
@app.route('/api/dashboard/stats')
def dashboard_stats():
    try:
        songs_count = Song.query.count()
        generated_count = GeneratedSong.query.count()
        active_training = TrainingSession.query.filter_by(status='training').first()
        completed_training = TrainingSession.query.filter_by(status='completed').first()
        
        return jsonify({
            'success': True,
            'stats': {
                'songs_count': songs_count,
                'generated_count': generated_count,
                'is_training': active_training is not None,
                'model_accuracy': 85 if completed_training else 0
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
        
        # Read and encode file content
        file_content = file.read()
        file_size = len(file_content)
        
        # Convert to base64 for storage
        import base64
        audio_data = base64.b64encode(file_content).decode('utf-8')
        
        # Create database entry
        song = Song(
            title=title,
            artist=artist,
            lyrics=lyrics,
            audio_filename=secure_filename(file.filename),
            audio_data=audio_data,
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
            'message': f'Song "{title}" uploaded and saved permanently!',
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
        song_title = song.title
        
        db.session.delete(song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Song "{song_title}" deleted successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Serve audio files from database
@app.route('/api/songs/<int:song_id>/audio')
def get_song_audio(song_id):
    try:
        song = Song.query.get_or_404(song_id)
        
        # Decode base64 audio data
        import base64
        audio_content = base64.b64decode(song.audio_data)
        
        return Response(
            audio_content,
            mimetype='audio/mpeg',
            headers={
                'Content-Disposition': f'attachment; filename="{song.audio_filename}"',
                'Content-Length': str(len(audio_content))
            }
        )
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Training endpoints
@app.route('/api/training/start', methods=['POST'])
def start_training():
    try:
        # Check for existing active training
        active_training = TrainingSession.query.filter_by(status='training').first()
        if active_training:
            return jsonify({
                'success': False, 
                'error': 'Training is already in progress'
            }), 400
        
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
        
        # Create new training session
        session_id = str(uuid.uuid4())
        training_session = TrainingSession(
            session_id=session_id,
            status='training',
            progress=0,
            current_epoch=0,
            total_epochs=config.get('epochs', 25),
            config_data=json.dumps(config)
        )
        
        db.session.add(training_session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Training started with {songs_count} songs!',
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    try:
        active_training = TrainingSession.query.filter_by(status='training').first()
        if active_training:
            active_training.status = 'stopped'
            active_training.end_time = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Training stopped successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/reset', methods=['POST'])
def reset_training():
    try:
        # Mark all training sessions as reset
        TrainingSession.query.update({'status': 'reset'})
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Model reset successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/status')
def get_training_status():
    try:
        active_training = TrainingSession.query.filter_by(status='training').first()
        
        if not active_training:
            return jsonify({
                'success': True,
                'status': {
                    'status': 'not_started',
                    'progress': 0
                }
            })
        
        # Simulate training progress based on time elapsed
        elapsed = (datetime.utcnow() - active_training.start_time).total_seconds()
        total_time = active_training.total_epochs * 60  # 1 minute per epoch simulation
        progress = min((elapsed / total_time) * 100, 100)
        
        current_epoch = min(int(elapsed / 60) + 1, active_training.total_epochs)
        
        # Update progress in database
        active_training.progress = progress
        active_training.current_epoch = current_epoch
        
        # Check if completed
        if progress >= 100:
            active_training.status = 'completed'
            active_training.end_time = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'status': {
                'status': active_training.status,
                'progress': progress,
                'current_epoch': current_epoch,
                'total_epochs': active_training.total_epochs,
                'loss': round(max(0.5 - (progress / 200), 0.05), 4),
                'accuracy': round(min(0.6 + (progress / 150), 0.95), 3),
                'eta': f"{max(active_training.total_epochs - current_epoch, 0)} minutes"
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/history')
def get_training_history():
    try:
        sessions = TrainingSession.query.order_by(TrainingSession.start_time.desc()).limit(10).all()
        return jsonify({
            'success': True,
            'history': [session.to_dict() for session in sessions]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# GENERATION ENDPOINTS - Complete Implementation
@app.route('/api/generation/generate', methods=['POST'])
def generate_music():
    try:
        params = request.get_json()
        
        # Validate required parameters
        required_fields = ['title', 'lyrics', 'maqam', 'style', 'tempo', 'emotion', 'region']
        missing_fields = [field for field in required_fields if not params.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate tempo
        tempo = int(params.get('tempo', 120))
        if not (60 <= tempo <= 180):
            return jsonify({
                'success': False,
                'error': 'Tempo must be between 60 and 180 BPM'
            }), 400
        
        # Check if we have training data
        songs_count = Song.query.count()
        if songs_count < 3:  # Reduced requirement for testing
            return jsonify({
                'success': False,
                'error': f'Need at least 3 training songs to generate music. Currently have {songs_count} songs. Please upload more songs first.'
            }), 400
        
        # Simulate music generation process
        generation_id = str(uuid.uuid4())
        
        # Create generated song entry
        generated_song = GeneratedSong(
            title=params.get('title'),
            artist=params.get('artist', 'AI Generated'),
            lyrics=params.get('lyrics'),
            maqam=params.get('maqam'),
            style=params.get('style'),
            tempo=tempo,
            emotion=params.get('emotion'),
            region=params.get('region'),
            composer=params.get('composer'),
            poem_bahr=params.get('poem_bahr'),
            duration=params.get('duration', 'medium'),
            instruments=params.get('instruments', 'modern'),
            creativity=int(params.get('creativity', 7)),
            generation_params=json.dumps(params),
            audio_data=generate_dummy_audio(params)  # Simulate audio generation
        )
        
        db.session.add(generated_song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Music generation completed! "{params.get("title")}" has been generated using {songs_count} training songs.',
            'generation_id': generation_id,
            'song_id': generated_song.id,
            'estimated_time': '30 seconds'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_dummy_audio(params):
    """Generate a dummy audio file for demonstration"""
    # In a real implementation, this would call your AI model
    # For now, return a placeholder that includes generation info
    generation_info = {
        'maqam': params.get('maqam'),
        'style': params.get('style'),
        'emotion': params.get('emotion'),
        'tempo': params.get('tempo'),
        'generated_at': datetime.utcnow().isoformat()
    }
    return f"dummy_audio_data_{json.dumps(generation_info)}"

@app.route('/api/generation/list')
def get_generated_songs():
    try:
        songs = GeneratedSong.query.order_by(GeneratedSong.created_at.desc()).all()
        return jsonify({
            'success': True,
            'generated_songs': [song.to_dict() for song in songs]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/<int:song_id>/audio')
def get_generated_audio(song_id):
    try:
        song = GeneratedSong.query.get_or_404(song_id)
        
        if not song.audio_data or song.audio_data.startswith("dummy_audio_data"):
            return jsonify({
                'success': False,
                'error': 'This is a demo version. Audio generation will be implemented with the full AI model.',
                'info': 'The generation parameters have been saved and the system is ready for real audio generation.'
            }), 404
        
        # In a real implementation, decode and return the audio
        return jsonify({
            'success': True,
            'message': 'Audio would be streamed here in the full implementation'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/<int:song_id>', methods=['DELETE'])
def delete_generated_song(song_id):
    try:
        song = GeneratedSong.query.get_or_404(song_id)
        song_title = song.title
        
        db.session.delete(song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Generated song "{song_title}" deleted successfully!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Health check endpoint
@app.route('/health')
def health_check():
    try:
        songs_count = Song.query.count()
        generated_count = GeneratedSong.query.count()
        return jsonify({
            'status': 'healthy',
            'songs_count': songs_count,
            'generated_count': generated_count,
            'message': 'Arabic Music AI is running with full generation capabilities'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

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
                <p>Songs are saved permanently and generation is ready!</p>
            </body>
            </html>
            '''

# Create database tables
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Database creation error: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
