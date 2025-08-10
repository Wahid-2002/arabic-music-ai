from flask import Blueprint, request, jsonify, current_app, send_file
import os
import json
import uuid
from datetime import datetime
import time
import asyncio
import sys
import random

# Add the parent directory to path to import our music generator
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from music_generator import ArabicMusicGenerator

from src.models.song import db, GeneratedSong

generation_bp = Blueprint('generation', __name__)

# Initialize the music generator
music_generator = ArabicMusicGenerator()

def ensure_generated_dirs():
    """Ensure generated files directories exist"""
    generated_path = os.path.join(current_app.root_path, 'generated_music')
    os.makedirs(generated_path, exist_ok=True)
    return generated_path

@generation_bp.route('/generation/generate', methods=['POST'])
def generate_music():
    """Generate actual MP3 music from lyrics and parameters"""
    try:
        print("=== MUSIC GENERATION REQUEST ===")
        
        # Handle file upload (lyrics file)
        lyrics_file = request.files.get('lyrics_file')
        if not lyrics_file:
            return jsonify({'success': False, 'error': 'No lyrics file provided'}), 400
        
        try:
            lyrics_content = lyrics_file.read().decode('utf-8')
            print(f"✅ Lyrics read successfully, length: {len(lyrics_content)}")
        except Exception as e:
            return jsonify({'success': False, 'error': f'Error reading lyrics file: {str(e)}'}), 400
        
        # Get generation parameters
        maqam = request.form.get('maqam', 'hijaz')
        style = request.form.get('style', 'modern')
        tempo = int(request.form.get('tempo', 120))
        emotion = request.form.get('emotion', 'neutral')
        region = request.form.get('region', 'mixed')
        
        # Generate title from lyrics (first line or random)
        title_line = lyrics_content.split('\n')[0].strip() if lyrics_content else ""
        title = title_line[:50] if title_line else f"Generated Song {random.randint(1, 1000)}"
        
        print(f"🎵 Generating: {title} - {maqam} {style} {emotion} {tempo}BPM")
        
        # Ensure output directory exists
        output_dir = ensure_generated_dirs()
        
        # Record generation start time
        generation_start = time.time()
        
        try:
            # Generate the actual MP3 file
            result = asyncio.run(music_generator.generate_song(
                title=title,
                lyrics=lyrics_content,
                maqam=maqam,
                style=style,
                emotion=emotion,
                region=region,
                tempo=tempo,
                output_dir=output_dir
            ))
            
            if not result['success']:
                return jsonify({
                    'success': False,
                    'error': f"Music generation failed: {result.get('error', 'Unknown error')}"
                }), 500
            
            generation_time = time.time() - generation_start
            
            print(f"✅ Generated MP3: {result['filename']} ({result['file_size_mb']} MB)")
            
            # Create database record with ONLY the required fields
            try:
                generated_song = GeneratedSong(
                    input_lyrics=lyrics_content,  # Use the original field name
                    maqam=maqam,
                    style=style,
                    tempo=tempo,
                    emotion=emotion,
                    generation_time=generation_time
                )
                
                db.session.add(generated_song)
                db.session.commit()
                
                print(f"✅ Saved to database with ID: {generated_song.id}")
                
                return jsonify({
                    'success': True,
                    'message': f'Song "{title}" generated successfully!',
                    'song_id': generated_song.id,
                    'filename': result['filename'],
                    'file_path': result['file_path'],
                    'file_size_mb': result['file_size_mb'],
                    'generation_time': f'{generation_time:.1f} seconds',
                    'duration_seconds': result.get('duration_seconds', 0)
                })
                
            except Exception as db_error:
                print(f"⚠️ Database save failed: {db_error}")
                # Return success anyway since MP3 was generated
                return jsonify({
                    'success': True,
                    'message': f'Song "{title}" generated successfully! (Database save failed but MP3 created)',
                    'filename': result['filename'],
                    'file_path': result['file_path'],
                    'file_size_mb': result['file_size_mb'],
                    'generation_time': f'{generation_time:.1f} seconds',
                    'duration_seconds': result.get('duration_seconds', 0),
                    'warning': 'Database save failed but MP3 file was created successfully'
                })
            
        except Exception as gen_error:
            print(f"❌ Generation error: {gen_error}")
            return jsonify({
                'success': False,
                'error': f'Music generation failed: {str(gen_error)}'
            }), 500
        
    except Exception as e:
        print(f"❌ Request error: {e}")
        return jsonify({'success': False, 'error': f'Request failed: {str(e)}'}), 500

