// Global variables
let selectedAudioFile = null;
let generationInProgress = false;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Arabic Music AI - Starting initialization...');
    
    // Initialize tabs first
    initializeTabs();
    
    // Initialize file upload
    setupFileUpload();
    
    // Initialize forms with proper event listeners
    initializeForms();
    
    // Load initial data
    loadDashboardData();
    loadLibrarySongs();
    
    console.log('Arabic Music AI - Initialization complete');
});

// Initialize all forms and buttons
function initializeForms() {
    // Upload form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
        console.log('Upload form initialized');
    }
    
    // Generation form
    const generationForm = document.getElementById('generation-form');
    if (generationForm) {
        generationForm.addEventListener('submit', handleGeneration);
        console.log('Generation form initialized');
    }
    
    // Browse button
    const browseBtn = document.querySelector('.browse-btn');
    if (browseBtn) {
        browseBtn.addEventListener('click', function() {
            document.getElementById('audio-file').click();
        });
        console.log('Browse button initialized');
    }
    
    // Remove file button
    const removeBtn = document.querySelector('.remove-file');
    if (removeBtn) {
        removeBtn.addEventListener('click', removeSelectedFile);
        console.log('Remove file button initialized');
    }
    
    // Tempo slider
    const tempoSlider = document.getElementById('tempo');
    const tempoValue = document.getElementById('tempo-value');
    if (tempoSlider && tempoValue) {
        tempoSlider.addEventListener('input', function() {
            tempoValue.textContent = this.value + ' BPM';
        });
        console.log('Tempo slider initialized');
    }
    
    // Generation tempo slider
    const genTempoSlider = document.getElementById('gen-tempo');
    const genTempoValue = document.getElementById('gen-tempo-value');
    if (genTempoSlider && genTempoValue) {
        genTempoSlider.addEventListener('input', function() {
            genTempoValue.textContent = this.value + ' BPM';
        });
        console.log('Generation tempo slider initialized');
    }
    
    // Creativity slider
    const creativitySlider = document.getElementById('gen-creativity');
    const creativityValue = document.getElementById('gen-creativity-value');
    if (creativitySlider && creativityValue) {
        creativitySlider.addEventListener('input', function() {
            creativityValue.textContent = this.value + '/10';
        });
        console.log('Creativity slider initialized');
    }
}

// Tab functionality
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            console.log('Switching to tab:', targetTab);
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Load data for specific tabs
            if (targetTab === 'dashboard') {
                loadDashboardData();
            } else if (targetTab === 'library') {
                loadLibrarySongs();
            } else if (targetTab === 'upload') {
                // Re-initialize upload functionality when switching to upload tab
                setTimeout(setupFileUpload, 100);
            } else if (targetTab === 'generate') {
                setTimeout(() => {
                    loadGeneratedSongs();
                    initializeGenerationForm();
                }, 100);
            }
        });
    });
    
    console.log('Tabs initialized');
}

// File upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('audio-file');
    const uploadArea = document.getElementById('file-upload-area');
    
    if (!fileInput || !uploadArea) {
        console.log('File upload elements not found');
        return;
    }
    
    // Remove existing listeners to avoid duplicates
    fileInput.removeEventListener('change', handleFileInputChange);
    uploadArea.removeEventListener('dragover', handleDragOver);
    uploadArea.removeEventListener('dragleave', handleDragLeave);
    uploadArea.removeEventListener('drop', handleDrop);
    
    // Add new listeners
    fileInput.addEventListener('change', handleFileInputChange);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    console.log('File upload setup complete');
}

function handleFileInputChange(e) {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}

function handleFileSelect(file) {
    console.log('File selected:', file.name);
    
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/mpeg'];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
        alert('Please select a valid audio file (MP3, WAV, FLAC, or M4A)');
        return;
    }
    
    selectedAudioFile = file;
    
    // Update UI
    const fileSelected = document.getElementById('file-selected');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const uploadArea = document.getElementById('file-upload-area');
    
    if (fileSelected && fileName && fileSize && uploadArea) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileSelected.style.display = 'block';
        uploadArea.style.display = 'none';
        
        console.log('File UI updated successfully');
    } else {
        console.log('File UI elements not found');
    }
}

