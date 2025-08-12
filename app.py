import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import uuid
import time
import random

# Create Flask app
app = Flask(__name__, static_folder='src/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Use SQLite for now - no PostgreSQL dependencies
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///arabic_music_ai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
print("✅ Using SQLite database - will work on any platform!")

# Initialize extensions
CORS(app)
db = SQLAlchemy(app)

# Simple Song model
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
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)

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
            'upload_date': self.upload_date.isoformat() if self.upload_date else None
        }

# Simple GeneratedSong model
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
    generation_date = db.Column(db.DateTime, default=datetime.utcnow)
    file_info = db.Column(db.Text)  # JSON string with file info

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
            'generation_date': self.generation_date.isoformat() if self.generation_date else None,
            'file_info': json.loads(self.file_info) if self.file_info else None
        }

# Routes
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Arabic Music AI is running!'})

@app.route('/api/songs', methods=['GET'])
def get_songs():
    try:
        songs = Song.query.all()
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/generate', methods=['POST'])
def generate_music():
    """Simplified music generation - creates metadata only for now"""
    try:
        # Get lyrics file
        lyrics_file = request.files.get('lyrics_file')
        if not lyrics_file:
            return jsonify({'success': False, 'error': 'No lyrics file provided'}), 400
        
        lyrics_content = lyrics_file.read().decode('utf-8')
        
        # Get parameters
        maqam = request.form.get('maqam', 'hijaz')
        style = request.form.get('style', 'modern')
        tempo = int(request.form.get('tempo', 120))
        emotion = request.form.get('emotion', 'neutral')
        region = request.form.get('region', 'mixed')
        
        # Generate title
        title = lyrics_content.split('\n')[0].strip()[:50] if lyrics_content else f"Generated Song {random.randint(1, 1000)}"
        
        # Create database record
        generated_song = GeneratedSong(
            title=title,
            lyrics=lyrics_content,
            maqam=maqam,
            style=style,
            tempo=tempo,
            emotion=emotion,
            region=region,
            file_info=json.dumps({
                'status': 'generated',
                'message': 'Audio generation will be added after successful deployment',
                'format': 'metadata_only'
            })
        )
        
        db.session.add(generated_song)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Song "{title}" metadata created successfully!',
            'song_id': generated_song.id,
            'note': 'Audio generation will be enabled after deployment is stable'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generation/list', methods=['GET'])
def list_generated_songs():
    try:
        songs = GeneratedSong.query.order_by(GeneratedSong.generation_date.desc()).all()
        return jsonify({
            'success': True,
            'songs': [song.to_dict() for song in songs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Create tables
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
