const startButton = document.getElementById('start-recording');
const stopButton = document.getElementById('stop-recording');

let mediaRecorder;
let audioChunks = [];
let silenceTimeout;
let audioContext;
let analyser;
let dataArray;
let bufferLength;

startButton.addEventListener('click', async () => {
    audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 2048;
    bufferLength = analyser.fftSize;
    dataArray = new Uint8Array(bufferLength);

    const detectSilence = () => {
        analyser.getByteTimeDomainData(dataArray);
        let silenceDetected = true;
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > 128 + 10 || dataArray[i] < 128 - 10) {
                silenceDetected = false;
                break;
            }
        }
        if (silenceDetected) {
            clearTimeout(silenceTimeout);
            silenceTimeout = setTimeout(() => {
                mediaRecorder.stop();
            }, 1500); // Stop recording after 1.5 second of silence
        } else {
            clearTimeout(silenceTimeout);
        }
        if (mediaRecorder.state === 'recording') {
            requestAnimationFrame(detectSilence);
        }
    };
    detectSilence();

    mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
        console.log('Audio chunk captured:', event.data);
    });

    mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioBuffer = await audioBlob.arrayBuffer();
        console.log('Audio buffer:', audioBuffer);
        const transcription = await transcribeAudio(audioBuffer);
        console.log('Transcription:', transcription);

        // moderate transcription
        const moderationResult = await moderateText(transcription);
        if (moderationResult.flagged) {
            handleFlaggedInput(moderationResult, transcription);
            return;
        }

        const aiResponse = await processText(transcription);
        console.log('AI Response:', aiResponse);

        // moderate AI response
        const moderationResultAI = await moderateText(aiResponse);
        if (moderationResultAI.flagged) {
            console.log('AI response flagged; redirecting response');
            return "Hmm, let's talk about something else!";
        }

        // Re-enable the start button and disable the stop button
        startButton.disabled = false;
        stopButton.disabled = true;
    });

    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    startButton.disabled = false;
    stopButton.disabled = true;
});

async function transcribeAudio(audioBuffer) {
    console.log('Sending audio buffer to server for transcription');
    const response = await fetch('/transcribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioBuffer: Array.from(new Uint8Array(audioBuffer)) }),
    });
    const data = await response.json();
    console.log('Transcription received from server:', data.transcription);
    return data.transcription;
}

async function processText(text) {
    console.log('Sending text to server for AI processing:', text);
    const response = await fetch('/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    const data = await response.json();
    console.log('AI response received from server:', data.response);
    return data.response;
}


// Moderation API
async function moderateText(text) {
    console.log('Moderating text:', text);
    const response = await fetch('/moderate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    const data = await response.json();
    console.log('Moderation result:', data);
    return data;
}

// Handle flagged messages based on severity
function handleFlaggedInput(moderationResult, originalText) {
    console.log('Handling flagged input:', originalText);
    
    if (moderationResult.severity === "mild") {
        console.log("Mild flag detected: Redirecting conversation.");
        return "I hear you! Let's talk about something fun!";
    } 
    else if (moderationResult.severity === "medium") {
        console.log("Medium flag detected: Encouraging positive response.");
        return "I understand that you're upset. Want to talk about something else?";
    } 
    else if (moderationResult.severity === "severe") {
        console.log("Severe flag detected: Offering support.");
        logConcerningMessage(originalText, moderationResult.severity);
        return "I'm really sorry you're feeling this way. You're not alone – I'm here for you.";
    }
}

/*
// handle flagged messages with category-specific responses
function handleFlaggedInput(moderationResult, originalText) {
    console.log('Handling flagged input:', originalText);

    let responseMessage = "Hmm, let's talk about something else."; // Default fallback

    if (moderationResult.categories.violence) {
        console.log("Flagged for violence.");
        responseMessage = "Violence isn’t the answer! Maybe we can find a peaceful solution?";
    } 
    else if (moderationResult.categories.hate) {
        console.log("Flagged for hate speech.");
        responseMessage = "It's always important to be kind to others. Let's be respectful!";
    } 
    else if (moderationResult.categories.sexual) {
        console.log("Flagged for sexual content.");
        responseMessage = "Let's keep the conversation appropriate. Want to talk about something else?";
    } 
    else if (moderationResult.categories.self_harm) {
        console.log("Flagged for self-harm.");
        responseMessage = "I'm really sorry you're feeling this way. You're not alone. Maybe talking to someone could help?";
        logConcerningMessage(originalText, "severe");
        alertGuardian(originalText);
    } 
    else if (moderationResult.categories.harassment) {
        console.log("Flagged for harassment.");
        responseMessage = "Let's be kind and respectful to each other!";
    }

    // Update UI
    responseText.innerText = responseMessage;
}
 */

// Log flagged messages
function logConcerningMessage(userInput, severity) {
    fetch('/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput, severity }),
    });
}

async function init() {
    // Get an ephemeral key from your server
    const tokenResponse = await fetch('/session');
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    pc.ontrack = e => audioEl.srcObject = e.streams[0];
    document.body.appendChild(audioEl);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel('oai-events');
    dc.addEventListener('message', (e) => {
        // Realtime server events appear here!
        const realtimeEvent = JSON.parse(e.data);
        console.log('Received event:', realtimeEvent);
    });

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = 'https://api.openai.com/v1/realtime';
    const model = 'gpt-4o-mini-realtime-preview-2024-12-17';
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
            'Authorization': `Bearer ${EPHEMERAL_KEY}`,
            'Content-Type': 'application/sdp',
        },
    });

    const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
}

// Call the init function when the page loads
init();