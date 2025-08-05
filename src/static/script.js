// Global variables
let currentTab = 'dashboard';
let trainingInterval = null;
let isTraining = false;
let selectedAudioFile = null;
let selectedLyricsFile = null;
let selectedGenerationLyricsFile = null;

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadDashboardData();
    loadSongs();
    loadGeneratedSongs();
    checkTrainingStatus();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tab navigation
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", function() {
            switchTab(this.dataset.tab);
        });
    });

    // Audio file upload
    const fileInput = document.getElementById("audio-file");
    const uploadArea = document.getElementById("file-upload-area");
    const browseButton = document.querySelector("#file-upload-area .browse-btn");

    if (fileInput) {
        fileInput.addEventListener("change", handleFileSelect);
    }

    if (browseButton) {
        browseButton.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    if (uploadArea) {
        uploadArea.addEventListener("dragover", handleDragOver);
        uploadArea.addEventListener("drop", handleFileDrop);
        uploadArea.addEventListener("click", function(e) {
            if (e.target === uploadArea || e.target.classList.contains('upload-text')) {
                if (fileInput) {
                    fileInput.click();
                }
            }
        });
    }

    // Lyrics file upload
    const lyricsFileInput = document.getElementById("lyrics-file");
    const lyricsUploadArea = document.getElementById("lyrics-upload-area");
    const lyricsBrowseButton = document.querySelector("#lyrics-upload-area .browse-btn");

    if (lyricsFileInput) {
        lyricsFileInput.addEventListener("change", handleLyricsFileSelect);
    }

    if (lyricsBrowseButton) {
        lyricsBrowseButton.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (lyricsFileInput) {
                lyricsFileInput.click();
            }
        });
    }

    if (lyricsUploadArea) {
        lyricsUploadArea.addEventListener("dragover", handleLyricsDragOver);
        lyricsUploadArea.addEventListener("drop", handleLyricsFileDrop);
        lyricsUploadArea.addEventListener("click", function(e) {
            if (e.target === lyricsUploadArea || e.target.classList.contains('upload-text')) {
                if (lyricsFileInput) {
                    lyricsFileInput.click();
                }
            }
        });
    }

    // Upload form
    const uploadForm = document.getElementById("upload-form");
    if (uploadForm) {
        uploadForm.addEventListener("submit", handleUpload);
    }

    // Upload button direct click handler
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleUpload);
    }

    // Training controls
    const startTrainingBtn = document.getElementById('start-training');
    const stopTrainingBtn = document.getElementById('stop-training');

    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', startTraining);
    }

    if (stopTrainingBtn) {
        stopTrainingBtn.addEventListener('click', stopTraining);
    }

    // Generation controls
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGeneration);
    }

    // Generation lyrics file
    const genLyricsFileInput = document.getElementById("generation-lyrics-file");
    const genLyricsUploadArea = document.getElementById("generation-lyrics-upload-area");
    const genLyricsBrowseButton = document.querySelector("#generation-lyrics-upload-area .browse-btn");

    if (genLyricsFileInput) {
        genLyricsFileInput.addEventListener("change", handleGenerationLyricsFileSelect);
    }

    if (genLyricsBrowseButton) {
        genLyricsBrowseButton.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (genLyricsFileInput) {
                genLyricsFileInput.click();
            }
        });
    }

    if (genLyricsUploadArea) {
        genLyricsUploadArea.addEventListener("dragover", handleGenerationLyricsDragOver);
        genLyricsUploadArea.addEventListener("drop", handleGenerationLyricsFileDrop);
        genLyricsUploadArea.addEventListener("click", function(e) {
            if (e.target === genLyricsUploadArea || e.target.classList.contains('upload-text')) {
                if (genLyricsFileInput) {
                    genLyricsFileInput.click();
                }
            }
        });
    }
}

// File handling functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedAudioFile = file;
        updateFileDisplay(file, 'file-upload-area');
    }
}

function handleLyricsFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedLyricsFile = file;
        updateLyricsFileDisplay(file, 'lyrics-upload-area');
    }
}

function handleGenerationLyricsFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedGenerationLyricsFile = file;
        updateLyricsFileDisplay(file, 'generation-lyrics-upload-area');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

function handleLyricsDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

function handleGenerationLyricsDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
            selectedAudioFile = file;
            updateFileDisplay(file, 'file-upload-area');
        } else {
            alert('Please select a valid audio file (MP3, WAV, FLAC, or M4A)');
        }
    }
}

function handleLyricsFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.txt')) {
            selectedLyricsFile = file;
            updateLyricsFileDisplay(file, 'lyrics-upload-area');
        } else {
            alert('Please select a valid text file (.txt)');
        }
    }
}

function handleGenerationLyricsFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.txt')) {
            selectedGenerationLyricsFile = file;
            updateLyricsFileDisplay(file, 'generation-lyrics-upload-area');
        } else {
            alert('Please select a valid text file (.txt)');
        }
    }
}

