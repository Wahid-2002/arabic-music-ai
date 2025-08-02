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
import re

# Create Flask app
app = Flask(__name__, static_folder='src/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# FIXED: Smart database configuration that handles Render's broken DATABASE_URL
def fix_database_url():
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        # Local development - use SQLite
        return 'sqlite:///arabic_music_ai.db'
    
    # Fix common Render PostgreSQL URL issues
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    # Fix the broken port issue
    if 'port' in database_url and not re.search(r':\d+/', database_url):
        # Replace literal 'port' with default PostgreSQL port
        database_url = database_url.replace(':port/', ':5432/')
        database_url = database_url.replace(':port@', ':5432@')
    
    # Additional fixes for malformed URLs
    database_url = database_url.replace('postgresql://port:', 'postgresql://user:')
    database_url = database_url.replace('@port:', '@localhost:')
    
    print(f"Fixed DATABASE_URL: {database_url[:50]}...")  # Log first 50 chars for debugging
    return database_url

# Apply the fixed database URL
app.config['SQLALCHEMY_DATABASE_URI'] = fix_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app)
db = SQLAlchemy(app)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Song model - SIMPLE and WORKING
class Song(db.Model):
    __tablename__ = 'songs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    lyrics = db.Column(db.Text, nullable=False)
    maqam = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    tempo = db.Column(db.Integer, nullable=False)
    emotion = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    composer = db.Column(db.String(200), nullable=True)
    poem_bahr = db.Column(db.String(50), nullable=True)
    file_size_mb = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
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
            'file_size_mb': round(self.file_size_mb, 2),
            'created_at': self.created_at.isoformat()
        }

class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(50), nullable=False, default='not_started')
    progress = db.Column(db.Integer, nullable=False, default=0)
    epochs = db.Column(db.Integer, nullable=False, default=100)
    learning_rate = db.Column(db.Float, nullable=False, default=0.001)
    batch_size = db.Column(db.Integer, nullable=False, default=32)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'progress': self.progress,
            'epochs': self.epochs,
            'learning_rate': self.learning_rate,
            'batch_size': self.batch_size,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class GeneratedSong(db.Model):
    __tablename__ = 'generated_songs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    maqam = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    tempo = db.Column(db.Integer, nullable=False)
    emotion = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    lyrics = db.Column(db.Text, nullable=False)
    generation_time = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'maqam': self.maqam,
            'style': self.style,
            'tempo': self.tempo,
            'emotion': self.emotion,
            'region': self.region,
            'lyrics': self.lyrics,
            'generation_time': self.generation_time,
            'created_at': self.created_at.isoformat()
        }

# Create tables and add sample data
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Add sample song if none exist
        if Song.query.count() == 0:
            sample_song = Song(
                title="Sample Arabic Song",
                artist="Test Artist",
                lyrics="هذه أغنية تجريبية\nبكلمات عربية جميلة\nللاختبار والتجربة",
                maqam="hijaz",
                style="modern",
                tempo=120,
                emotion="romantic",
                region="egyptian",
                composer="Sample Composer",
                poem_bahr="baseet",
                file_size_mb=3.5
            )
            db.session.add(sample_song)
            db.session.commit()
            print("✅ Sample song added!")
            
    except Exception as e:
        print(f"❌ Database setup error: {e}")

