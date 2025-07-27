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
});

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

// Load songs list
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
                    <div class="song-item">
                        <h3>${song.title}</h3>
                        <p>Artist: ${song.artist}</p>
                        <p>Maqam: ${song.maqam} | Style: ${song.style} | Region: ${song.region}</p>
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
    
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch('/api/songs/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Song uploaded successfully!');
            event.target.reset();
            loadDashboardData();
            loadSongs();
        } else {
            alert('Upload failed: ' + result.error);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
    }
}