function updateFileDisplay(file, areaId) {
    const uploadArea = document.getElementById(areaId);
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="file-selected">
                <div class="file-icon">
                    <i class="fas fa-music"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
                <button type="button" class="remove-file" onclick="removeFile('${areaId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
}

function updateLyricsFileDisplay(file, areaId) {
    const uploadArea = document.getElementById(areaId);
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="file-selected">
                <div class="file-icon">
                    <i class="fas fa-file-text"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${(file.size / 1024).toFixed(2)} KB</div>
                </div>
                <button type="button" class="remove-file" onclick="removeLyricsFile('${areaId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
}

function removeFile(areaId) {
    selectedAudioFile = null;
    const uploadArea = document.getElementById(areaId);
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag and drop your audio file here, or click to browse</p>
            <button type="button" class="browse-btn">Browse Files</button>
        `;
        
        const browseButton = document.querySelector(`#${areaId} .browse-btn`);
        if (browseButton) {
            browseButton.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                const fileInput = document.getElementById("audio-file");
                if (fileInput) {
                    fileInput.click();
                }
            });
        }
    }
    
    const fileInput = document.getElementById("audio-file");
    if (fileInput) {
        fileInput.value = '';
    }
}

function removeLyricsFile(areaId) {
    if (areaId === 'lyrics-upload-area') {
        selectedLyricsFile = null;
    } else if (areaId === 'generation-lyrics-upload-area') {
        selectedGenerationLyricsFile = null;
    }
    
    const uploadArea = document.getElementById(areaId);
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-file-text"></i>
            <p>Drag and drop your lyrics .txt file here, or click to browse</p>
            <button type="button" class="browse-btn">Browse Lyrics File</button>
        `;
        
        const browseButton = document.querySelector(`#${areaId} .browse-btn`);
        if (browseButton) {
            browseButton.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                const fileInput = areaId === 'lyrics-upload-area' ? 
                    document.getElementById("lyrics-file") : 
                    document.getElementById("generation-lyrics-file");
                if (fileInput) {
                    fileInput.click();
                }
            });
        }
    }
}

// Upload handling
function handleUpload(e) {
    e.preventDefault();
    
    if (!selectedAudioFile) {
        alert('Please select an audio file');
        return;
    }
    
    if (!selectedLyricsFile) {
        alert('Please select a lyrics .txt file');
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
    formData.append('composer', document.getElementById('composer').value);
    formData.append('maqam', document.getElementById('maqam').value);
    formData.append('style', document.getElementById('style').value);
    formData.append('tempo', document.getElementById('tempo').value);
    formData.append('emotion', document.getElementById('emotion').value);
    formData.append('region', document.getElementById('region').value);
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
            location.reload();
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

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;
    
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'dashboard') {
        loadDashboardData();
    } else if (tabName === 'upload') {
        loadSongs();
    } else if (tabName === 'training') {
        checkTrainingStatus();
    } else if (tabName === 'generation') {
        loadGeneratedSongs();
    }
}

// Dashboard functions
function loadDashboardData() {
    fetch(`${API_BASE}/dashboard/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('songs-count').textContent = data.stats.songs_count;
                document.getElementById('total-size').textContent = data.stats.total_size_mb + ' MB';
                document.getElementById('training-sessions').textContent = data.stats.training_sessions;
                document.getElementById('generated-count').textContent = data.stats.generated_count;
            }
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

// Songs functions
function loadSongs() {
    fetch(`${API_BASE}/songs/list`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('songs-list');
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
                            <p><strong>Uploaded:</strong> ${new Date(song.created_at).toLocaleDateString()}</p>
                        </div>
                        <div class="song-actions">
                            <button onclick="deleteSong(${song.id})" class="delete-btn">Delete</button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No songs uploaded yet. Upload your first song above!</p>';
            }
        })
        .catch(error => {
            console.error('Error loading songs:', error);
            document.getElementById('songs-list').innerHTML = '<p>Error loading songs.</p>';
        });
}

function deleteSong(songId) {
    if (confirm('Are you sure you want to delete this song?')) {
        fetch(`${API_BASE}/songs/${songId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Song deleted successfully');
                loadSongs();
                loadDashboardData();
            } else {
                alert('Delete failed: ' + data.error);
            }
        })
        .catch(error => {
            alert('Delete failed: ' + error.message);
        });
    }
}

