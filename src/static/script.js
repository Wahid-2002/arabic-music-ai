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
// Load songs list with enhanced display
async function loadSongs() {
    try {
        const response = await fetch('/api/songs/list');
        const data = await response.json();
        
        if (data.success) {
            window.allSongs = data.songs; // Store for filtering
            displaySongs(data.songs);
            setupSongFilters();
        }
    } catch (error) {
        console.error('Error loading songs:', error);
        document.getElementById('songs-container').innerHTML = '<p>Error loading songs. Please refresh the page.</p>';
    }
}

// Display songs with enhanced UI
function displaySongs(songs) {
    const container = document.getElementById('songs-container');
    
    if (songs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.1rem; padding: 40px;">No songs uploaded yet. Upload your first song to get started!</p>';
        return;
    }
    
    container.innerHTML = songs.map(song => `
        <div class="song-item">
            <div class="song-header">
                <h3 class="song-title">${song.title}</h3>
                <div class="song-actions">
                    <button onclick="openEditModal(${song.id})" class="action-btn edit-btn">
                        ✏️ Edit
                    </button>
                    <button onclick="deleteSong(${song.id})" class="action-btn delete-btn">
                        🗑️ Delete
                    </button>
                </div>
            </div>
            
            <div class="song-details">
                <div class="song-detail">
                    <strong>Artist</strong>
                    ${song.artist}
                </div>
                <div class="song-detail">
                    <strong>Maqam</strong>
                    ${song.maqam}
                </div>
                <div class="song-detail">
                    <strong>Style</strong>
                    ${song.style}
                </div>
                <div class="song-detail">
                    <strong>Region</strong>
                    ${song.region}
                </div>
                <div class="song-detail">
                    <strong>Tempo</strong>
                    ${song.tempo} BPM
                </div>
                <div class="song-detail">
                    <strong>Emotion</strong>
                    ${song.emotion}
                </div>
                ${song.composer ? `
                <div class="song-detail">
                    <strong>Composer</strong>
                    ${song.composer}
                </div>
                ` : ''}
                ${song.poem_bahr ? `
                <div class="song-detail">
                    <strong>Poem Bahr</strong>
                    ${song.poem_bahr}
                </div>
                ` : ''}
            </div>
            
            <div class="song-lyrics">
                <strong>Lyrics:</strong>
                <div class="lyrics-content">${song.lyrics}</div>
            </div>
            
            <div class="song-meta">
                <span>Uploaded: ${new Date(song.upload_date).toLocaleDateString()}</span>
                <span>File size: ${formatFileSize(song.file_size || 0)}</span>
            </div>
        </div>
    `).join('');
}

// Setup search and filter functionality
function setupSongFilters() {
    const searchInput = document.getElementById('search-songs');
    const maqamFilter = document.getElementById('filter-maqam');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterSongs);
    }
    
    if (maqamFilter) {
        maqamFilter.addEventListener('change', filterSongs);
    }
}

