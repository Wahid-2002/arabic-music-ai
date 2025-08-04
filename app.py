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
import threading

# Create Flask app
app = Flask(__name__, static_folder='src/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# SIMPLE: Always use SQLite - works everywhere, no database setup needed
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///arabic_music_ai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

print("✅ Using SQLite database - no external database required")

# Initialize extensions
CORS(app)
db = SQLAlchemy(app)

# Global variable to track active training
active_training_session = None
training_thread = None

# Allowed file extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Song model - PRESERVES EXISTING DATA
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

# Training progress simulation function
def simulate_training_progress(session_id):
    """Background function to simulate training progress"""
    global active_training_session
    
    try:
        with app.app_context():
            session = TrainingSession.query.get(session_id)
            if not session:
                return
            
            print(f"🧠 Starting training simulation for session {session_id}")
            
            # Simulate training progress over 60 seconds (1 minute)
            total_steps = 100
            step_duration = 0.6  # 60 seconds / 100 steps = 0.6 seconds per step
            
            for step in range(1, total_steps + 1):
                if session.status != 'training':
                    print(f"🛑 Training stopped at step {step}")
                    break
                
                # Update progress
                session.progress = step
                
                # Add some realistic training messages
                if step % 10 == 0:
                    print(f"🧠 Training progress: {step}% - Epoch {step//10}/10")
                
                # Simulate different training phases
                if step <= 20:
                    session.status = 'training'  # Initial training
                elif step <= 80:
                    session.status = 'training'  # Main training
                else:
                    session.status = 'training'  # Final optimization
                
                db.session.commit()
                time.sleep(step_duration)
            
            # Complete training
            if session.status == 'training':
                session.status = 'completed'
                session.progress = 100
                session.completed_at = datetime.utcnow()
                db.session.commit()
                print(f"✅ Training completed for session {session_id}")
            
            active_training_session = None
            
    except Exception as e:
        print(f"❌ Training simulation error: {e}")
        with app.app_context():
            session = TrainingSession.query.get(session_id)
            if session:
                session.status = 'error'
                db.session.commit()
        active_training_session = None

# Create tables and preserve existing data
with app.app_context():
    try:
        db.create_all()
        print("✅ SQLite database tables created successfully!")
        
        # Check existing songs count
        existing_songs = Song.query.count()
        print(f"📊 Found {existing_songs} existing songs in database")
        
        # Only add sample song if NO songs exist (preserves user data)
        if existing_songs == 0:
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
            print("✅ Sample song added to SQLite database!")
        else:
            print("✅ Preserving existing songs - no sample data added")
            
    except Exception as e:
        print(f"❌ Database setup error: {e}")

# API Routes (Upload route unchanged to preserve functionality)
@app.route('/api/songs/upload', methods=['POST'])
def upload_song():
    try:
        print("=== UPLOAD REQUEST RECEIVED ===")
        print(f"Files: {list(request.files.keys())}")
        print(f"Form: {dict(request.form)}")
        
        # Get files
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
            return jsonify({'success': False, 'error': 'No audio file found'}), 400
            
        if not lyrics_file:
            return jsonify({'success': False, 'error': 'No lyrics file found'}), 400
        
        # Read lyrics content
        try:
            lyrics_content = lyrics_file.read().decode('utf-8')
            print(f"✅ Lyrics read successfully, length: {len(lyrics_content)}")
        except Exception as e:
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
        
        # Calculate file size
        audio_file.seek(0, 2)
        file_size_bytes = audio_file.tell()
        audio_file.seek(0)
        file_size_mb = file_size_bytes / (1024 * 1024)
        
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
        
        # Save to database
        try:
            db.session.add(song)
            db.session.commit()
            print(f"✅ Song saved successfully with ID: {song.id}")
            
            return jsonify({
                'success': True,
                'message': f'Song "{title}" uploaded successfully!',
                'song_id': song.id,
                'file_size': f'{file_size_mb:.2f} MB'
            })
            
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")
            db.session.rollback()
            return jsonify({'success': False, 'error': f'Database error: {str(db_error)}'}), 500
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/songs/list')
def list_songs():
    try:
        print("=== LIST SONGS REQUEST ===")
        songs = Song.query.order_by(Song.created_at.desc()).all()
        print(f"Found {len(songs)} songs in SQLite database")
        
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

# FIXED: Training routes with working progress simulation
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
    global active_training_session, training_thread
    
    try:
        # Check if training is already active
        if active_training_session:
            return jsonify({'success': False, 'error': 'Training is already in progress'}), 400
        
        data = request.get_json() or {}
        
        # Create new training session
        session = TrainingSession(
            status='training',
            progress=0,
            epochs=data.get('epochs', 100),
            learning_rate=data.get('learning_rate', 0.001),
            batch_size=data.get('batch_size', 32)
        )
        
        db.session.add(session)
        db.session.commit()
        
        # Set as active session
        active_training_session = session.id
        
        # Start background training simulation
        training_thread = threading.Thread(
            target=simulate_training_progress, 
            args=(session.id,),
            daemon=True
        )
        training_thread.start()
        
        print(f"🧠 Training started for session {session.id}")
        
        return jsonify({
            'success': True,
            'message': 'Training started successfully! Progress will update automatically.',
            'session_id': session.id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    global active_training_session
    
    try:
        session = TrainingSession.query.filter_by(status='training').first()
        if session:
            session.status = 'stopped'
            session.completed_at = datetime.utcnow()
            db.session.commit()
            
            # Clear active session
            active_training_session = None
            
            print(f"🛑 Training stopped for session {session.id}")
            
            return jsonify({'success': True, 'message': 'Training stopped successfully!'})
        else:
            return jsonify({'success': False, 'error': 'No active training session found'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Generation routes (unchanged)
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
        
        # Generate title from lyrics
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
    return jsonify({'status': 'healthy', 'message': 'Arabic Music AI is running with SQLite!'})

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