// Training functions
function checkTrainingStatus() {
    fetch(`${API_BASE}/training/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const status = data.status;
                updateTrainingUI(status);
                
                if (status.is_training) {
                    setTimeout(checkTrainingStatus, 1000);
                }
            }
        })
        .catch(error => {
            console.error('Error checking training status:', error);
        });
}

function updateTrainingUI(status) {
    const statusElement = document.getElementById('training-status');
    const progressElement = document.getElementById('training-progress');
    const startBtn = document.getElementById('start-training');
    const stopBtn = document.getElementById('stop-training');
    
    if (statusElement) {
        statusElement.textContent = `Status: ${status.status} (${status.progress}%)`;
    }
    
    if (progressElement) {
        progressElement.style.width = `${status.progress}%`;
    }
    
    if (startBtn && stopBtn) {
        startBtn.disabled = status.is_training;
        stopBtn.disabled = !status.is_training;
    }
}

function startTraining() {
    const epochs = document.getElementById('epochs').value;
    const learningRate = document.getElementById('learning-rate').value;
    const batchSize = document.getElementById('batch-size').value;
    
    fetch(`${API_BASE}/training/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            epochs: parseInt(epochs),
            learning_rate: parseFloat(learningRate),
            batch_size: parseInt(batchSize)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Training started successfully!');
            checkTrainingStatus();
        } else {
            alert('Failed to start training: ' + data.error);
        }
    })
    .catch(error => {
        alert('Failed to start training: ' + error.message);
    });
}

function stopTraining() {
    fetch(`${API_BASE}/training/stop`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Training stopped successfully!');
            checkTrainingStatus();
        } else {
            alert('Failed to stop training: ' + data.error);
        }
    })
    .catch(error => {
        alert('Failed to stop training: ' + error.message);
    });
}

// Generation functions
function handleGeneration(e) {
    e.preventDefault();
    
    if (!selectedGenerationLyricsFile) {
        alert('Please select a lyrics .txt file for generation');
        return;
    }
    
    const formData = new FormData();
    formData.append('lyrics_file', selectedGenerationLyricsFile);
    formData.append('maqam', document.getElementById('gen-maqam').value);
    formData.append('style', document.getElementById('gen-style').value);
    formData.append('tempo', document.getElementById('gen-tempo').value);
    formData.append('emotion', document.getElementById('gen-emotion').value);
    formData.append('region', document.getElementById('gen-region').value);
    
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    fetch(`${API_BASE}/generation/generate`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Song generated successfully! Generation time: ${data.generation_time}`);
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
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Song';
    });
}

function loadGeneratedSongs() {
    fetch(`${API_BASE}/generation/list`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('generated-songs-list');
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
                                <div class="lyrics-text">${song.lyrics.substring(0, 150)}${song.lyrics.length > 150 ? '...' : ''}</div>
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
            document.getElementById('generated-songs-list').innerHTML = '<p>Error loading generated songs.</p>';
        });
}

function viewGeneratedSong(songId) {
    fetch(`${API_BASE}/generation/${songId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const song = data.song;
                
                const modalContent = `
                    <div class="modal-overlay" id="song-modal" onclick="closeModal()">
                        <div class="modal-content" onclick="event.stopPropagation()">
                            <div class="modal-header">
                                <h2>${song.title}</h2>
                                <button onclick="closeModal()" class="close-btn">&times;</button>
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
                                    <div class="lyrics-content">${song.lyrics.replace(/\n/g, '  
')}</div>
                                </div>
                                <div class="modal-actions">
                                    <button onclick="downloadGeneratedSong(${song.id})" class="download-btn">
                                        <i class="fas fa-download"></i> Download Song Data
                                    </button>
                                    <button onclick="copyLyrics('${song.lyrics.replace(/'/g, "\\'")}'))" class="copy-btn">
                                        <i class="fas fa-copy"></i> Copy Lyrics
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalContent);
            } else {
                alert('Error loading song details: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error loading song: ' + error.message);
        });
}

function downloadGeneratedSong(songId) {
    fetch(`${API_BASE}/generation/${songId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const song = data.song;
                
                const songData = {
                    title: song.title,
                    maqam: song.maqam,
                    style: song.style,
                    tempo: song.tempo,
                    emotion: song.emotion,
                    region: song.region,
                    lyrics: song.lyrics,
                    generation_time: song.generation_time,
                    created_at: song.created_at,
                    generated_by: "Arabic Music AI"
                };
                
                // Download JSON file
                const dataStr = JSON.stringify(songData, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}_generated_song.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                // Download lyrics text file
                const lyricsBlob = new Blob([song.lyrics], {type: 'text/plain;charset=utf-8'});
                const lyricsUrl = URL.createObjectURL(lyricsBlob);
                
                const lyricsLink = document.createElement('a');
                lyricsLink.href = lyricsUrl;
                lyricsLink.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}_lyrics.txt`;
                document.body.appendChild(lyricsLink);
                lyricsLink.click();
                document.body.removeChild(lyricsLink);
                URL.revokeObjectURL(lyricsUrl);
                
                alert('Song data and lyrics downloaded successfully!');
            } else {
                alert('Error downloading song: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error downloading song: ' + error.message);
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

function deleteGeneratedSong(songId) {
    if (confirm('Are you sure you want to delete this generated song?')) {
        fetch(`${API_BASE}/generation/${songId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Generated song deleted successfully');
                loadGeneratedSongs();
                loadDashboardData();
            } else {
                alert('Delete failed: ' + data.error);
            }
        })
        .catch(error => {
            alert('Delete failed: ' + error.message);
        });
    }
}

function showToast(message, type = 'info') {
    alert(message);
}
