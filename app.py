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

# Simple SQLite database - no parsing issues
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///arabic_music_ai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app)
db = SQLAlchemy(app)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Database Models
class Song(db.Model):
    __tablename__ = 'songs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    lyrics = db.Column(db.Text, nullable=False)
    audio_filename = db.Column(db.String(500), nullable=False)
    audio_data = db.Column(db.LargeBinary, nullable=False)
    maqam = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    tempo = db.Column(db.Integer, nullable=False)
    emotion = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    composer = db.Column(db.String(200))
    poem_bahr = db.Column(db.String(50))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    file_size = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)

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

class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'
    
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

class GeneratedSong(db.Model):
    __tablename__ = 'generated_songs'
    
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
    audio_data = db.Column(db.LargeBinary)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    generation_params = db.Column(db.Text)

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
        songs_count = Song.query.filter_by(is_active=True).count()
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

@app.route('/api/library/songs')
def get_library_songs():
    try:
        songs = Song.query.filter_by(is_active=True).order_by(Song.upload_date.desc()).all()
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/list')
def get_songs():
    return get_library_songs()

@app.route('/api/songs/upload', methods=['POST'])
def upload_song():
    try:
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
        
        # Read file content
        file_content = file.read()
        file_size = len(file_content)
        
        # Create database entry
        song = Song(
            title=title,
            artist=artist,
            lyrics=lyrics,
            audio_filename=secure_filename(file.filename),
            audio_data=file_content,
            maqam=maqam,
            style=style,
            tempo=tempo,
            emotion=emotion,
            region=region,
            composer=composer,
            poem_bahr=poem_bahr,
            file_size=file_size,
            is_active=True
        )
        
        db.session.add(song)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': f'Song "{title}" uploaded and permanently saved to library!',
            'song': song.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/<int:song_id>', methods=['PUT'])
def update_song(song_id):
    try:
        song = Song.query.filter_by(id=song_id, is_active=True).first_or_404()
        
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
            'message': 'Song updated successfully in library!',
            'song': song.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    try:
        song = Song.query.filter_by(id=song_id, is_active=True).first_or_404()
        song_title = song.title
        
        song.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Song "{song_title}" removed from library!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/<int:song_id>/audio')
