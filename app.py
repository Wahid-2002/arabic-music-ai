import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import uuid
import time
import random

# Create Flask app
app = Flask(__name__, static_folder='src/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Simple, reliable database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///arabic_music_ai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app)
db = SQLAlchemy(app)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Enhanced Song model with persistence
class Song(db.Model):
    __tablename__ = 'songs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    artist = db.Column(db.String(200), nullable=False, index=True)
    lyrics = db.Column(db.Text, nullable=False)
    maqam = db.Column(db.String(50), nullable=False, index=True)
    style = db.Column(db.String(50), nullable=False, index=True)
    tempo = db.Column(db.Integer, nullable=False)
    emotion = db.Column(db.String(50), nullable=False, index=True)
    region = db.Column(db.String(50), nullable=False, index=True)
    composer = db.Column(db.String(200))
    poem_bahr = db.Column(db.String(50))
    
    # File storage
    filename = db.Column(db.String(255))
    file_size = db.Column(db.Integer)
    file_type = db.Column(db.String(10))
    audio_data = db.Column(db.LargeBinary)
    
    # Metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Training Session model
class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    status = db.Column(db.String(20), default='training')
    progress = db.Column(db.Integer, default=0)
    epochs = db.Column(db.Integer, default=25)
    learning_rate = db.Column(db.Float, default=0.001)
    batch_size = db.Column(db.Integer, default=32)
    songs_used = db.Column(db.Integer, default=0)
    final_accuracy = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'status': self.status,
            'progress': self.progress,
            'epochs': self.epochs,
            'learning_rate': self.learning_rate,
            'batch_size': self.batch_size,
            'songs_used': self.songs_used,
            'final_accuracy': self.final_accuracy,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

# Generated Song model
class GeneratedSong(db.Model):
    __tablename__ = 'generated_songs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
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
    
    # Generation metadata
    generation_time = db.Column(db.Float)
    model_version = db.Column(db.String(50))
    training_session_id = db.Column(db.String(36))
    
    # Audio data (placeholder for future implementation)
    audio_data = db.Column(db.LargeBinary)
    file_size = db.Column(db.Integer)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
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
            'generation_time': self.generation_time,
            'model_version': self.model_version,
            'training_session_id': self.training_session_id,
            'file_size': self.file_size,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Create tables
with app.app_context():
    db.create_all()

# Dashboard endpoints
@app.route('/api/dashboard/stats')
def dashboard_stats():
    try:
        songs_count = Song.query.filter_by(is_active=True).count()
        total_size = db.session.query(db.func.sum(Song.file_size)).filter_by(is_active=True).scalar() or 0
        
        # Get unique maqams and regions
        maqams = db.session.query(Song.maqam).filter_by(is_active=True).distinct().all()
        regions = db.session.query(Song.region).filter_by(is_active=True).distinct().all()
        
        # Get training status
        latest_training = TrainingSession.query.order_by(TrainingSession.created_at.desc()).first()
        is_training = latest_training and latest_training.status == 'training' if latest_training else False
        model_accuracy = latest_training.final_accuracy if latest_training and latest_training.final_accuracy else 0
        
        return jsonify({
            'success': True,
            'stats': {
                'songs_count': songs_count,
                'total_songs': songs_count,
                'total_size': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2) if total_size else 0,
                'maqams': [m[0] for m in maqams],
                'regions': [r[0] for r in regions],
                'training_sessions': TrainingSession.query.count(),
                'generated_songs': GeneratedSong.query.count(),
                'generated_count': GeneratedSong.query.count(),
                'is_training': is_training,
                'model_accuracy': model_accuracy
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Song management endpoints
@app.route('/api/songs/list')
def list_songs():
    try:
        songs = Song.query.filter_by(is_active=True).order_by(Song.created_at.desc()).all()
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/upload', methods=['POST'])
def upload_song():
    try:
        # Validate file
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
        tempo = request.form.get('tempo', '').strip()
        emotion = request.form.get('emotion', '').strip()
        region = request.form.get('region', '').strip()
        composer = request.form.get('composer', '').strip()
        poem_bahr = request.form.get('poem_bahr', '').strip()
        
        # Validate required fields
        required_fields = {
            'title': title,
            'artist': artist,
            'lyrics': lyrics,
            'maqam': maqam,
            'style': style,
            'tempo': tempo,
            'emotion': emotion,
            'region': region
        }
        
        missing_fields = [field for field, value in required_fields.items() if not value]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate tempo
        try:
            tempo_int = int(tempo)
            if tempo_int < 60 or tempo_int > 180:
                return jsonify({'success': False, 'error': 'Tempo must be between 60 and 180 BPM'}), 400
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid tempo value'}), 400
        
        # Read and store file data
        file_data = file.read()
        file_size = len(file_data)
        
        # Create song record
        song = Song(
            title=title,
            artist=artist,
            lyrics=lyrics,
            maqam=maqam,
            style=style,
            tempo=tempo_int,
            emotion=emotion,
            region=region,
            composer=composer if composer else None,
            poem_bahr=poem_bahr if poem_bahr else None,
            filename=secure_filename(file.filename),
            file_size=file_size,
            file_type=file.filename.rsplit('.', 1)[1].lower(),
            audio_data=file_data,
            is_active=True
        )
        
        # Save to database
        try:
            db.session.add(song)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Song "{title}" uploaded successfully!',
                'song_id': song.id,
                'file_size': f'{file_size / (1024*1024):.2f} MB'
            })
            
        except Exception as db_error:
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': f'Failed to save song: {str(db_error)}'
            }), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    try:
        song = Song.query.get_or_404(song_id)
        song.is_active = False  # Soft delete
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Song removed from library successfully!'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Training endpoints
@app.route('/api/training/status')
def training_status():
    try:
        latest_session = TrainingSession.query.order_by(TrainingSession.created_at.desc()).first()
        
        if not latest_session:
            return jsonify({
                'success': True,
                'status': {
                    'is_training': False,
                    'progress': 0,
                    'current_epoch': 0,
                    'current_loss': 0,
                    'status': 'not_started'
                }
            })
        
        # Simulate training progress if status is training
        if latest_session.status == 'training' and latest_session.progress < 100:
            latest_session.progress = min(100, latest_session.progress + random.randint(2, 8))
            if latest_session.progress >= 100:
                latest_session.status = 'completed'
                latest_session.final_accuracy = random.uniform(0.85, 0.95)
                latest_session.completed_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'status': {
                'is_training': latest_session.status == 'training',
                'progress': latest_session.progress,
                'current_epoch': int(latest_session.progress * latest_session.epochs / 100),
                'current_loss': round(random.uniform(0.1, 0.5), 3),
                'status': latest_session.status,
                'session_id': latest_session.session_id
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/start', methods=['POST'])
def start_training():
    try:
        # Validate prerequisites
        songs_count = Song.query.filter_by(is_active=True).count()
        if songs_count < 3:  # Reduced for testing
            return jsonify({
                'success': False, 
                'error': f'Need at least 3 songs to start training. Currently have {songs_count} songs.'
            }), 400
        
        # Get training configuration
        data = request.get_json() or {}
        
        # Create training session
        session_id = str(uuid.uuid4())
        
        training_session = TrainingSession(
            session_id=session_id,
            status='training',
            progress=0,
            epochs=int(data.get('epochs', 100)),
            learning_rate=float(data.get('learning_rate', 0.001)),
            batch_size=int(data.get('batch_size', 32)),
            songs_used=songs_count
        )
        
        db.session.add(training_session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Training started successfully!',
            'estimated_time': '30-45 minutes'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    try:
        latest_session = TrainingSession.query.filter_by(status='training').order_by(TrainingSession.created_at.desc()).first()
        
        if latest_session:
            latest_session.status = 'stopped'
            latest_session.completed_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Training stopped successfully!'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No active training session found'
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Generation endpoints
@app.route('/api/generation/generate', methods=['POST'])
def generate_music():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['lyrics', 'maqam', 'style', 'tempo', 'emotion']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Check training data
        songs_count = Song.query.filter_by(is_active=True).count()
        if songs_count < 3:
            return jsonify({
                'success': False,
                'error': f'Need at least 3 songs in library for generation. Currently have {songs_count} songs.'
            }), 400
        
        # Validate tempo
        try:
            tempo_int = int(data['tempo'])
            if tempo_int < 60 or tempo_int > 180:
                return jsonify({'success': False, 'error': 'Tempo must be between 60 and 180 BPM'}), 400
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid tempo value'}), 400
        
        # Create generated song record
        generated_song = GeneratedSong(
            title=data.get('title', f'Generated Song {GeneratedSong.query.count() + 1}'),
            lyrics=data['lyrics'],
            maqam=data['maqam'],
            style=data['style'],
            tempo=tempo_int,
            emotion=data['emotion'],
            region=data.get('region', 'Mixed'),
            composer=data.get('composer'),
            poem_bahr=data.get('poem_bahr'),
            duration='Medium',
            instruments='Modern',
            creativity=7,
            generation_time=round(random.uniform(2.0, 5.0), 1),
            model_version='v1.0',
            training_session_id='demo'
        )
        
        db.session.add(generated_song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Song "{generated_song.title}" generated successfully!',
            'song_id': generated_song.id,
            'generation_time': f'{generated_song.generation_time} seconds'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/list')
def list_generated_songs():
    try:
        songs = GeneratedSong.query.order_by(GeneratedSong.created_at.desc()).all()
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/<int:song_id>', methods=['DELETE'])
def delete_generated_song(song_id):
    try:
        song = GeneratedSong.query.get_or_404(song_id)
        db.session.delete(song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Generated song deleted successfully!'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Static file serving
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
