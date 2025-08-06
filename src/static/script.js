// Global variables
let selectedAudioFile = null;
let selectedLyricsFile = null;
let selectedGenerationLyricsFile = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, setting up...');
    setupTabs();
    setupFileUploads();
    setupButtons();
    loadData();
});

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// File upload setup
function setupFileUploads() {
    // Audio file upload
    const audioInput = document.getElementById('audio-file');
    const audioArea = document.getElementById('file-upload-area');
    const audioBrowse = document.querySelector('#file-upload-area .browse-btn');
    
    if (audioInput) {
        audioInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                selectedAudioFile = this.files[0];
                showSelectedFile(audioArea, this.files[0], 'audio');
            }
        });
    }
    
    if (audioBrowse) {
        audioBrowse.addEventListener('click', function(e) {
            e.preventDefault();
            if (audioInput) audioInput.click();
        });
    }
    
    // Lyrics file upload
    const lyricsInput = document.getElementById('lyrics-file');
    const lyricsArea = document.getElementById('lyrics-upload-area');
    const lyricsBrowse = document.querySelector('#lyrics-upload-area .browse-btn');
    
    if (lyricsInput) {
        lyricsInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                selectedLyricsFile = this.files[0];
                showSelectedFile(lyricsArea, this.files[0], 'lyrics');
            }
        });
    }
    
    if (lyricsBrowse) {
        lyricsBrowse.addEventListener('click', function(e) {
            e.preventDefault();
            if (lyricsInput) lyricsInput.click();
        });
    }
    
    // Generation lyrics file upload
    const genLyricsInput = document.getElementById('generation-lyrics-file');
    const genLyricsArea = document.getElementById('generation-lyrics-upload-area');
    const genLyricsBrowse = document.querySelector('#generation-lyrics-upload-area .browse-btn');
    
    if (genLyricsInput) {
        genLyricsInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                selectedGenerationLyricsFile = this.files[0];
                showSelectedFile(genLyricsArea, this.files[0], 'generation-lyrics');
            }
        });
    }
    
    if (genLyricsBrowse) {
        genLyricsBrowse.addEventListener('click', function(e) {
            e.preventDefault();
            if (genLyricsInput) genLyricsInput.click();
        });
    }
}

