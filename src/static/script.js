// Global variables
let currentTab = 'dashboard';
let trainingInterval = null;
let isTraining = false;
let selectedAudioFile = null;

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadDashboardData();
    loadSongs();
    loadGeneratedSongs();
    loadGenerationPresets();
    checkTrainingStatus();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", function() {
            switchTab(this.dataset.tab);
        });
    });

    // File upload
    const fileInput = document.getElementById("audio-file");
    const uploadArea = document.getElementById("file-upload-area");
    const uploadForm = document.getElementById("upload-form");
    const browseButton = document.querySelector("#file-upload-area .browse-btn");

    // Listen for changes on the hidden file input
    if (fileInput) {
        fileInput.addEventListener("change", handleFileSelect);
    }

    // Handle browse button click
    if (browseButton) {
        browseButton.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    // Handle drag and drop for the upload area
    if (uploadArea) {
        uploadArea.addEventListener("dragover", handleDragOver);
        uploadArea.addEventListener("drop", handleFileDrop);
        uploadArea.addEventListener("click", function(e) {
            // Only trigger file input if clicking on the upload area itself, not buttons
            if (e.target === uploadArea || e.target.classList.contains('upload-text')) {
                if (fileInput) {
                    fileInput.click();
                }
            }
        });
    }
    
    // Upload form
    if (uploadForm) {
        uploadForm.addEventListener("submit", handleUpload);
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

    const genTempoSlider = document.getElementById("gen-tempo");
    if (genTempoSlider) {
        genTempoSlider.addEventListener("input", function() {
            const genTempoValue = document.querySelector("#generate .tempo-value");
            if (genTempoValue) {
                genTempoValue.textContent = this.value + " BPM";
            }
        });
    }

    // Training form
    const trainingForm = document.getElementById("training-form");
    if (trainingForm) {
        trainingForm.addEventListener("submit", handleStartTraining);
    }
    
    const stopTrainingBtn = document.getElementById("stop-training-btn");
    if (stopTrainingBtn) {
        stopTrainingBtn.addEventListener("click", handleStopTraining);
    }

    // Generation form
    const generateForm = document.getElementById("generate-form");
    if (generateForm) {
        generateForm.addEventListener("submit", handleGenerate);
    }
}

// File handling functions
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
            showToast('Please select a valid audio file (MP3, WAV, FLAC, M4A)', 'error');
        }
    }
}

function isValidAudioFile(file) {
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/x-m4a'];
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
            <div class="upload-text">
                <div class="upload-icon">📁</div>
                <p>Drag and drop your audio file here</p>
                <button type="button" class="browse-btn">Browse Files</button>
            </div>
        `;
        
        // Re-attach event listener to the new browse button
        const browseButton = document.querySelector("#file-upload-area .browse-btn");
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
    
    // Clear the file input
    const fileInput = document.getElementById("audio-file");
    if (fileInput) {
        fileInput.value = '';
    }
}

// Upload form handler
function handleUpload(e) {
    e.preventDefault();
    
    if (!selectedAudioFile) {
        showToast('Please select an audio file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('audio_file', selectedAudioFile);
    
    // Get form values
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const composer = document.getElementById('composer').value;
    const lyrics = document.getElementById('lyrics').value;
    const maqam = document.getElementById('maqam').value;
    const style = document.getElementById('style').value;
    const tempo = document.getElementById('tempo').value;
    const emotion = document.getElementById('emotion').value;
    const region = document.getElementById('region').value;
    const poemBahr = document.getElementById('poem-bahr').value;
    
    // Append form data
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('composer', composer);
    formData.append('lyrics', lyrics);
    formData.append('maqam', maqam);
    formData.append('style', style);
    formData.append('tempo', tempo);
    formData.append('emotion', emotion);
    formData.append('region', region);
    formData.append('poem_bahr', poemBahr);
    
    // Show loading state
    const submitBtn = document.querySelector('#upload-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Uploading...';
    submitBtn.disabled = true;
    
    fetch(`${API_BASE}/songs/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Song uploaded successfully!', 'success');
            document.getElementById('upload-form').reset();
            removeSelectedFile();
            loadSongs();
            loadDashboardData();
        } else {
            showToast(data.error || 'Upload failed', 'error');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showToast('Upload failed: ' + error.message, 'error');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to selected nav tab
    const selectedNavTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedNavTab) {
        selectedNavTab.classList.add('active');
    }
    
    currentTab = tabName;
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
        .catch(error => console.error('Error loading dashboard data:', error));
}

function updateDashboardStats(stats) {
    const elements = {
        'songs-count': stats.songs_count || 0,
        'training-status': stats.is_training ? 'Training...' : 'Not Started',
        'model-accuracy': (stats.model_accuracy || 0) + '%',
        'generated-count': stats.generated_count || 0
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
                updateSongsList(data.songs);
            }
        })
        .catch(error => console.error('Error loading songs:', error));
}

