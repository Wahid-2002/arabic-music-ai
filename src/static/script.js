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

    // Generation lyrics file upload
    const generationLyricsFileInput = document.getElementById("generation-lyrics-file");
    const generationLyricsUploadArea = document.getElementById("generation-lyrics-upload-area");
    const generationLyricsBrowseButton = document.querySelector("#generation-lyrics-upload-area .browse-btn");

    if (generationLyricsFileInput) {
        generationLyricsFileInput.addEventListener("change", handleGenerationLyricsFileSelect);
    }

    if (generationLyricsBrowseButton) {
        generationLyricsBrowseButton.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (generationLyricsFileInput) {
                generationLyricsFileInput.click();
            }
        });
    }

    if (generationLyricsUploadArea) {
        generationLyricsUploadArea.addEventListener("dragover", handleLyricsDragOver);
        generationLyricsUploadArea.addEventListener("drop", handleGenerationLyricsFileDrop);
        generationLyricsUploadArea.addEventListener("click", function(e) {
            if (e.target === generationLyricsUploadArea || e.target.classList.contains('upload-text')) {
                if (generationLyricsFileInput) {
                    generationLyricsFileInput.click();
                }
            }
        });
    }

    // Upload button - DIRECT EVENT LISTENER
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        console.log('Upload button found, attaching click listener...');
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Upload button clicked!');
            handleUpload();
        });
    } else {
        console.error('Upload button not found!');
    }

    // Training buttons
    const startTrainingBtn = document.getElementById('start-training-btn');
    const stopTrainingBtn = document.getElementById('stop-training-btn');
    
    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', startTraining);
    }
    
    if (stopTrainingBtn) {
        stopTrainingBtn.addEventListener('click', stopTraining);
    }

    // Generation button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateMusic);
    }

    // Tempo sliders
    const tempoSlider = document.getElementById("tempo");
    if (tempoSlider) {
        tempoSlider.addEventListener("input", function() {
            const tempoValue = document.querySelector("#upload .tempo-value");
            if (tempoValue) {
                tempoValue.textContent = this.value + " BPM";
            }
        });
    }

    const generationTempoSlider = document.getElementById("generation-tempo");
    if (generationTempoSlider) {
        generationTempoSlider.addEventListener("input", function() {
            const tempoValue = document.querySelector("#generation .tempo-value");
            if (tempoValue) {
                tempoValue.textContent = this.value + " BPM";
            }
        });
    }
}

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Load data for specific tabs
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

// Audio file handling
function handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        selectedAudioFile = files[0];
        updateFileDisplay(selectedAudioFile);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (isValidAudioFile(file)) {
            selectedAudioFile = file;
            updateFileDisplay(selectedAudioFile);
        } else {
            alert('Please select a valid audio file (MP3, WAV, FLAC, M4A)');
        }
    }
}