// Show selected file
function showSelectedFile(area, file, type) {
    const size = (file.size / 1024 / 1024).toFixed(2);
    area.innerHTML = `
        <div class="file-selected">
            <div class="file-icon">
                <i class="fas fa-${type === 'lyrics' || type === 'generation-lyrics' ? 'file-text' : 'music'}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${size} MB</div>
            </div>
            <button type="button" class="remove-file" onclick="removeFile('${type}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

// Remove file
function removeFile(type) {
    if (type === 'audio') {
        selectedAudioFile = null;
        const area = document.getElementById('file-upload-area');
        const input = document.getElementById('audio-file');
        if (input) input.value = '';
        if (area) {
            area.innerHTML = `
                <i class="fas fa-music"></i>
                <p>Drag and drop your audio file here, or click to browse</p>
                <button type="button" class="browse-btn">Browse Audio File</button>
            `;
            setupFileUploads(); // Re-setup event listeners
        }
    } else if (type === 'lyrics') {
        selectedLyricsFile = null;
        const area = document.getElementById('lyrics-upload-area');
        const input = document.getElementById('lyrics-file');
        if (input) input.value = '';
        if (area) {
            area.innerHTML = `
                <i class="fas fa-file-text"></i>
                <p>Drag and drop your lyrics .txt file here, or click to browse</p>
                <button type="button" class="browse-btn">Browse Lyrics File</button>
            `;
            setupFileUploads(); // Re-setup event listeners
        }
    } else if (type === 'generation-lyrics') {
        selectedGenerationLyricsFile = null;
        const area = document.getElementById('generation-lyrics-upload-area');
        const input = document.getElementById('generation-lyrics-file');
        if (input) input.value = '';
        if (area) {
            area.innerHTML = `
                <i class="fas fa-file-text"></i>
                <p>Drag and drop your lyrics .txt file here, or click to browse</p>
                <button type="button" class="browse-btn">Browse Lyrics File</button>
            `;
            setupFileUploads(); // Re-setup event listeners
        }
    }
}

// Button setup
function setupButtons() {
    // Upload button
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleUpload();
        });
    }
    
    // Training buttons
    const startTrainingBtn = document.getElementById('start-training-btn');
    const stopTrainingBtn = document.getElementById('stop-training-btn');
    
    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', function() {
            startTraining();
        });
    }
    
    if (stopTrainingBtn) {
        stopTrainingBtn.addEventListener('click', function() {
            stopTraining();
        });
    }
    
    // Generation button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleGeneration();
        });
    }
    
    // Tempo slider
    const tempoSlider = document.getElementById('tempo');
    const tempoValue = document.getElementById('tempo-value');
    if (tempoSlider && tempoValue) {
        tempoSlider.addEventListener('input', function() {
            tempoValue.textContent = this.value + ' BPM';
        });
    }
    
    // Generation tempo slider
    const genTempoSlider = document.getElementById('generation-tempo');
    const genTempoValue = document.getElementById('generation-tempo-value');
    if (genTempoSlider && genTempoValue) {
        genTempoSlider.addEventListener('input', function() {
            genTempoValue.textContent = this.value + ' BPM';
        });
    }
}

// Upload function
function handleUpload() {
    console.log('Upload button clicked');
    
    if (!selectedAudioFile) {
        alert('Please select an audio file');
        return;
    }
    
    if (!selectedLyricsFile) {
        alert('Please select a lyrics file');
        return;
    }
    
    const title = document.getElementById('title').value.trim();
    const artist = document.getElementById('artist').value.trim();
    
    if (!title || !artist) {
        alert('Please fill in title and artist');
        return;
    }
    
    const formData = new FormData();
    formData.append('audio_file', selectedAudioFile);
    formData.append('lyrics_file', selectedLyricsFile);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('maqam', document.getElementById('maqam').value);
    formData.append('style', document.getElementById('style').value);
    formData.append('tempo', document.getElementById('tempo').value);
    formData.append('emotion', document.getElementById('emotion').value);
    formData.append('region', document.getElementById('region').value);
    formData.append('composer', document.getElementById('composer').value);
    formData.append('poem_bahr', document.getElementById('poem-bahr').value);
    
    const uploadBtn = document.getElementById('upload-btn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    
    fetch('/api/songs/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Song uploaded successfully!');
            // Reset form
            document.getElementById('upload-form').reset();
            selectedAudioFile = null;
            selectedLyricsFile = null;
            removeFile('audio');
            removeFile('lyrics');
            loadData();
        } else {
            alert('Upload failed: ' + data.error);
        }
    })
    .catch(error => {
        alert('Upload failed: ' + error.message);
    })
    .finally(() => {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Song';
    });
}

// Generation function
function handleGeneration() {
    console.log('Generate button clicked');
    
    if (!selectedGenerationLyricsFile) {
        alert('Please select a lyrics file for generation');
        return;
    }
    
    const formData = new FormData();
    formData.append('lyrics_file', selectedGenerationLyricsFile);
    formData.append('maqam', document.getElementById('generation-maqam').value);
    formData.append('style', document.getElementById('generation-style').value);
    formData.append('tempo', document.getElementById('generation-tempo').value);
    formData.append('emotion', document.getElementById('generation-emotion').value);
    formData.append('region', document.getElementById('generation-region').value);
    
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    fetch('/api/generation/generate', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Song generated successfully!');
            loadGeneratedSongs();
            loadDashboardData();
        } else {
            alert('Generation failed: ' + data.error);
        }
    })
    .catch(error => {
        alert('Generation failed: ' + error.message);
    })
    .finally(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Song';
    });
}

// Training functions
function startTraining() {
    fetch('/api/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Training started!');
            checkTrainingStatus();
        } else {
            alert('Failed to start training: ' + data.error);
        }
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}

function stopTraining() {
    fetch('/api/training/stop', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Training stopped!');
            checkTrainingStatus();
        } else {
            alert('Failed to stop training: ' + data.error);
        }
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}

function checkTrainingStatus() {
    fetch('/api/training/status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const status = data.status;
                const progressBar = document.querySelector('.progress-fill');
                const progressText = document.querySelector('.progress-text');
                const startBtn = document.getElementById('start-training-btn');
                const stopBtn = document.getElementById('stop-training-btn');
                
                if (progressBar) {
                    progressBar.style.width = status.progress + '%';
                }
                
                if (progressText) {
                    progressText.textContent = `Status: ${status.status} (${status.progress}%)`;
                }
                
                if (startBtn) {
                    startBtn.disabled = status.is_training;
                }
                
                if (stopBtn) {
                    stopBtn.disabled = !status.is_training;
                }
                
                // Continue checking if training
                if (status.is_training) {
                    setTimeout(checkTrainingStatus, 1000);
                }
            }
        })
        .catch(error => {
            console.error('Error checking training status:', error);
        });
}

// Load data functions
function loadData() {
    loadDashboardData();
    loadSongs();
    loadGeneratedSongs();
    checkTrainingStatus();
}

function loadDashboardData() {
    fetch('/api/dashboard/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const stats = data.stats;
                const songsCount = document.getElementById('songs-count');
                const totalSize = document.getElementById('total-size');
                const trainingSessions = document.getElementById('training-sessions');
                const generatedCount = document.getElementById('generated-count');
                
                if (songsCount) songsCount.textContent = stats.songs_count;
                if (totalSize) totalSize.textContent = stats.total_size_mb + ' MB';
                if (trainingSessions) trainingSessions.textContent = stats.training_sessions;
                if (generatedCount) generatedCount.textContent = stats.generated_count;
            }
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

function loadSongs() {
    fetch('/api/songs/list')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('songs-list');
            if (!container) return;
            
            if (data.success && data.songs && data.songs.length > 0) {
                container.innerHTML = data.songs.map(song => `
                    <div class="song-card">
                        <div class="song-info">
                            <h3>${song.title}</h3>
                            <p><strong>Artist:</strong> ${song.artist}</p>
                            <p><strong>Maqam:</strong> ${song.maqam} | <strong>Style:</strong> ${song.style}</p>
                            <p><strong>Tempo:</strong> ${song.tempo} BPM | <strong>Emotion:</strong> ${song.emotion}</p>
                            <p><strong>Region:</strong> ${song.region} | <strong>Size:</strong> ${song.file_size_mb} MB</p>
                            ${song.composer ? `<p><strong>Composer:</strong> ${song.composer}</p>` : ''}
                            ${song.poem_bahr ? `<p><strong>Poem Bahr:</strong> ${song.poem_bahr}</p>` : ''}
                            <div class="lyrics-preview">
                                <strong>Lyrics Preview:</strong>
                                <div class="lyrics-text">${song.lyrics.substring(0, 100)}...</div>
                            </div>
                        </div>
                        <div class="song-actions">
                            <button onclick="deleteSong(${song.id})" class="delete-btn">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No songs uploaded yet. Upload your first song above!</p>';
            }
        })
        .catch(error => {
            console.error('Error loading songs:', error);
        });
}