function updateSongsList(songs) {
    const songsList = document.getElementById('songs-list');
    if (!songsList) return;
    
    if (songs.length === 0) {
        songsList.innerHTML = '<p>No songs uploaded yet.</p>';
        return;
    }
    
    songsList.innerHTML = songs.map(song => `
        <div class="song-item">
            <div class="song-info">
                <h4>${song.title}</h4>
                <p>Artist: ${song.artist}</p>
                <p>Maqam: ${song.maqam}</p>
            </div>
            <div class="song-actions">
                <button onclick="playSong(${song.id})">Play</button>
                <button onclick="deleteSong(${song.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Training functions
function handleStartTraining(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const trainingData = Object.fromEntries(formData.entries());
    
    fetch(`${API_BASE}/training/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Training started successfully!', 'success');
            isTraining = true;
            startTrainingMonitor();
        } else {
            showToast(data.error || 'Failed to start training', 'error');
        }
    })
    .catch(error => {
        console.error('Training start error:', error);
        showToast('Failed to start training: ' + error.message, 'error');
    });
}

function handleStopTraining() {
    fetch(`${API_BASE}/training/stop`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Training stopped', 'info');
            isTraining = false;
            stopTrainingMonitor();
        } else {
            showToast(data.error || 'Failed to stop training', 'error');
        }
    })
    .catch(error => {
        console.error('Training stop error:', error);
        showToast('Failed to stop training: ' + error.message, 'error');
    });
}

function startTrainingMonitor() {
    if (trainingInterval) {
        clearInterval(trainingInterval);
    }
    
    trainingInterval = setInterval(() => {
        checkTrainingStatus();
    }, 2000);
}

function stopTrainingMonitor() {
    if (trainingInterval) {
        clearInterval(trainingInterval);
        trainingInterval = null;
    }
}

function checkTrainingStatus() {
    fetch(`${API_BASE}/training/status`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTrainingStatus(data.status);
                if (!data.status.is_training && isTraining) {
                    isTraining = false;
                    stopTrainingMonitor();
                }
            }
        })
        .catch(error => console.error('Error checking training status:', error));
}

function updateTrainingStatus(status) {
    const elements = {
        'training-progress': status.progress || 0,
        'training-epoch': status.current_epoch || 0,
        'training-loss': status.current_loss || 0
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'training-progress') {
                element.style.width = value + '%';
                element.textContent = value + '%';
            } else {
                element.textContent = value;
            }
        }
    });
}

// Generation functions
function loadGenerationPresets() {
    // Load preset configurations for music generation
    const presets = [
        { name: 'Classical', maqam: 'hijaz', style: 'classical', tempo: 80 },
        { name: 'Modern', maqam: 'bayati', style: 'modern', tempo: 120 },
        { name: 'Folk', maqam: 'saba', style: 'folk', tempo: 100 }
    ];
    
    const presetSelect = document.getElementById('generation-preset');
    if (presetSelect) {
        presetSelect.innerHTML = '<option value="">Custom</option>' +
            presets.map(preset => 
                `<option value="${preset.name.toLowerCase()}">${preset.name}</option>`
            ).join('');
    }
}

function handleGenerate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const generationData = Object.fromEntries(formData.entries());
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Generating...';
    submitBtn.disabled = true;
    
    fetch(`${API_BASE}/generation/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Music generated successfully!', 'success');
            loadGeneratedSongs();
        } else {
            showToast(data.error || 'Generation failed', 'error');
        }
    })
    .catch(error => {
        console.error('Generation error:', error);
        showToast('Generation failed: ' + error.message, 'error');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

function loadGeneratedSongs() {
    fetch(`${API_BASE}/generation/list`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateGeneratedSongsList(data.songs);
            }
        })
        .catch(error => console.error('Error loading generated songs:', error));
}

function updateGeneratedSongsList(songs) {
    const generatedList = document.getElementById('generated-songs-list');
    if (!generatedList) return;
    
    if (songs.length === 0) {
        generatedList.innerHTML = '<p>No songs generated yet.</p>';
        return;
    }
    
    generatedList.innerHTML = songs.map(song => `
        <div class="generated-song-item">
            <div class="song-info">
                <h4>${song.title}</h4>
                <p>Generated: ${new Date(song.created_at).toLocaleDateString()}</p>
            </div>
            <div class="song-actions">
                <button onclick="playGeneratedSong('${song.audio_path}')">Play</button>
                <button onclick="downloadSong('${song.audio_path}')">Download</button>
            </div>
        </div>
    `).join('');
}

// Utility functions
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function playSong(songId) {
    // Implement song playback
    console.log('Playing song:', songId);
}

function deleteSong(songId) {
    if (confirm('Are you sure you want to delete this song?')) {
        fetch(`${API_BASE}/songs/${songId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Song deleted successfully', 'success');
                loadSongs();
                loadDashboardData();
            } else {
                showToast(data.error || 'Failed to delete song', 'error');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showToast('Failed to delete song: ' + error.message, 'error');
        });
    }
}

function playGeneratedSong(audioPath) {
    // Implement generated song playback
    console.log('Playing generated song:', audioPath);
}

function downloadSong(audioPath) {
    // Implement song download
    window.open(audioPath, '_blank');
}
