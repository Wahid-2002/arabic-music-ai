// Updated JavaScript functions for MP3 download functionality
// Add these functions to your existing src/static/script.js file

// Update the loadGeneratedSongs function to include download buttons for MP3 files
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
                            <h3>${song.title || 'Generated Song'}</h3>
                            <p><strong>Maqam:</strong> ${song.maqam} | <strong>Style:</strong> ${song.style}</p>
                            <p><strong>Tempo:</strong> ${song.tempo} BPM | <strong>Emotion:</strong> ${song.emotion}</p>
                            <p><strong>Region:</strong> ${song.region || 'Mixed'}</p>
                            ${song.file_size_mb ? `<p><strong>File Size:</strong> ${song.file_size_mb} MB</p>` : ''}
                            ${song.generation_time ? `<p><strong>Generation Time:</strong> ${song.generation_time}s</p>` : ''}
                            <p><strong>Created:</strong> ${new Date(song.created_at || song.generation_date).toLocaleDateString()}</p>
                            <div class="lyrics-preview">
                                <strong>Lyrics Preview:</strong>
                                <div class="lyrics-text">${(song.lyrics || song.input_lyrics || '').substring(0, 100)}...</div>
                            </div>
                        </div>
                        <div class="song-actions">
                            ${song.filename ? `
                                <button onclick="downloadMP3('${song.filename}')" class="download-btn">
                                    <i class="fas fa-download"></i> Download MP3
                                </button>
                                <button onclick="playMP3('${song.filename}')" class="play-btn">
                                    <i class="fas fa-play"></i> Play
                                </button>
                            ` : ''}
                            <button onclick="viewGeneratedSong(${song.id})" class="view-btn">
                                <i class="fas fa-eye"></i> View Full
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

// Function to download MP3 files
function downloadMP3(filename) {
    console.log('Downloading MP3:', filename);
    
    // Create download URL
    const downloadUrl = `/api/generation/download/${encodeURIComponent(filename)}`;
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    showToast('MP3 download started!', 'success');
}

// Function to play MP3 files (optional - for in-browser playback)
function playMP3(filename) {
    console.log('Playing MP3:', filename);
    
    // Create audio element
    const audio = new Audio(`/api/generation/download/${encodeURIComponent(filename)}`);
    
    // Play the audio
    audio.play().then(() => {
        showToast('Playing MP3...', 'info');
    }).catch(error => {
        console.error('Error playing audio:', error);
        showToast('Error playing MP3', 'error');
    });
}

// Function to show toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to container
    const container = document.getElementById('toast-container') || document.body;
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Update the generation form handler to refresh the list after generation
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
    generateBtn.textContent = 'Generating MP3...';
    
    fetch('/api/generation/generate', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(`MP3 generated successfully! File: ${data.filename}`, 'success');
            loadGeneratedSongs(); // Refresh the list
            loadDashboardData(); // Update dashboard stats
        } else {
            showToast('Generation failed: ' + data.error, 'error');
        }
    })
    .catch(error => {
        showToast('Generation failed: ' + error.message, 'error');
    })
    .finally(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Song';
    });
}

// Add CSS for toast notifications (add this to your CSS file)
const toastCSS = `
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.toast {
    background: #333;
    color: white;
    padding: 12px 20px;
    margin-bottom: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
}

.toast-success { background: #4CAF50; }
.toast-error { background: #f44336; }
.toast-info { background: #2196F3; }

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;

// Inject CSS if not already present
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = toastCSS;
    document.head.appendChild(style);
}