# API Routes
@app.route('/api/songs/upload', methods=['POST'])
def upload_song():
    try:
        print("=== UPLOAD REQUEST RECEIVED ===")
        print(f"Files: {list(request.files.keys())}")
        print(f"Form: {dict(request.form)}")
        
        # Get files - be flexible with names
        audio_file = None
        lyrics_file = None
        
        for key in request.files:
            file = request.files[key]
            if file.filename:
                if key in ['audio_file', 'audioFile'] or any(ext in file.filename.lower() for ext in ['.mp3', '.wav', '.flac', '.m4a']):
                    audio_file = file
                    print(f"✅ Audio file found: {file.filename}")
                elif key in ['lyrics_file', 'lyricsFile'] or file.filename.lower().endswith('.txt'):
                    lyrics_file = file
                    print(f"✅ Lyrics file found: {file.filename}")
        
        if not audio_file:
            print("❌ No audio file found")
            return jsonify({'success': False, 'error': 'No audio file found'}), 400
            
        if not lyrics_file:
            print("❌ No lyrics file found")
            return jsonify({'success': False, 'error': 'No lyrics file found'}), 400
        
        # Read lyrics content
        try:
            lyrics_content = lyrics_file.read().decode('utf-8')
            print(f"✅ Lyrics read successfully, length: {len(lyrics_content)}")
        except Exception as e:
            print(f"❌ Error reading lyrics: {e}")
            return jsonify({'success': False, 'error': f'Error reading lyrics file: {str(e)}'}), 400
        
        # Get form data with defaults
        title = request.form.get('title', 'Untitled Song')
        artist = request.form.get('artist', 'Unknown Artist')
        maqam = request.form.get('maqam', 'hijaz')
        style = request.form.get('style', 'modern')
        tempo = int(request.form.get('tempo', 120))
        emotion = request.form.get('emotion', 'neutral')
        region = request.form.get('region', 'mixed')
        composer = request.form.get('composer', '')
        poem_bahr = request.form.get('poem_bahr', '')
        
        print(f"Form data - Title: '{title}', Artist: '{artist}', Maqam: '{maqam}'")
        
        # Calculate file size
        audio_file.seek(0, 2)  # Seek to end
        file_size_bytes = audio_file.tell()
        audio_file.seek(0)  # Reset to beginning
        file_size_mb = file_size_bytes / (1024 * 1024)
        
        print("Creating song object...")
        
        # Create song object
        song = Song(
            title=title,
            artist=artist,
            lyrics=lyrics_content,
            maqam=maqam,
            style=style,
            tempo=tempo,
            emotion=emotion,
            region=region,
            composer=composer if composer else None,
            poem_bahr=poem_bahr if poem_bahr else None,
            file_size_mb=file_size_mb
        )
        
        print("Saving to database...")
        
        # Save to database
        try:
            db.session.add(song)
            db.session.commit()
            print(f"✅ Song saved successfully with ID: {song.id}")
            
            # Verify it was saved
            saved_song = Song.query.get(song.id)
            if saved_song:
                print("✅ Verification: Song exists in database")
            else:
                print("❌ Verification: Song not found in database")
            
            return jsonify({
                'success': True,
                'message': f'Song "{title}" uploaded successfully!',
                'song_id': song.id,
                'file_size': f'{file_size_mb:.2f} MB',
                'lyrics_length': len(lyrics_content)
            })
            
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': f'Failed to save song to database: {str(db_error)}'
            }), 500
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/songs/list')
def list_songs():
    try:
        print("=== LIST SONGS REQUEST ===")
        songs = Song.query.order_by(Song.created_at.desc()).all()
        print(f"Found {len(songs)} songs in database")
        
        for song in songs:
            print(f"Song: {song.title} by {song.artist}")
        
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        print(f"❌ List songs error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    try:
        song = Song.query.get_or_404(song_id)
        db.session.delete(song)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Song deleted successfully!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/dashboard/stats')
def dashboard_stats():
    try:
        songs_count = Song.query.count()
        total_size = db.session.query(db.func.sum(Song.file_size_mb)).scalar() or 0
        training_sessions = TrainingSession.query.count()
        generated_count = GeneratedSong.query.count()
        
        return jsonify({
            'success': True,
            'stats': {
                'songs_count': songs_count,
                'total_size_mb': round(total_size, 2),
                'training_sessions': training_sessions,
                'generated_count': generated_count
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/status')
def training_status():
    try:
        session = TrainingSession.query.order_by(TrainingSession.created_at.desc()).first()
        if session:
            return jsonify({
                'success': True,
                'status': {
                    'status': session.status,
                    'progress': session.progress,
                    'is_training': session.status == 'training'
                }
            })
        else:
            return jsonify({
                'success': True,
                'status': {
                    'status': 'not_started',
                    'progress': 0,
                    'is_training': False
                }
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/start', methods=['POST'])
def start_training():
    try:
        data = request.get_json() or {}
        
        session = TrainingSession(
            status='training',
            progress=0,
            epochs=data.get('epochs', 100),
            learning_rate=data.get('learning_rate', 0.001),
            batch_size=data.get('batch_size', 32)
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Training started successfully!',
            'session_id': session.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    try:
        session = TrainingSession.query.filter_by(status='training').first()
        if session:
            session.status = 'stopped'
            session.completed_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'success': True, 'message': 'Training stopped successfully!'})
        else:
            return jsonify({'success': False, 'error': 'No active training session found'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/generate', methods=['POST'])
def generate_music():
    try:
        # Get lyrics file
        lyrics_file = request.files.get('lyrics_file')
        if not lyrics_file:
            return jsonify({'success': False, 'error': 'No lyrics file provided'}), 400
        
        # Read lyrics content
        lyrics_content = lyrics_file.read().decode('utf-8')
        
        # Get form data
        maqam = request.form.get('maqam', 'hijaz')
        style = request.form.get('style', 'modern')
        tempo = int(request.form.get('tempo', 120))
        emotion = request.form.get('emotion', 'neutral')
        region = request.form.get('region', 'mixed')
        
        # Generate title from lyrics (first line)
        title = lyrics_content.split('\n')[0][:50] if lyrics_content else f"Generated Song {random.randint(1, 1000)}"
        
        # Simulate generation time
        generation_time = round(random.uniform(2.0, 8.0), 1)
        
        # Create generated song
        generated_song = GeneratedSong(
            title=title,
            maqam=maqam,
            style=style,
            tempo=tempo,
            emotion=emotion,
            region=region,
            lyrics=lyrics_content,
            generation_time=generation_time
        )
        
        db.session.add(generated_song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Song "{title}" generated successfully!',
            'song_id': generated_song.id,
            'generation_time': f'{generation_time} seconds'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/list')
def list_generated_songs():
    try:
        songs = GeneratedSong.query.order_by(GeneratedSong.created_at.desc()).all()
        return jsonify({'success': True, 'songs': [song.to_dict() for song in songs]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/<int:song_id>', methods=['DELETE'])
def delete_generated_song(song_id):
    try:
        song = GeneratedSong.query.get_or_404(song_id)
        db.session.delete(song)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Generated song deleted successfully!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Health check
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Arabic Music AI is running!'})

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
    app.run(host='0.0.0.0', port=port, debug=True)
