#!/usr/bin/env python3
"""
Database migration script to update GeneratedSong table schema
"""

import os
import sys
import sqlite3
from datetime import datetime

def migrate_database():
    """Migrate the database to support new GeneratedSong schema"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')
    
    if not os.path.exists(db_path):
        print("❌ Database file not found. Creating new database...")
        return False
    
    print(f"🔧 Migrating database: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current table structure
        cursor.execute("PRAGMA table_info(generated_song)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Current columns: {columns}")
        
        # Add missing columns if they don't exist
        new_columns = [
            ('title', 'VARCHAR(200)'),
            ('lyrics', 'TEXT'),
            ('region', 'VARCHAR(50)'),
            ('audio_file_path', 'VARCHAR(500)'),
            ('audio_filename', 'VARCHAR(200)'),
            ('file_size_mb', 'FLOAT'),
            ('duration_seconds', 'FLOAT'),
            ('created_at', 'DATETIME')
        ]
        
        for column_name, column_type in new_columns:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE generated_song ADD COLUMN {column_name} {column_type}")
                    print(f"✅ Added column: {column_name}")
                except sqlite3.OperationalError as e:
                    print(f"⚠️ Could not add column {column_name}: {e}")
        
        # Update existing records to have default values
        cursor.execute("""
            UPDATE generated_song 
            SET title = COALESCE(title, 'Generated Song'),
                lyrics = COALESCE(lyrics, input_lyrics),
                region = COALESCE(region, 'mixed'),
                created_at = COALESCE(created_at, generation_date)
            WHERE title IS NULL OR lyrics IS NULL OR region IS NULL OR created_at IS NULL
        """)
        
        conn.commit()
        print("✅ Database migration completed successfully!")
        
        # Show updated table structure
        cursor.execute("PRAGMA table_info(generated_song)")
        new_columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Updated columns: {new_columns}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Starting database migration...")
    success = migrate_database()
    if success:
        print("🎉 Migration completed! You can now restart the Flask application.")
    else:
        print("❌ Migration failed. Please check the errors above.")