@generation_bp.route('/generation/list', methods=['GET'])
def list_generated_songs():
    """Get all generated songs"""
    try:
        print("=== LIST GENERATED SONGS REQUEST ===")
        songs = GeneratedSong.query.order_by(GeneratedSong.generation_date.desc()).all()
        print(f"Found {len(songs)} generated songs in database")
        
        # Also check for MP3 files in the directory
        generated_dir = os.path.join(current_app.root_path, 'generated_music')
        mp3_files = []
        if os.path.exists(generated_dir):
            mp3_files = [f for f in os.listdir(generated_dir) if f.endswith('.mp3')]
        
        songs_data = []
        for song in songs:
            song_dict = song.to_dict()
            songs_data.append(song_dict)
        
        # Add standalone MP3 files that aren't in database
        for mp3_file in mp3_files:
            file_path = os.path.join(generated_dir, mp3_file)
            file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            
            songs_data.append({
                'id': f'file_{mp3_file}',
                'title': mp3_file.replace('.mp3', ''),
                'lyrics': 'Generated song (database record not found)',
                'maqam': 'unknown',
                'style': 'unknown',
                'tempo': 120,
                'emotion': 'unknown',
                'region': 'unknown',
                'file_path': file_path,
                'filename': mp3_file,
                'file_size_mb': round(file_size, 2),
                'generation_time': 0,
                'created_at': datetime.now().isoformat(),
                'has_audio_file': True
            })
        
        return jsonify({
            'success': True,
            'songs': songs_data
        })
    except Exception as e:
        print(f"❌ List songs error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@generation_bp.route('/generation/download/<path:filename>', methods=['GET'])
def download_generated_song_by_filename(filename):
    """Download MP3 file by filename"""
    try:
        print(f"=== DOWNLOAD REQUEST for file {filename} ===")
        
        generated_dir = os.path.join(current_app.root_path, 'generated_music')
        file_path = os.path.join(generated_dir, filename)
        
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        print(f"✅ Serving file: {file_path}")
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='audio/mpeg'
        )
        
    except Exception as e:
        print(f"❌ Download error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@generation_bp.route('/generation/<int:song_id>/download', methods=['GET'])
def download_generated_song(song_id):
    """Download MP3 file by song ID"""
    try:
        print(f"=== DOWNLOAD REQUEST for song {song_id} ===")
        song = GeneratedSong.query.get_or_404(song_id)
        
        # Try to find the MP3 file
        generated_dir = os.path.join(current_app.root_path, 'generated_music')
        
        # Look for files that might match this song
        if os.path.exists(generated_dir):
            mp3_files = [f for f in os.listdir(generated_dir) if f.endswith('.mp3')]
            if mp3_files:
                # Return the first MP3 file found
                file_path = os.path.join(generated_dir, mp3_files[0])
                return send_file(
                    file_path,
                    as_attachment=True,
                    download_name=mp3_files[0],
                    mimetype='audio/mpeg'
                )
        
        return jsonify({'success': False, 'error': 'No MP3 file found'}), 404
        
    except Exception as e:
        print(f"❌ Download error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@generation_bp.route('/generation/files', methods=['GET'])
def list_mp3_files():
    """List all MP3 files in the generated_music directory"""
    try:
        generated_dir = os.path.join(current_app.root_path, 'generated_music')
        
        if not os.path.exists(generated_dir):
            return jsonify({'success': True, 'files': []})
        
        mp3_files = []
        for filename in os.listdir(generated_dir):
            if filename.endswith('.mp3'):
                file_path = os.path.join(generated_dir, filename)
                file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
                
                mp3_files.append({
                    'filename': filename,
                    'file_size_mb': round(file_size, 2),
                    'download_url': f'/api/generation/download/{filename}'
                })
        
        return jsonify({
            'success': True,
            'files': mp3_files,
            'total_files': len(mp3_files)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