function isValidAudioFile(file) {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/mp4'];
    const validExtensions = ['.mp3', '.wav', '.flac', '.m4a'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

function updateFileDisplay(file) {
    const uploadArea = document.getElementById("file-upload-area");
    if (uploadArea && file) {
        const fileName = file.name;
        const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        
        uploadArea.innerHTML = `
            <div class="file-selected">
                <div class="file-icon">🎵</div>
                <div class="file-info">
                    <div class="file-name">${fileName}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
                <button type="button" class="remove-file" onclick="removeSelectedFile()">×</button>
            </div>
        `;
    }
}

function removeSelectedFile() {
    selectedAudioFile = null;
    const uploadArea = document.getElementById("file-upload-area");
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag and drop your audio file here, or click to browse</p>
            <input type="file" id="audio-file" name="audio_file" accept=".mp3,.wav,.flac,.m4a" hidden required>
            <button type="button" class="browse-btn">Browse Files</button>
        `;
        
        // Re-attach event listeners
        const fileInput = document.getElementById("audio-file");
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
    }
}

// Lyrics file handling
function handleLyricsFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        selectedLyricsFile = files[0];
        updateLyricsFileDisplay(selectedLyricsFile);
    }
}

function handleLyricsDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

function handleLyricsFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (isValidLyricsFile(file)) {
            selectedLyricsFile = file;
            updateLyricsFileDisplay(selectedLyricsFile);
        } else {
            alert('Please select a valid .txt file for lyrics');
        }
    }
}

function handleGenerationLyricsFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        selectedGenerationLyricsFile = files[0];
        updateGenerationLyricsFileDisplay(selectedGenerationLyricsFile);
    }
}

function handleGenerationLyricsFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (isValidLyricsFile(file)) {
            selectedGenerationLyricsFile = file;
            updateGenerationLyricsFileDisplay(selectedGenerationLyricsFile);
        } else {
            alert('Please select a valid .txt file for lyrics');
        }
    }
}

function isValidLyricsFile(file) {
    return file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
}

function updateLyricsFileDisplay(file) {
    const lyricsUploadArea = document.getElementById("lyrics-upload-area");
    if (lyricsUploadArea && file) {
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(2) + ' KB';
        
        lyricsUploadArea.innerHTML = `
            <div class="file-selected">
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <div class="file-name">${fileName}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
                <button type="button" class="remove-file" onclick="removeSelectedLyricsFile()">×</button>
            </div>
        `;
    }
}

function updateGenerationLyricsFileDisplay(file) {
    const generationLyricsUploadArea = document.getElementById("generation-lyrics-upload-area");
    if (generationLyricsUploadArea && file) {
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(2) + ' KB';
        
        generationLyricsUploadArea.innerHTML = `
            <div class="file-selected">
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <div class="file-name">${fileName}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
                <button type="button" class="remove-file" onclick="removeSelectedGenerationLyricsFile()">×</button>
            </div>
        `;
    }
}

function removeSelectedLyricsFile() {
    selectedLyricsFile = null;
    const lyricsUploadArea = document.getElementById("lyrics-upload-area");
    if (lyricsUploadArea) {
        lyricsUploadArea.innerHTML = `
            <i class="fas fa-file-text"></i>
            <p>Drag and drop your lyrics .txt file here, or click to browse</p>
            <input type="file" id="lyrics-file" name="lyrics_file" accept=".txt" hidden required>
            <button type="button" class="browse-btn">Browse Lyrics File</button>
        `;
        
        // Re-attach event listeners
        const lyricsFileInput = document.getElementById("lyrics-file");
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
    }
}

function removeSelectedGenerationLyricsFile() {
    selectedGenerationLyricsFile = null;
    const generationLyricsUploadArea = document.getElementById("generation-lyrics-upload-area");
    if (generationLyricsUploadArea) {
        generationLyricsUploadArea.innerHTML = `
            <i class="fas fa-file-text"></i>
            <p>Drag and drop your lyrics .txt file here, or click to browse</p>
            <input type="file" id="generation-lyrics-file" name="lyrics_file" accept=".txt" hidden required>
            <button type="button" class="browse-btn">Browse Lyrics File</button>
        `;
        
        // Re-attach event listeners
        const generationLyricsFileInput = document.getElementById("generation-lyrics-file");
        const generationLyricsBrowseButton = document.querySelector("#generation-lyrics-upload-area .browse-btn");
        
        if (generationLyricsFileInput) {
            generationLyricsFileInput.addEventListener("change", handleGenerationLyricsFileSelect);
        }
        
        if (generationLyricsBrowseButton) {
            generationLyricsBrowseButton.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (generationLyricsFileInput) {
                    generationLyricsFileInput.click();
                }
            });
        }
    }
}

// Upload handling
function handleUpload() {
    console.log('handleUpload called');
    
    // Check if audio file is selected
    if (!selectedAudioFile) {
        alert('Please select an audio file');
        return;
    }
    
    // Check if lyrics file is selected
    if (!selectedLyricsFile) {
        alert('Please select a lyrics .txt file');
        return;
    }
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const artist = document.getElementById('artist').value.trim();
    const composer = document.getElementById('composer').value.trim();
    const maqam = document.getElementById('maqam').value;
    const style = document.getElementById('style').value;
    const tempo = document.getElementById('tempo').value;
    const emotion = document.getElementById('emotion').value;
    const region = document.getElementById('region').value;
    const poemBahr = document.getElementById('poem-bahr').value;
    
    // Validate required fields
    if (!title || !artist) {
        alert('Please fill in title and artist');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('audio_file', selectedAudioFile);
    formData.append('lyrics_file', selectedLyricsFile);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('composer', composer);
    formData.append('maqam', maqam);
    formData.append('style', style);
    formData.append('tempo', tempo);
    formData.append('emotion', emotion);
    formData.append('region', region);
    formData.append('poem_bahr', poemBahr);
    
    // Disable upload button
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
    }
    
    console.log('Sending upload request...');
    
    // Send request
    fetch('/api/songs/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Upload response received:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Upload response data:', data);
        
        if (data.success) {
            alert('Song uploaded successfully!');
            
            // Reset form
            document.getElementById('title').value = '';
            document.getElementById('artist').value = '';
            document.getElementById('composer').value = '';
            document.getElementById('maqam').selectedIndex = 0;
            document.getElementById('style').selectedIndex = 0;
            document.getElementById('tempo').value = 120;
            document.getElementById('emotion').selectedIndex = 0;
            document.getElementById('region').selectedIndex = 0;
            document.getElementById('poem-bahr').selectedIndex = 0;
            
            // Update tempo display
            const tempoValue = document.querySelector("#upload .tempo-value");
            if (tempoValue) {
                tempoValue.textContent = "120 BPM";
            }
            
            // Clear selected files
            selectedAudioFile = null;
            selectedLyricsFile = null;
            
            // Reset file upload areas
            removeSelectedFile();
            removeSelectedLyricsFile();
            
            // Reload data
            loadSongs();
            loadDashboardData();
        } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
    })
    .finally(() => {
        // Re-enable upload button
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Song';
        }
    });
}

// Dashboard functions
function loadDashboardData() {
    fetch(`${API_BASE}/dashboard/stats`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardStats(data.stats);
            }
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

function updateDashboardStats(stats) {
    // Update stats cards
    const elements = {
        'total-songs': stats.songs_count || 0,
        'total-size': `${stats.total_size_mb || 0} MB`,
        'training-sessions': stats.training_sessions || 0,
        'generated-songs': stats.generated_count || 0
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Songs functions
function loadSongs() {
    fetch(`${API_BASE}/songs/list`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySongs(data.songs);
            }
        })
        .catch(error => {
            console.error('Error loading songs:', error);
        });
}

function displaySongs(songs) {
    const container = document.getElementById('songs-list');
    if (!container) return;
    
    if (songs && songs.length > 0) {
        container.innerHTML = songs.map(song => `
            <div class="song-card">
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p><strong>Artist:</strong> ${song.artist}</p>
                    <p><strong>Maqam:</strong> ${song.maqam}</p>
                    <p><strong>Style:</strong> ${song.style}</p>
                    <p><strong>Tempo:</strong> ${song.tempo} BPM</p>
                    <p><strong>Emotion:</strong> ${song.emotion}</p>
                    <p><strong>Region:</strong> ${song.region}</p>
                    <p><strong>Size:</strong> ${song.file_size_mb} MB</p>
                    ${song.composer ? `<p><strong>Composer:</strong> ${song.composer}</p>` : ''}
                </div>
                <div class="song-actions">
                    <button onclick="deleteSong(${song.id})" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p class="text-center text-muted">No songs uploaded yet. Upload your first song above!</p>';
    }
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
                updateTrainingStatus(data.status);
            }
        })
        .catch(error => {
            console.error('Error checking training status:', error);
        });
}