// Filter songs based on search and maqam
function filterSongs() {
    const searchTerm = document.getElementById('search-songs').value.toLowerCase();
    const selectedMaqam = document.getElementById('filter-maqam').value;
    
    let filteredSongs = window.allSongs || [];
    
    // Filter by search term
    if (searchTerm) {
        filteredSongs = filteredSongs.filter(song => 
            song.title.toLowerCase().includes(searchTerm) ||
            song.artist.toLowerCase().includes(searchTerm) ||
            song.lyrics.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by maqam
    if (selectedMaqam) {
        filteredSongs = filteredSongs.filter(song => song.maqam === selectedMaqam);
    }
    
    displaySongs(filteredSongs);
}

// Open edit modal
function openEditModal(songId) {
    const song = window.allSongs.find(s => s.id === songId);
    if (!song) return;
    
    // Populate form fields
    document.getElementById('edit-song-id').value = song.id;
    document.getElementById('edit-title').value = song.title;
    document.getElementById('edit-artist').value = song.artist;
    document.getElementById('edit-lyrics').value = song.lyrics;
    document.getElementById('edit-maqam').value = song.maqam;
    document.getElementById('edit-style').value = song.style;
    document.getElementById('edit-tempo').value = song.tempo;
    document.getElementById('edit-emotion').value = song.emotion;
    document.getElementById('edit-region').value = song.region;
    document.getElementById('edit-composer').value = song.composer || '';
    document.getElementById('edit-poem-bahr').value = song.poem_bahr || '';
    
    // Show modal
    document.getElementById('edit-modal').style.display = 'block';
    
    // Setup form submission
    const editForm = document.getElementById('edit-form');
    editForm.onsubmit = function(e) {
        e.preventDefault();
        saveEditedSong();
    };
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Save edited song
async function saveEditedSong() {
    const songId = document.getElementById('edit-song-id').value;
    const formData = new FormData(document.getElementById('edit-form'));
    
    const updates = {};
    for (let [key, value] of formData.entries()) {
        if (key !== 'song-id') {
            updates[key] = value;
        }
    }
    
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
            closeEditModal();
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

// Enhanced delete function
async function deleteSong(songId) {
    const song = window.allSongs.find(s => s.id === songId);
    const songTitle = song ? song.title : 'this song';
    
    if (confirm(`Are you sure you want to delete "${songTitle}"? This action cannot be undone.`)) {
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
        closeEditModal();
    }
}
// Training functionality
let trainingInterval = null;
let currentTrainingSession = null;

// Check training prerequisites
function checkTrainingPrerequisites() {
    const songs = window.allSongs || [];
    const songsCount = songs.length;
    const lyricsCount = songs.filter(song => song.lyrics && song.lyrics.trim().length > 0).length;
    const metadataCount = songs.filter(song => 
        song.maqam && song.style && song.emotion && song.region && song.tempo
    ).length;
    
    // Update counts
    document.getElementById('prereq-songs-count').textContent = songsCount;
    document.getElementById('prereq-lyrics-count').textContent = lyricsCount;
    document.getElementById('prereq-metadata-count').textContent = metadataCount;
    
    // Update status
    const songsReady = songsCount >= 5; // Minimum 5 songs
    const lyricsReady = lyricsCount === songsCount && songsCount > 0;
    const metadataReady = metadataCount === songsCount && songsCount > 0;
    
    updatePrereqStatus('songs-status', 'songs-prereq', songsReady);
    updatePrereqStatus('lyrics-status', 'lyrics-prereq', lyricsReady);
    updatePrereqStatus('metadata-status', 'metadata-prereq', metadataReady);
    
    // Enable/disable training button
    const canTrain = songsReady && lyricsReady && metadataReady;
    document.getElementById('start-training-btn').disabled = !canTrain;
    
    return canTrain;
}

function updatePrereqStatus(statusId, itemId, isReady) {
    const statusEl = document.getElementById(statusId);
    const itemEl = document.getElementById(itemId);
    
    if (isReady) {
        statusEl.textContent = '✅';
        itemEl.classList.add('ready');
    } else {
        statusEl.textContent = '❌';
        itemEl.classList.remove('ready');
    }
}

// Start training
async function startTraining() {
    if (!checkTrainingPrerequisites()) {
        alert('Please ensure all prerequisites are met before starting training.');
        return;
    }
    
    const config = {
        epochs: parseInt(document.getElementById('training-epochs').value),
        learning_rate: parseFloat(document.getElementById('learning-rate').value),
        batch_size: parseInt(document.getElementById('batch-size').value),
        focus_area: document.getElementById('focus-area').value
    };
    
    // Disable start button and show loading
    const startBtn = document.getElementById('start-training-btn');
    startBtn.disabled = true;
    startBtn.textContent = '🔄 Starting Training...';
    
    try {
        const response = await fetch('/api/training/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentTrainingSession = result.session_id;
            updateTrainingUI('training');
            startTrainingMonitor();
            alert('Training started successfully! Monitor progress below.');
        } else {
            alert('Failed to start training: ' + result.error);
            startBtn.disabled = false;
            startBtn.textContent = '🚀 Start Training';
        }
    } catch (error) {
        console.error('Training start error:', error);
        alert('Failed to start training. Please check your connection and try again.');
        startBtn.disabled = false;
        startBtn.textContent = '🚀 Start Training';
    }
}

// Enhanced training status check
async function checkTrainingStatus() {
    try {
        const response = await fetch('/api/training/status');
        const data = await response.json();
        
        if (data.success && data.status) {
            const status = data.status;
            
            // Update UI based on current status
            if (status.status === 'training') {
                updateTrainingUI('training');
                updateTrainingProgress(status);
                if (!trainingInterval) {
                    startTrainingMonitor();
                }
            } else if (status.status === 'completed') {
                updateTrainingUI('completed');
                stopTrainingMonitor();
                alert('Training completed successfully! Your AI model is ready for music generation.');
            } else if (status.status === 'stopped') {
                updateTrainingUI('stopped');
                stopTrainingMonitor();
            } else {
                updateTrainingUI('ready');
                stopTrainingMonitor();
            }
        }
    } catch (error) {
        console.error('Error checking training status:', error);
    }
}

// Enhanced prerequisite checking
function checkTrainingPrerequisites() {
    const songs = window.allSongs || [];
    const songsCount = songs.length;
    const lyricsCount = songs.filter(song => song.lyrics && song.lyrics.trim().length > 10).length;
    const metadataCount = songs.filter(song => 
        song.maqam && song.maqam !== '' &&
        song.style && song.style !== '' &&
        song.emotion && song.emotion !== '' &&
        song.region && song.region !== '' &&
        song.tempo && song.tempo > 0
    ).length;
    
    // Update counts
    document.getElementById('prereq-songs-count').textContent = `${songsCount}/5`;
    document.getElementById('prereq-lyrics-count').textContent = `${lyricsCount}/${songsCount}`;
    document.getElementById('prereq-metadata-count').textContent = `${metadataCount}/${songsCount}`;
    
    // Update status
    const songsReady = songsCount >= 5;
    const lyricsReady = lyricsCount === songsCount && songsCount > 0;
    const metadataReady = metadataCount === songsCount && songsCount > 0;
    
    updatePrereqStatus('songs-status', 'songs-prereq', songsReady);
    updatePrereqStatus('lyrics-status', 'lyrics-prereq', lyricsReady);
    updatePrereqStatus('metadata-status', 'metadata-prereq', metadataReady);
    
    // Enable/disable training button
    const canTrain = songsReady && lyricsReady && metadataReady;
    const startBtn = document.getElementById('start-training-btn');
    if (startBtn) {
        startBtn.disabled = !canTrain;
        if (!canTrain) {
            if (!songsReady) {
                startBtn.textContent = `🚀 Need ${5 - songsCount} More Songs`;
            } else if (!lyricsReady) {
                startBtn.textContent = '🚀 Add Lyrics to All Songs';
            } else if (!metadataReady) {
                startBtn.textContent = '🚀 Complete All Metadata';
            }
        } else {
            startBtn.textContent = '🚀 Start Training';
        }
    }
    
    return canTrain;
}


// Stop training
async function stopTraining() {
    if (!currentTrainingSession) return;
    
    if (confirm('Are you sure you want to stop training? Progress will be lost.')) {
        try {
            const response = await fetch('/api/training/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_id: currentTrainingSession })
            });
            
            const result = await response.json();
            
            if (result.success) {
                stopTrainingMonitor();
                updateTrainingUI('stopped');
                currentTrainingSession = null;
            }
        } catch (error) {
            console.error('Training stop error:', error);
        }
    }
}

// Reset model
async function resetModel() {
    if (confirm('Are you sure you want to reset the model? All training progress will be lost.')) {
        try {
            const response = await fetch('/api/training/reset', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Model reset successfully!');
                updateTrainingUI('ready');
                loadTrainingHistory();
            } else {
                alert('Failed to reset model: ' + result.error);
            }
        } catch (error) {
            console.error('Model reset error:', error);
            alert('Failed to reset model. Please try again.');
        }
    }
}

// Update training UI
function updateTrainingUI(status) {
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusDescription = document.getElementById('status-description');
    const progressContainer = document.getElementById('progress-container');
    const metricsContainer = document.getElementById('training-metrics');
    const startBtn = document.getElementById('start-training-btn');
    const stopBtn = document.getElementById('stop-training-btn');
    
    switch (status) {
        case 'ready':
            statusIcon.textContent = '⏸️';
            statusTitle.textContent = 'Ready to Train';
            statusDescription.textContent = 'Configure settings and start training when ready';
            progressContainer.style.display = 'none';
            metricsContainer.style.display = 'none';
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            break;
            
        case 'training':
            statusIcon.textContent = '🧠';
            statusTitle.textContent = 'Training in Progress';
            statusDescription.textContent = 'AI is learning from your Arabic music collection';
            progressContainer.style.display = 'block';
            metricsContainer.style.display = 'block';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            break;
            
        case 'completed':
            statusIcon.textContent = '✅';
            statusTitle.textContent = 'Training Completed';
            statusDescription.textContent = 'Model is ready for music generation';
            progressContainer.style.display = 'none';
            metricsContainer.style.display = 'none';
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            break;
            
        case 'stopped':
            statusIcon.textContent = '⏹️';
            statusTitle.textContent = 'Training Stopped';
            statusDescription.textContent = 'Training was stopped by user';
            progressContainer.style.display = 'none';
            metricsContainer.style.display = 'none';
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            break;
    }
}

// Start training monitor
function startTrainingMonitor() {
    trainingInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/training/status');
            const data = await response.json();
            
            if (data.success) {
                updateTrainingProgress(data.status);
                
                if (data.status.status === 'completed' || data.status.status === 'failed') {
                    stopTrainingMonitor();
                    updateTrainingUI(data.status.status);
                    currentTrainingSession = null;
                    loadTrainingHistory();
                }
            }
        } catch (error) {
            console.error('Training monitor error:', error);
        }
    }, 2000); // Check every 2 seconds
}

