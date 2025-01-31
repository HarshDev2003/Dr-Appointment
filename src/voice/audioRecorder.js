console.log("Audio js");
document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('record-audio');
    const status = document.getElementById('status');
    const audioPlayback = document.getElementById('audio-playback');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    recordButton.addEventListener('click', async () => {
        if (!isRecording) {
            // Request access to the microphone
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);

                // Update status
                status.textContent = 'Status: Recording...';
                recordButton.textContent = 'Stop Recording';
                isRecording = true;

                // Handle data availability
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                // Handle stopping the recording
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Save to local storage as a base64 string
                    const reader = new FileReader();
                    reader.onload = function () {
                        localStorage.setItem('recordedAudio', reader.result);
                    };
                    reader.readAsDataURL(audioBlob);

                    // Reset for the next recording
                    audioChunks = [];
                    isRecording = false;
                    recordButton.textContent = 'Start Recording';
                    status.textContent = 'Status: Not Recording';

                    // Set the audio playback source
                    audioPlayback.src = audioUrl;
                };

                // Start recording
                mediaRecorder.start();
            } catch (error) {
                console.error('Error accessing microphone:', error);
                alert('Could not access microphone. Please check permissions.');
            }
        } else {
            // Stop the recording
            mediaRecorder.stop();
        }
    });
});

let localStream = null; // Store the local media stream
const muteButton = document.getElementById('toggle-mute');
let isMuted = false; // Track mute state

// Function to initialize the local media stream
async function initMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        document.getElementById('local').srcObject = localStream; // Attach stream to a local video element
    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
}

// Function to toggle mute
function toggleMute() {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = isMuted; // Enable/disable audio
        });
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? 'Unmute' : 'Mute'; // Update button text
    } else {
        console.warn('No media stream available');
    }
}

// Add event listener to the mute button
muteButton.addEventListener('click', toggleMute);

// Initialize media stream on page load
initMedia();