function updateTrainingStatus(status) {
    const progressBar = document.getElementById('training-progress');
    const statusText = document.getElementById('training-status');
    const startBtn = document.getElementById('start-training-btn');
    const stopBtn = document.getElementById('stop-training-btn');
    
    if (progressBar) {
        progressBar.style.width = status.progress + '%';
    }
    
    if (statusText) {
        statusText.textContent = `Status: ${status.status} (${status.progress}%)`;
    }
    
    if (startBtn) {
        startBtn.disabled = status.is_training;
    }
    
    if (stopBtn) {
        stopBtn.disabled = !status.is_training;
    }
    
    if (status.is_training) {
        setTimeout(checkTrainingStatus, 2000);
    }
}

function startTraining() {
    fetch(`${API_BASE}/training/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            epochs: 100,
            learning_rate: 0.001,
            batch_size: 32
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Training started successfully!');
            checkTrainingStatus();
        } else {
            alert('Training failed: ' + data.error);
        }
    })
    .catch(error => {
        alert('Training failed: ' + error.message);
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
            alert('Stop failed: ' + data.error);
        }
    })
    .catch(error => {
        alert('Stop failed: ' + error.message);
    });
}

// Generation functions
function generateMusic() {
    // Check if lyrics file is provided
    if (!selectedGenerationLyricsFile) {
        alert('Please select a lyrics file for generation');
        return;
    }
    
    const formData = new FormData();
    formData.append('lyrics_file', selectedGenerationLyricsFile);
    
    // Get other form values
    const maqam = document.getElementById('generation-maqam').value;
    const style = document.getElementById('generation-style').value;
    const tempo = document.getElementById('generation-tempo').value;
    const emotion = document.getElementById('generation-emotion').value;
    const region = document.getElementById('generation-region').value;
    
    formData.append('maqam', maqam);
    formData.append('style', style);
    formData.append('tempo', tempo);
    formData.append('emotion', emotion);
    formData.append('region', region);
    
    // Disable generate button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
    }
    
    fetch(`${API_BASE}/generation/generate`, {
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
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Song';
        }
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

// Add these new functions to your script.js file:

function viewGeneratedSong(songId) {
    fetch(`${API_BASE}/generation/${songId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const song = data.song;
                
                // Create modal content
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
                
                // Add modal to page
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
                
                // Create downloadable content
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
                
                // Create and download JSON file
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
                
                // Also create lyrics text file
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
        // Fallback for older browsers
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


function displayGeneratedSongs(songs) {
    const container = document.getElementById('generated-songs-list');
    if (!container) return;
    
    if (songs && songs.length > 0) {
        container.innerHTML = songs.map(song => `
            <div class="song-card">
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p><strong>Maqam:</strong> ${song.maqam}</p>
                    <p><strong>Style:</strong> ${song.style}</p>
                    <p><strong>Tempo:</strong> ${song.tempo} BPM</p>
                    <p><strong>Emotion:</strong> ${song.emotion}</p>
                    <p><strong>Region:</strong> ${song.region}</p>
                    <p><strong>Generation Time:</strong> ${song.generation_time}s</p>
                </div>
                <div class="song-actions">
                    <button onclick="deleteGeneratedSong(${song.id})" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p class="text-center text-muted">No songs generated yet. Create your first AI-generated song above!</p>';
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

// Utility functions
function showToast(message, type = 'info') {
    // Simple alert for now
    alert(message);
}