// Stop training monitor
function stopTrainingMonitor() {
    if (trainingInterval) {
        clearInterval(trainingInterval);
        trainingInterval = null;
    }
}

// Update training progress
function updateTrainingProgress(status) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressEta = document.getElementById('progress-eta');
    const currentEpoch = document.getElementById('current-epoch');
    const currentLoss = document.getElementById('current-loss');
    const currentAccuracy = document.getElementById('current-accuracy');
    
    if (status.progress !== undefined) {
        progressFill.style.width = status.progress + '%';
        progressPercentage.textContent = Math.round(status.progress) + '%';
    }
    
    if (status.eta) {
        progressEta.textContent = 'ETA: ' + status.eta;
    }
    
    if (status.current_epoch !== undefined) {
        currentEpoch.textContent = status.current_epoch;
    }
    
    if (status.loss !== undefined) {
        currentLoss.textContent = status.loss.toFixed(4);
    }
    
    if (status.accuracy !== undefined) {
        currentAccuracy.textContent = (status.accuracy * 100).toFixed(1) + '%';
    }
}

// Load training history
async function loadTrainingHistory() {
    try {
        const response = await fetch('/api/training/history');
        const data = await response.json();
        
        if (data.success) {
            displayTrainingHistory(data.history);
        }
    } catch (error) {
        console.error('Error loading training history:', error);
    }
}