function loadGeneratedSongs() {
    fetch('/api/generation/list')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('generated-songs-list');
            if (!container) return;
            
            if (data.success && data.songs && data.songs.length > 0) {
                container.innerHTML = data.songs.map(song => `
                    <div class="song-card">
                        <div class="song-info">
                            <h3>${song.title}</h3>
                            <p><strong>Maqam:</strong> ${song.maqam} | <strong>Style:</strong> ${song.style}</p>
                            <p><strong>Tempo:</strong> ${song.tempo} BPM | <strong>Emotion:</strong> ${song.emotion}</p>
                            <p><strong>Region:</strong> ${song.region} | <strong>Generated in:</strong> ${song.generation_time}s</p>
                            <p><strong>Created:</strong> ${new Date(song.created_at).toLocaleDateString()}</p>
                            <div class="lyrics-preview">
                                <strong>Lyrics Preview:</strong>
                                <div class="lyrics-text">${song.lyrics.substring(0, 100)}...</div>
                            </div>
                        </div>
                        <div class="song-actions">
                            <button onclick="viewGeneratedSong(${song.id})" class="view-btn">
                                <i class="fas fa-eye"></i> View Full
                            </button>
                            <button onclick="downloadGeneratedSong(${song.id})" class="download-btn">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button onclick="deleteGeneratedSong(${song.id})" class="delete-btn">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No songs generated yet. Create your first AI-generated song above!</p>';
            }
        })
        .catch(error => {
            console.error('Error loading generated songs:', error);
        });
}

// Delete functions
function deleteSong(songId) {
    if (confirm('Are you sure you want to delete this song?')) {
        fetch(`/api/songs/${songId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Song deleted successfully');
                loadData();
            } else {
                alert('Delete failed: ' + data.error);
            }
        })
        .catch(error => {
            alert('Delete failed: ' + error.message);
        });
    }
}