def get_song_audio(song_id):
    try:
        song = Song.query.filter_by(id=song_id, is_active=True).first_or_404()
        
        return Response(
            song.audio_data,
            mimetype='audio/mpeg',
            headers={
                'Content-Disposition': f'attachment; filename="{song.audio_filename}"',
                'Content-Length': str(len(song.audio_data))
            }
        )
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Training endpoints
@app.route('/api/training/prerequisites')
def training_prerequisites():
    try:
        songs_count = Song.query.filter_by(is_active=True).count()
        songs_with_lyrics = Song.query.filter(
            Song.is_active == True,
            Song.lyrics != '',
            Song.lyrics.isnot(None)
        ).count()
        
        return jsonify({
            'success': True,
            'prerequisites': {
                'songs_count': songs_count,
                'songs_with_lyrics': songs_with_lyrics,
                'min_songs_required': 5,
                'songs_ready': songs_count >= 5,
                'lyrics_ready': songs_with_lyrics >= songs_count * 0.8  # 80% of songs should have lyrics
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/start', methods=['POST'])
def start_training():
    try:
        # Get configuration from request
        config = request.get_json() or {}
        
        # Check prerequisites
        songs_count = Song.query.filter_by(is_active=True).count()
        if songs_count < 5:
            return jsonify({
                'success': False, 
                'error': f'Need at least 5 songs to start training. Currently have {songs_count} songs. Please upload more songs first.'
            }), 400
        
        # Check that songs have required data
        songs_with_lyrics = Song.query.filter(
            Song.is_active == True,
            Song.lyrics != '',
            Song.lyrics.isnot(None)
        ).count()
        
        if songs_with_lyrics < songs_count * 0.8:
            return jsonify({
                'success': False, 
                'error': f'At least 80% of songs must have lyrics. Currently {songs_with_lyrics}/{songs_count} songs have lyrics.'
            }), 400
        
        # Create training session
        session_id = str(uuid.uuid4())
        
        training_session = TrainingSession(
            session_id=session_id,
            status='training',
            progress=0,
            epochs=config.get('epochs', 25),
            learning_rate=config.get('learning_rate', 0.001),
            batch_size=config.get('batch_size', 32),
            training_focus=config.get('training_focus', 'melody_lyrics'),
            songs_used=songs_count
        )
        
        db.session.add(training_session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Training started successfully with {songs_count} songs!',
            'session_id': session_id,
            'songs_count': songs_count
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/status')
def training_status():
    try:
        # Get latest training session
        latest_session = TrainingSession.query.order_by(TrainingSession.created_at.desc()).first()
        
        if not latest_session:
            return jsonify({
                'success': True,
                'status': {
                    'status': 'not_started',
                    'progress': 0,
                    'message': 'No training sessions yet'
                }
            })
        
        # Simulate training progress for demo
        import random
        if latest_session.status == 'training':
            # Simulate progress
            progress = min(latest_session.progress + random.randint(1, 5), 100)
            latest_session.progress = progress
            
            if progress >= 100:
                latest_session.status = 'completed'
                latest_session.final_accuracy = random.uniform(0.85, 0.95)
            
            db.session.commit()
        
        return jsonify({
            'success': True,
            'status': {
                'status': latest_session.status,
                'progress': latest_session.progress,
                'current_epoch': min(int(latest_session.progress / 4), latest_session.epochs),
                'total_epochs': latest_session.epochs,
                'accuracy': latest_session.final_accuracy or random.uniform(0.7, 0.9),
                'loss': random.uniform(0.1, 0.5),
                'eta': f'{max(1, 30 - int(latest_session.progress / 3))} minutes',
                'songs_used': latest_session.songs_used
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/history')
def training_history():
    try:
        sessions = TrainingSession.query.order_by(TrainingSession.created_at.desc()).limit(10).all()
        
        history = []
        for session in sessions:
            history.append({
                'id': session.id,
                'session_id': session.session_id,
                'status': session.status,
                'progress': session.progress,
                'epochs': session.epochs,
                'songs_used': session.songs_used,
                'final_accuracy': session.final_accuracy,
                'created_at': session.created_at.isoformat(),
                'completed_at': session.completed_at.isoformat() if session.completed_at else None
            })
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    try:
        # Get latest training session
        latest_session = TrainingSession.query.filter_by(status='training').first()
        
        if latest_session:
            latest_session.status = 'stopped'
            latest_session.completed_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Training stopped successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No active training session found'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Generation endpoints
@app.route('/api/generation/generate', methods=['POST'])
def generate_music():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'lyrics', 'maqam', 'style', 'tempo', 'emotion', 'region']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Check if we have enough training data
        songs_count = Song.query.filter_by(is_active=True).count()
        if songs_count < 3:
            return jsonify({
                'success': False,
                'error': f'Need at least 3 songs in library for generation. Currently have {songs_count} songs. Please upload more songs first.'
            }), 400
        
        # Check if model is trained (for demo, we'll allow generation with basic validation)
        latest_training = TrainingSession.query.filter_by(status='completed').order_by(TrainingSession.created_at.desc()).first()
        
        # Create generated song record
        generated_song = GeneratedSong(
            title=data['title'],
            artist=data.get('artist', 'AI Generated'),
            lyrics=data['lyrics'],
            maqam=data['maqam'],
            style=data['style'],
            tempo=int(data['tempo']),
            emotion=data['emotion'],
            region=data['region'],
            composer=data.get('composer', ''),
            poem_bahr=data.get('poem_bahr', ''),
            duration=data.get('duration', 'medium'),
            instruments=data.get('instruments', 'modern'),
            creativity_level=int(data.get('creativity', 7)),
            generation_status='completed',
            training_session_id=latest_training.session_id if latest_training else 'demo_mode'
        )
        
        db.session.add(generated_song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'🎵 "{data["title"]}" generated successfully!',
            'song_id': generated_song.id,
            'generation_details': {
                'title': generated_song.title,
                'maqam': generated_song.maqam,
                'style': generated_song.style,
                'emotion': generated_song.emotion,
                'tempo': generated_song.tempo,
                'region': generated_song.region,
                'training_songs_used': songs_count
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/list')
def list_generated_songs():
    try:
        generated_songs = GeneratedSong.query.order_by(GeneratedSong.created_at.desc()).all()
        
        songs_data = []
        for song in generated_songs:
            songs_data.append({
                'id': song.id,
                'title': song.title,
                'artist': song.artist,
                'lyrics': song.lyrics,
                'maqam': song.maqam,
                'style': song.style,
                'tempo': song.tempo,
                'emotion': song.emotion,
                'region': song.region,
                'composer': song.composer,
                'poem_bahr': song.poem_bahr,
                'duration': song.duration,
                'instruments': song.instruments,
                'creativity_level': song.creativity_level,
                'generation_status': song.generation_status,
                'created_at': song.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'generated_songs': songs_data,
            'total_count': len(songs_data)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/<int:song_id>')
def get_generated_song(song_id):
    try:
        song = GeneratedSong.query.get(song_id)
        if not song:
            return jsonify({'success': False, 'error': 'Song not found'}), 404
        
        return jsonify({
            'success': True,
            'song': {
                'id': song.id,
                'title': song.title,
                'artist': song.artist,
                'lyrics': song.lyrics,
                'maqam': song.maqam,
                'style': song.style,
                'tempo': song.tempo,
                'emotion': song.emotion,
                'region': song.region,
                'composer': song.composer,
                'poem_bahr': song.poem_bahr,
                'duration': song.duration,
                'instruments': song.instruments,
                'creativity_level': song.creativity_level,
                'generation_status': song.generation_status,
                'created_at': song.created_at.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/<int:song_id>', methods=['DELETE'])
def delete_generated_song(song_id):
    try:
        song = GeneratedSong.query.get(song_id)
        if not song:
            return jsonify({'success': False, 'error': 'Song not found'}), 404
        
        db.session.delete(song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Generated song deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/<int:song_id>/audio')
def get_generated_audio(song_id):
    try:
        song = GeneratedSong.query.get(song_id)
        if not song:
            return jsonify({'success': False, 'error': 'Song not found'}), 404
        
        # For demo purposes, return a placeholder response
        # In a real implementation, this would serve the actual generated audio file
        return jsonify({
            'success': True,
            'message': 'Audio generation feature will be implemented with actual AI model',
            'demo_info': {
                'title': song.title,
                'duration': '3:45',
                'format': 'MP3',
                'quality': '320kbps',
                'note': 'This is a demo response. Real audio generation requires AI model integration.'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Create database tables
with app.app_context():
    try:
        db.create_all()
        songs_count = Song.query.filter_by(is_active=True).count()
        print(f"Database initialized. Songs in library: {songs_count}")
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