// Display training history
function displayTrainingHistory(history) {
    const container = document.getElementById('training-history');
    
    if (history.length === 0) {
        container.innerHTML = '<p>No training sessions yet.</p>';
        return;
    }
    
    container.innerHTML = history.map(session => `
        <div class="history-item">
            <div class="history-info">
                <strong>Session ${session.id}</strong>  

                <small>Started: ${new Date(session.start_time).toLocaleString()}</small>  

                <small>Epochs: ${session.epochs} | Focus: ${session.focus_area}</small>
            </div>
            <div class="history-status status-${session.status}">
                ${session.status.toUpperCase()}
            </div>
        </div>
    `).join('');
}

// Initialize training tab when switching to it
document.addEventListener('DOMContentLoaded', function() {
    // Add to existing tab click handler
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            if (targetTab === 'train') {
                setTimeout(() => {
                    checkTrainingPrerequisites();
                    loadTrainingHistory();
                }, 100);
            }
        });
    });
});
// Update the existing tab click handler
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
            
            // Special handling for train tab
            if (targetTab === 'train') {
                setTimeout(() => {
                    checkTrainingPrerequisites();
                    checkTrainingStatus(); // Check current training status
                    loadTrainingHistory();
                }, 100);
            }
        });
    });

    // Rest of your existing DOMContentLoaded code...
    loadDashboardData();
    loadSongs();
    
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    setupFileUpload();
});
// Music Generation functionality
let generationInProgress = false;

// Initialize generation form
document.addEventListener('DOMContentLoaded', function() {
    // Add to existing initialization
    const generationForm = document.getElementById('generation-form');
    if (generationForm) {
        generationForm.addEventListener('submit', handleGeneration);
    }
    
    // Load generated songs when switching to generate tab
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            if (targetTab === 'generate') {
                setTimeout(() => {
                    loadGeneratedSongs();
                }, 100);
            }
        });
    });
});

