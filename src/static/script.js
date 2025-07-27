let selectedAudioFile = null;

// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Load dashboard data
    loadDashboardData();
    loadSongs();

    // Upload form handler
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }

    // File upload handlers
    setupFileUpload();
});

// Setup file upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('audio-file');
    const uploadArea = document.getElementById('file-upload-area');

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        handleFileSelect(e);
    });

    // Drag and drop handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (isValidAudioFile(file)) {
                selectedAudioFile = file;
                showSelectedFile(file);
            } else {
                alert('Please select a valid audio file (MP3, WAV, FLAC, M4A)');
            }
        }
    });

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidAudioFile(file)) {
        alert('Please select a valid audio file (MP3, WAV, FLAC, M4A)');
        return;
    }

    selectedAudioFile = file;
    showSelectedFile(file);
}

// Show selected file
function showSelectedFile(file) {
    document.getElementById('selected-file-name').textContent = file.name;
    document.getElementById('selected-file-size').textContent = formatFileSize(file.size);
    document.getElementById('file-selected').style.display = 'block';
    document.getElementById('upload-btn').disabled = false;
}

// Remove selected file
function removeSelectedFile() {
    selectedAudioFile = null;
    document.getElementById('audio-file').value = '';
    document.getElementById('file-selected').style.display = 'none';
    document.getElementById('upload-btn').disabled = true;
}

// Validate audio file
function isValidAudioFile(file) {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/x-m4a'];
    const validExtensions = ['.mp3', '.wav', '.flac', '.m4a'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('songs-count').textContent = data.stats.songs_count;
            document.getElementById('training-status').textContent = data.stats.is_training ? 'Training' : 'Not Started';
            document.getElementById('model-accuracy').textContent = data.stats.model_accuracy + '%';
            document.getElementById('generated-count').textContent = data.stats.generated_count;
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load songs list with edit functionality
async function loadSongs() {
    try {
        const response = await fetch('/api/songs/list');
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('songs-container');
            if (data.songs.length === 0) {
                container.innerHTML = '<p>No songs uploaded yet.</p>';
            } else {
                container.innerHTML = data.songs.map(song => `
                    <div class="song-item" style="background: rgba(255,255,255,0.8); padding: 20px; border-radius: 15px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div class="song-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #333;">${song.title}</h3>
                            <div class="song-actions">
                                <button onclick="editSong(${song.id})" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 5px; margin-right: 5px; cursor: pointer;">✏️ Edit</button>
                                <button onclick="deleteSong(${song.id})" style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">🗑️ Delete</button>
                            </div>
                        </div>
                        <div class="song-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <p><strong>Artist:</strong> ${song.artist}</p>
                            <p><strong>Maqam:</strong> ${song.maqam}</p>
                            <p><strong>Style:</strong> ${song.style}</p>
                            <p><strong>Region:</strong> ${song.region}</p>
                            <p><strong>Tempo:</strong> ${song.tempo} BPM</p>
                            <p><strong>Emotion:</strong> ${song.emotion}</p>
                            ${song.composer ? `<p><strong>Composer:</strong> ${song.composer}</p>` : ''}
                            ${song.poem_bahr ? `<p><strong>Poem Bahr:</strong> ${song.poem_bahr}</p>` : ''}
                        </div>
                        <div class="song-lyrics" style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 8px;">
                            <strong>Lyrics:</strong>  

                            <div style="max-height: 100px; overflow-y: auto; margin-top: 5px;">${song.lyrics}</div>
                        </div>
                        <div class="song-meta" style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                            <p>Uploaded: ${new Date(song.upload_date).toLocaleDateString()} | File size: ${formatFileSize(song.file_size)}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading songs:', error);
    }
}

// Handle form upload
async function handleUpload(event) {
    event.preventDefault();
    
    if (!selectedAudioFile) {
        alert('Please select an audio file first!');
        return;
    }
    
    const formData = new FormData();
    
    // Add file
    formData.append('audio_file', selectedAudioFile);
    
    // Add form fields
    const formElements = event.target.elements;
    for (let element of formElements) {
        if (element.name && element.value) {
            formData.append(element.name, element.value);
        }
    }
    
    // Disable upload button during upload
    const uploadBtn = document.getElementById('upload-btn');
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    
    try {
        const response = await fetch('/api/songs/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Song uploaded successfully!');
            event.target.reset();
            removeSelectedFile();
            loadDashboardData();
            loadSongs();
        } else {
            alert('Upload failed: ' + result.error);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
    } finally {
        uploadBtn.textContent = originalText;
        uploadBtn.disabled = false;
    }
}

// Edit song function
function editSong(songId) {
    // For now, show a simple prompt - you can enhance this with a modal later
    const newTitle = prompt('Enter new title:');
    if (newTitle) {
        updateSong(songId, { title: newTitle });
    }
}

// Update song
async function updateSong(songId, updates) {
    try {
        const response = await fetch(`/api/songs/${songId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Song updated successfully!');
            loadSongs();
            loadDashboardData();
        } else {
            alert('Update failed: ' + result.error);
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Update failed. Please try again.');
    }
}

// Delete song function
async function deleteSong(songId) {
    if (confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
        try {
            const response = await fetch(`/api/songs/${songId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Song deleted successfully!');
                loadSongs();
                loadDashboardData();
            } else {
                alert('Delete failed: ' + result.error);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Delete failed. Please try again.');
        }
    }
}