function deleteGeneratedSong(songId) {
    if (confirm('Are you sure you want to delete this generated song?')) {
        fetch(`/api/generation/${songId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Generated song deleted successfully');
                loadData();
            } else {
                alert('Delete failed: ' + data.error);
            }
        })
        .catch(error => {
            alert('Delete failed: ' + error.message);
        });
    }
}

// View and download functions
function viewGeneratedSong(songId) {
    fetch(`/api/generation/${songId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const song = data.song;
                const modal = document.createElement('div');
                modal.id = 'song-modal';
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>${song.title}</h2>
                            <button class="close-btn" onclick="closeModal()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="song-details">
                                <p><strong>Maqam:</strong> ${song.maqam}</p>
                                <p><strong>Style:</strong> ${song.style}</p>
                                <p><strong>Tempo:</strong> ${song.tempo} BPM</p>
                                <p><strong>Emotion:</strong> ${song.emotion}</p>
                                <p><strong>Region:</strong> ${song.region}</p>
                                <p><strong>Generation Time:</strong> ${song.generation_time} seconds</p>
                                <p><strong>Created:</strong> ${new Date(song.created_at).toLocaleString()}</p>
                            </div>
                            <div class="lyrics-full">
                                <h3>Complete Lyrics:</h3>
                                <div class="lyrics-content">${song.lyrics}</div>
                            </div>
                            <div class="modal-actions">
                                <button onclick="copyLyrics('${song.lyrics.replace(/'/g, "\\'")}'))" class="copy-btn">
                                    <i class="fas fa-copy"></i> Copy Lyrics
                                </button>
                                <button onclick="downloadGeneratedSong(${song.id})" class="download-btn">
                                    <i class="fas fa-download"></i> Download Files
                                </button>
                                <button onclick="closeModal()" class="browse-btn">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            } else {
                alert('Error loading song: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error loading song: ' + error.message);
        });
}

function downloadGeneratedSong(songId) {
    fetch(`/api/generation/${songId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const song = data.song;
                
                // Download JSON file
                const jsonData = {
                    ...song,
                    generated_by: "Arabic Music AI"
                };
                const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                const jsonUrl = URL.createObjectURL(jsonBlob);
                const jsonLink = document.createElement('a');
                jsonLink.href = jsonUrl;
                jsonLink.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}_generated_song.json`;
                jsonLink.click();
                
                // Download lyrics file
                const lyricsBlob = new Blob([song.lyrics], { type: 'text/plain;charset=utf-8' });
                const lyricsUrl = URL.createObjectURL(lyricsBlob);
                const lyricsLink = document.createElement('a');
                lyricsLink.href = lyricsUrl;
                lyricsLink.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}_lyrics.txt`;
                lyricsLink.click();
                
                alert('Files downloaded successfully!');
            } else {
                alert('Download failed: ' + data.error);
            }
        })
        .catch(error => {
            alert('Download failed: ' + error.message);
        });
}

function copyLyrics(lyrics) {
    navigator.clipboard.writeText(lyrics).then(() => {
        alert('Lyrics copied to clipboard!');
    }).catch(err => {
        const textArea = document.createElement('textarea');
        textArea.value = lyrics;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Lyrics copied to clipboard!');
    });
}

function closeModal() {
    const modal = document.getElementById('song-modal');
    if (modal) {
        modal.remove();
    }
}