// Handle music generation
async function handleGeneration(event) {
    event.preventDefault();
    
    if (generationInProgress) {
        alert('Generation already in progress. Please wait...');
        return;
    }
    
    // Validate form
    const formData = new FormData(event.target);
    const params = {};
    for (let [key, value] of formData.entries()) {
        params[key] = value;
    }
    
    // Check required fields
    const requiredFields = ['title', 'lyrics', 'maqam', 'style', 'tempo', 'emotion', 'region'];
    const missingFields = requiredFields.filter(field => !params[field] || params[field].trim() === '');
    
    if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
    }
    
    // Check if model is trained
    try {
        const trainingCheck = await fetch('/api/training/status');
        const trainingData = await trainingCheck.json();
        
        if (!trainingData.success || trainingData.status.status !== 'completed') {
            const proceed = confirm('No completed training found. Generate with basic AI model anyway? (Results may be limited)');
            if (!proceed) return;
        }
    } catch (error) {
        console.warn('Could not check training status:', error);
    }
    
    // Start generation
    generationInProgress = true;
    updateGenerationStatus('generating');
    
    try {
        const response = await fetch('/api/generation/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Simulate generation progress
            await simulateGenerationProgress(result.generation_id);
            
            alert(`🎵 Music generated successfully! "${params.title}" is ready to play.`);
            loadGeneratedSongs();
        } else {
            alert('Generation failed: ' + result.error);
        }
    } catch (error) {
        console.error('Generation error:', error);
        alert('Generation failed. Please try again.');
    } finally {
        generationInProgress = false;
        updateGenerationStatus('ready');
    }
}

// Simulate generation progress
async function simulateGenerationProgress(generationId) {
    const steps = [
        'Analyzing Arabic lyrics...',
        'Detecting poem meter and rhythm...',
        'Applying maqam characteristics...',
        'Generating melody structure...',
        'Adding harmonic progressions...',
        'Incorporating regional style...',
        'Applying emotional context...',
        'Synthesizing instruments...',
        'Finalizing composition...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
        const progress = ((i + 1) / steps.length) * 100;
        updateGenerationProgress(steps[i], progress);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }
}

// Update generation status
function updateGenerationStatus(status) {
    const statusIcon = document.querySelector('.status-icon');
    const statusText = document.querySelector('.status-text');
    const progressContainer = document.getElementById('generation-progress');
    const generateBtn = document.getElementById('generate-btn');
    
    switch (status) {
        case 'ready':
            statusIcon.textContent = '⏸️';
            statusText.textContent = 'Ready to generate music';
            progressContainer.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.textContent = '🎵 Generate Music';
            break;
            
        case 'generating':
            statusIcon.textContent = '🎵';
            statusText.textContent = 'Generating Arabic music...';
            progressContainer.style.display = 'block';
            generateBtn.disabled = true;
            generateBtn.textContent = '🔄 Generating...';
            break;
            
        case 'completed':
            statusIcon.textContent = '✅';
            statusText.textContent = 'Music generated successfully!';
            progressContainer.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.textContent = '🎵 Generate Music';
            break;
    }
}

// Update generation progress
function updateGenerationProgress(step, percentage) {
    const progressFill = document.getElementById('gen-progress-fill');
    const progressText = document.getElementById('gen-progress-text');
    const progressPercentage = document.getElementById('gen-progress-percentage');
    
    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = step;
    if (progressPercentage) progressPercentage.textContent = Math.round(percentage) + '%';
}

// Load generated songs
async function loadGeneratedSongs() {
    try {
        const response = await fetch('/api/generation/list');
        const data = await response.json();
        
        if (data.success) {
            displayGeneratedSongs(data.generated_songs);
        }
    } catch (error) {
        console.error('Error loading generated songs:', error);
    }
}

// Display generated songs
function displayGeneratedSongs(songs) {
    const container = document.getElementById('generated-songs');
    
    if (songs.length === 0) {
        container.innerHTML = '<p>No songs generated yet. Fill in the parameters above and click "Generate Music" to create your first AI-generated Arabic song!</p>';
        return;
    }
    
    container.innerHTML = songs.map(song => `
        <div class="generated-song-item">
            <div class="song-header">
                <div class="song-info">
                    <h4>${song.title}</h4>
                    <p>Generated on ${new Date(song.created_at).toLocaleDateString()} • ${song.duration || 'Unknown'} duration</p>
                </div>
                <div class="song-actions">
                    <button class="play-btn" onclick="playSong(${song.id})">▶️ Play</button>
                    <button class="download-btn" onclick="downloadSong(${song.id})">⬇️ Download</button>
                </div>
            </div>
            
            <div class="song-parameters">
                <div class="parameter"><strong>Maqam:</strong> ${song.maqam}</div>
                <div class="parameter"><strong>Style:</strong> ${song.style}</div>
                <div class="parameter"><strong>Emotion:</strong> ${song.emotion}</div>
                <div class="parameter"><strong>Region:</strong> ${song.region}</div>
                <div class="parameter"><strong>Tempo:</strong> ${song.tempo} BPM</div>
                ${song.composer ? `<div class="parameter"><strong>Composer Style:</strong> ${song.composer}</div>` : ''}
            </div>
            
            <div class="song-lyrics" style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                <strong>Generated from lyrics:</strong>  

                <div style="max-height: 80px; overflow-y: auto; margin-top: 5px; font-style: italic;">${song.lyrics}</div>
            </div>
        </div>
    `).join('');
}