function removeSelectedFile() {
    console.log('Removing selected file');
    selectedAudioFile = null;
    
    const fileSelected = document.getElementById('file-selected');
    const uploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('audio-file');
    
    if (fileSelected) fileSelected.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInput) fileInput.value = '';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Dashboard functionality
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        if (data.success) {
            updateDashboardStats(data.stats);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(stats) {
    const elements = {
        'songs-count': stats.songs_count,
        'generated-count': stats.generated_count,
        'training-status': stats.is_training ? 'Training' : 'Ready',
        'model-accuracy': stats.model_accuracy + '%'
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
}

// Library functionality
async function loadLibrarySongs() {
    try {
        console.log('Loading library songs...');
        const response = await fetch('/api/library/songs');
        const data = await response.json();
        
        if (data.success) {
            displayLibrarySongs(data.songs);
            updateLibraryStats(data.songs);
            console.log('Library songs loaded:', data.songs.length);
        } else {
            console.error('Failed to load library songs:', data.error);
        }
    } catch (error) {
        console.error('Error loading library songs:', error);
    }
}

function displayLibrarySongs(songs) {
    const container = document.getElementById('library-songs');
    if (!container) {
        console.log('Library songs container not found');
        return;
    }
    
    if (songs.length === 0) {
        container.innerHTML = '<p>No songs in library yet. Go to "Upload Songs" tab to build your collection!</p>';
        return;
    }
    
    container.innerHTML = songs.map(song => `
        <div class="library-song-item">
            <div class="song-header">
                <div class="song-info">
                    <h4>${song.title}</h4>
                    <p>by ${song.artist} • ${song.maqam} • ${song.region}</p>
                    <small>Uploaded: ${new Date(song.upload_date).toLocaleDateString()}</small>
                </div>
                <div class="song-actions">
                    <button class="edit-btn" onclick="editSong(${song.id})">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteSong(${song.id})">🗑️ Delete</button>
                </div>
            </div>
            <div class="song-details">
                <div class="detail-grid">
                    <div><strong>Style:</strong> ${song.style}</div>
                    <div><strong>Tempo:</strong> ${song.tempo} BPM</div>
                    <div><strong>Emotion:</strong> ${song.emotion}</div>
                    <div><strong>Composer:</strong> ${song.composer || 'Unknown'}</div>
                </div>
                <div class="lyrics-preview">
                    <strong>Lyrics:</strong>
                    <div class="lyrics-text">${song.lyrics.substring(0, 100)}${song.lyrics.length > 100 ? '...' : ''}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('Library songs displayed');
}

function updateLibraryStats(songs) {
    const totalSongs = songs.length;
    const totalSize = songs.reduce((sum, song) => sum + (song.file_size || 0), 0);
    const maqams = new Set(songs.map(song => song.maqam)).size;
    const regions = new Set(songs.map(song => song.region)).size;
    
    const elements = {
        'library-total-songs': totalSongs,
        'library-total-size': formatFileSize(totalSize),
        'library-maqams': maqams,
        'library-regions': regions
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
}

function refreshLibrary() {
    console.log('Refreshing library...');
    loadLibrarySongs();
}

function exportLibrary() {
    alert('Export functionality will be implemented in the next update!');
}

// Upload functionality
async function handleUpload(event) {
    event.preventDefault();
    console.log('Upload form submitted');
    
    if (!selectedAudioFile) {
        alert('Please select an audio file first');
        return;
    }
    
    const formData = new FormData(event.target);
    formData.append('audio_file', selectedAudioFile);
    
    const uploadBtn = document.getElementById('upload-btn');
    if (!uploadBtn) {
        console.error('Upload button not found');
        return;
    }
    
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    
    try {
        console.log('Sending upload request...');
        const response = await fetch('/api/songs/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Upload response:', result);
        
        if (result.success) {
            alert('Song uploaded successfully to library!');
            event.target.reset();
            removeSelectedFile();
            loadDashboardData();
            loadLibrarySongs();
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

// Song management functions (global scope for onclick)
window.editSong = async function(songId) {
    alert(`Edit functionality for song ${songId} will be implemented in the next update!`);
};

window.deleteSong = async function(songId) {
    if (confirm('Are you sure you want to remove this song from the library?')) {
        try {
            const response = await fetch(`/api/songs/${songId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Song removed from library successfully!');
                loadLibrarySongs();
                loadDashboardData();
            } else {
                alert('Delete failed: ' + result.error);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Delete failed. Please try again.');
        }
    }
};

        // Enhanced generation functionality
        async function handleGeneration(event) {
            event.preventDefault();
            console.log('Generation form submitted');
            
            if (generationInProgress) {
                alert('Generation already in progress. Please wait...');
                return;
            }
            
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
            
            // Validate lyrics length
            if (params.lyrics.length < 20) {
                alert('Please provide more detailed Arabic lyrics (at least 20 characters)');
                return;
            }
            
            // Show generation preview
            const confirmed = confirm(`🎵 Generate Arabic Music with these parameters?

📝 Title: ${params.title}
🎭 Artist: ${params.artist || 'AI Generated'}
🎼 Maqam: ${params.maqam}
🎨 Style: ${params.style}
💓 Emotion: ${params.emotion}
🌍 Region: ${params.region}
🥁 Tempo: ${params.tempo} BPM

Click OK to start generation...`);
            
            if (!confirmed) return;
            
            generationInProgress = true;
            const generateBtn = document.getElementById('generate-btn');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = '🔄 Generating Music...';
            generateBtn.disabled = true;
            
            // Show progress simulation
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                generateBtn.textContent = `🔄 Generating... ${Math.round(progress)}%`;
            }, 500);
            
            try {
                const response = await fetch('/api/generation/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(params)
                });
                
                const result = await response.json();
                console.log('Generation response:', result);
                
                clearInterval(progressInterval);
                
                if (result.success) {
                    alert(`🎉 Success! ${result.message}

🎵 Generated Song Details:
• Title: ${result.generation_details.title}
• Maqam: ${result.generation_details.maqam}
• Style: ${result.generation_details.style}
• Emotion: ${result.generation_details.emotion}
• Tempo: ${result.generation_details.tempo} BPM
• Region: ${result.generation_details.region}
• Training Data: ${result.generation_details.training_songs_used} songs

Your generated song is now available in the "Generated Songs" section below!`);
                    
                    // Reset form
                    event.target.reset();
                    document.getElementById('gen-tempo-value').textContent = '120 BPM';
                    
                    // Reload data
                    loadGeneratedSongs();
                    loadDashboardData();
                } else {
                    alert('❌ Generation failed: ' + result.error);
                }
            } catch (error) {
                clearInterval(progressInterval);
                console.error('Generation error:', error);
                alert('❌ Generation failed. Please check your internet connection and try again.');
            } finally {
                generationInProgress = false;
                generateBtn.textContent = originalText;
                generateBtn.disabled = false;
            }
        }

        // Enhanced generated songs display
        function displayGeneratedSongs(songs) {
            const container = document.getElementById('generated-songs');
            if (!container) return;
            
            if (songs.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: rgba(255,255,255,0.8); border-radius: 10px;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">🎵</div>
                        <h3>No songs generated yet</h3>
                        <p>Fill in the parameters above and click "Generate Music" to create your first AI-generated Arabic song!</p>
                        <p><small>💡 Tip: Make sure you have uploaded at least 3 songs to your library for better generation quality.</small></p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = songs.map(song => `
                <div class="song-item" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-left: 4px solid #667eea;">
                    <div class="song-header">
                        <div>
                            <h3>🎵 ${song.title}</h3>
                            <p><strong>by ${song.artist}</strong> • Generated on ${new Date(song.created_at).toLocaleDateString()}</p>
                            <div style="margin-top: 8px;">
                                <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-right: 5px;">${song.maqam}</span>
                                <span style="background: #764ba2; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-right: 5px;">${song.style}</span>
                                <span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${song.emotion}</span>
                            </div>
                        </div>
                        <div class="song-actions">
                            <button class="edit-btn" onclick="previewGeneratedSong(${song.id})" title="Preview Details">👁️ Preview</button>
                            <button class="edit-btn" onclick="playSong(${song.id})" title="Play Audio">▶️ Play</button>
                            <button class="delete-btn" onclick="deleteGeneratedSong(${song.id})" title="Delete Song">🗑️ Delete</button>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <p><strong>🎼 Musical Details:</strong> ${song.region} style • ${song.tempo} BPM • Creativity: ${song.creativity_level}/10</p>
                        <p><strong>📝 Lyrics Preview:</strong> ${song.lyrics.substring(0, 150)}${song.lyrics.length > 150 ? '...' : ''}</p>
                        ${song.composer ? `<p><strong>🎭 Composer Style:</strong> ${song.composer}</p>` : ''}
                        ${song.poem_bahr ? `<p><strong>📖 Poem Bahr:</strong> ${song.poem_bahr}</p>` : ''}
                    </div>
                </div>
            `).join('');
        }

        // New functions for generated songs
        window.previewGeneratedSong = async function(songId) {
            try {
                const response = await fetch(`/api/generation/${songId}`);
                const data = await response.json();
                
                if (data.success) {
                    const song = data.song;
                    alert(`🎵 Generated Song Details

📝 Title: ${song.title}
🎭 Artist: ${song.artist}
🎼 Maqam: ${song.maqam}
🎨 Style: ${song.style}
💓 Emotion: ${song.emotion}
🌍 Region: ${song.region}
🥁 Tempo: ${song.tempo} BPM
⏱️ Duration: ${song.duration}
🎹 Instruments: ${song.instruments}
🎨 Creativity Level: ${song.creativity_level}/10
📅 Generated: ${new Date(song.created_at).toLocaleString()}

📝 Full Lyrics:
${song.lyrics}

${song.composer ? `🎭 Composer Style: ${song.composer}\n` : ''}${song.poem_bahr ? `📖 Poem Bahr: ${song.poem_bahr}` : ''}`);
                } else {
                    alert('Failed to load song details: ' + data.error);
                }
            } catch (error) {
                console.error('Error loading song details:', error);
                alert('Failed to load song details. Please try again.');
            }
        };

        window.deleteGeneratedSong = async function(songId) {
            if (confirm('Are you sure you want to delete this generated song? This action cannot be undone.')) {
                try {
                    const response = await fetch(`/api/generation/${songId}`, {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('🗑️ Generated song deleted successfully!');
                        loadGeneratedSongs();
                        loadDashboardData();
                    } else {
                        alert('Delete failed: ' + result.error);
                    }
                } catch (error) {
                    console.error('Delete error:', error);
                    alert('Delete failed. Please try again.');
                }
            }
        };

        // Update the existing playSong function
        window.playSong = async function(songId) {
            try {
                const response = await fetch(`/api/generation/${songId}/audio`);
                const data = await response.json();
                
                if (data.success) {
                    alert(`🎵 Audio Playback

${data.demo_info.note}

Song: ${data.demo_info.title}
Duration: ${data.demo_info.duration}
Format: ${data.demo_info.format}
Quality: ${data.demo_info.quality}

🔧 Real audio playback will be available when the AI model is fully integrated with audio synthesis capabilities.`);
                } else {
                    alert('Audio playback failed: ' + data.error);
                }
            } catch (error) {
                console.error('Audio playback error:', error);
                alert('Audio playback failed. Please try again.');
            }
        };

        // Training functionality
        async function checkTrainingPrerequisites() {
            try {
                const response = await fetch('/api/training/prerequisites');
                const data = await response.json();
                
                if (data.success) {
                    const prereqs = data.prerequisites;
                    
                    // Update songs count
                    document.getElementById('prereq-songs-count').textContent = prereqs.songs_count;
                    document.getElementById('songs-status').textContent = prereqs.songs_ready ? '✅' : '❌';
                    
                    // Update lyrics count
                    document.getElementById('prereq-lyrics-count').textContent = prereqs.songs_with_lyrics;
                    document.getElementById('lyrics-status').textContent = prereqs.lyrics_ready ? '✅' : '❌';
                    
                    // Show/hide training config
                    const configSection = document.getElementById('training-config');
                    if (prereqs.songs_ready && prereqs.lyrics_ready) {
                        configSection.style.display = 'block';
                    } else {
                        configSection.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error checking prerequisites:', error);
            }
        }

        async function startTraining() {
            const config = {
                epochs: parseInt(document.getElementById('training-epochs').value),
                learning_rate: parseFloat(document.getElementById('learning-rate').value),
                batch_size: parseInt(document.getElementById('batch-size').value),
                training_focus: document.getElementById('training-focus').value
            };
            
            const startBtn = document.getElementById('start-training-btn');
            startBtn.textContent = '🔄 Starting Training...';
            startBtn.disabled = true;
            
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
                    alert(`🎉 Training started successfully with ${result.songs_count} songs!`);
                    checkTrainingStatus();
                    loadTrainingHistory();
                } else {
                    alert('Training failed to start: ' + result.error);
                }
            } catch (error) {
                console.error('Training start error:', error);
                alert('Failed to start training. Please try again.');
            } finally {
                startBtn.textContent = '🚀 Start Training';
                startBtn.disabled = false;
            }
        }

        async function checkTrainingStatus() {
            try {
                const response = await fetch('/api/training/status');
                const data = await response.json();
                
                if (data.success) {
                    updateTrainingStatus(data.status);
                }
            } catch (error) {
                console.error('Error checking training status:', error);
            }
        }

        function updateTrainingStatus(status) {
            const statusDisplay = document.getElementById('training-status-display');
            
            if (status.status === 'training') {
                statusDisplay.innerHTML = `
                    <div style="text-align: center;">
                        <h4>🔄 Training in Progress</h4>
                        <div style="background: #f0f0f0; border-radius: 10px; padding: 10px; margin: 15px 0;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 20px; border-radius: 10px; width: ${status.progress}%; transition: width 0.3s ease;"></div>
                        </div>
                        <p><strong>Progress:</strong> ${status.progress}% (Epoch ${status.current_epoch}/${status.total_epochs})</p>
                        <p><strong>Accuracy:</strong> ${(status.accuracy * 100).toFixed(1)}% | <strong>Loss:</strong> ${status.loss.toFixed(3)}</p>
                        <p><strong>ETA:</strong> ${status.eta} | <strong>Songs Used:</strong> ${status.songs_used}</p>
                    </div>
                `;
                
                // Continue checking status if training
                setTimeout(checkTrainingStatus, 3000);
            } else if (status.status === 'completed') {
                statusDisplay.innerHTML = `
                    <div style="text-align: center;">
                        <h4>✅ Training Completed Successfully!</h4>
                        <p><strong>Final Accuracy:</strong> ${(status.accuracy * 100).toFixed(1)}%</p>
                        <p><strong>Songs Trained On:</strong> ${status.songs_used}</p>
                        <p>🎵 Your AI model is now ready to generate Arabic music!</p>
                    </div>
                `;
            } else {
                statusDisplay.innerHTML = '<p>⏸️ Ready to start training</p>';
            }
        }

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

        function displayTrainingHistory(history) {
            const historyContainer = document.getElementById('training-history');
            
            if (history.length === 0) {
                historyContainer.innerHTML = '<p>No training sessions yet.</p>';
                return;
            }
            
            historyContainer.innerHTML = history.map(session => `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Session ${session.session_id.substring(0, 8)}</strong>
                            <span style="margin-left: 15px; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background: ${session.status === 'completed' ? '#4CAF50' : session.status === 'training' ? '#FF9800' : '#f44336'}; color: white;">
                                ${session.status.toUpperCase()}
                            </span>
                        </div>
                        <div style="text-align: right;">
                            <div><strong>${session.progress}%</strong> Progress</div>
                            <small>${new Date(session.created_at).toLocaleDateString()}</small>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                        <span>📊 ${session.epochs} epochs</span> • 
                        <span>🎵 ${session.songs_used} songs</span>
                        ${session.final_accuracy ? ` • <span>🎯 ${(session.final_accuracy * 100).toFixed(1)}% accuracy</span>` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Add training button event listener
        document.addEventListener('DOMContentLoaded', function() {
            const startTrainingBtn = document.getElementById('start-training-btn');
            if (startTrainingBtn) {
                startTrainingBtn.addEventListener('click', startTraining);
            }
        });