// Preview parameters
function previewParameters() {
    const form = document.getElementById('generation-form');
    const formData = new FormData(form);
    const params = {};
    
    for (let [key, value] of formData.entries()) {
        if (value) params[key] = value;
    }
    
    const preview = `
🎵 Generation Parameters Preview:

📝 Title: ${params.title || 'Not specified'}
🎤 Artist: ${params.artist || 'AI Generated'}
📜 Lyrics: ${params.lyrics ? params.lyrics.substring(0, 50) + '...' : 'Not provided'}

🎼 Musical Settings:
• Maqam: ${params.maqam || 'Not selected'}
• Style: ${params.style || 'Not selected'}
• Tempo: ${params.tempo || 'Not set'} BPM
• Emotion: ${params.emotion || 'Not selected'}
• Region: ${params.region || 'Not selected'}

🎹 Optional:
• Composer Style: ${params.composer || 'None'}
• Poem Bahr: ${params.poem_bahr || 'Auto-detect'}
• Duration: ${params.duration || 'Medium'}
• Instruments: ${params.instruments || 'Modern'}
• Creativity: ${params.creativity || '7'}/10
    `;
    
    alert(preview);
}

// Load example configurations
function loadExample(type) {
    const examples = {
        romantic: {
            title: 'حبيبي يا نور العين',
            lyrics: 'حبيبي يا نور العين\nيا ساكن في القلب\nحبك في قلبي حنين\nيا أغلى من الذهب',
            maqam: 'Hijaz',
            style: 'Modern',
            tempo: 90,
            emotion: 'Romantic',
            region: 'Egyptian',
            composer: 'Mohammed Abdel Wahab'
        },
        traditional: {
            title: 'يا مسافر وحدك',
            lyrics: 'يا مسافر وحدك في الليل\nوالنجوم تضيء طريقك\nقل لي متى تعود\nوالقلب ينتظر عودتك',
            maqam: 'Bayati',
            style: 'Traditional',
            tempo: 110,
            emotion: 'Melancholic',
            region: 'Syrian',
            poem_bahr: 'Baseet'
        },
        modern: {
            title: 'أحلام جديدة',
            lyrics: 'أحلام جديدة في عيونك\nمستقبل مشرق ينادينا\nنمشي سوا نحو النور\nوالحب يقوي خطوانا',
            maqam: 'Rast',
            style: 'Modern',
            tempo: 130,
            emotion: 'Happy',
            region: 'Lebanese',
            instruments: 'modern'
        },
        folk: {
            title: 'أغنية الحقول',
            lyrics: 'في الحقول الخضراء\nنغني مع الطيور\nوالشمس تشرق علينا\nوالأرض تعطي الثمار',
            maqam: 'Saba',
            style: 'Folk',
            tempo: 120,
            emotion: 'Peaceful',
            region: 'Sudan',
            instruments: 'traditional'
        }
    };
    
    const example = examples[type];
    if (!example) return;
    
    // Fill form with example data
    Object.keys(example).forEach(key => {
        const element = document.getElementById(`gen-${key}`);
        if (element) {
            element.value = example[key];
            
            // Trigger change events for sliders
            if (element.type === 'range') {
                element.dispatchEvent(new Event('input'));
            }
        }
    });
    
    alert(`✨ Loaded ${type} song example! You can modify the parameters and generate.`);
}

// Play generated song
function playSong(songId) {
    // In a real implementation, this would play the audio
    alert(`🎵 Playing song ${songId}... (Audio playback will be implemented with actual generation)`);
}

// Download generated song
function downloadSong(songId) {
    // In a real implementation, this would download the audio file
    alert(`⬇️ Downloading song ${songId}... (Download will be implemented with actual generation)`);
}
