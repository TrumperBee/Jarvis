/**
 * VoiceSync Component
 * Handles voice-reactive UI behavior
 * When Victor speaks: microphone ring pulses, waveform activates, globe reacts subtly
 * When AEGIS speaks: panels glow softly, synchronization lines animate, execution layer pulses
 */

export function setupVoiceSync() {
    // Voice sync elements
    const voiceElements = {
        microphoneRing: null,
        waveformDisplay: null,
        globeReference: null,
        panels: [],
        synchronizationLines: [],
        executionLayer: null,
        audioContext: null,
        analyser: null,
        microphoneStream: null,
        animationFrame: null,
        isListening: false,
        isSpeaking: false,
        voiceActivity: false,
        audioLevel: 0
    };

    // Initialize voice sync
    function init() {
        // Create microphone visualization elements
        createMicrophoneVisualization();
        createWaveformDisplay();

        // Set up audio processing
        setupAudioProcessing();

        // Start animation loop
        startAnimationLoop();
    }

    // Create microphone visualization
    function createMicrophoneVisualization() {
        // Create microphone ring (would be placed in header)
        const micRing = document.createElement('div');
        micRing.className = 'voice-mic-ring pulse-soft';
        micRing.innerHTML = '<div class="mic-dot"></div>';
        voiceElements.microphoneRing = micRing;

        // Add to document (in real implementation would be placed in header)
        document.body.appendChild(micRing);
        micRing.style.position = 'fixed';
        micRing.style.top = '1rem';
        micRing.style.right = '1rem';
        micRing.style.zIndex = '1000';
    }

    // Create waveform display
    function createWaveformDisplay() {
        const waveformContainer = document.createElement('div');
        waveformContainer.className = 'voice-waveform-container';
        waveformContainer.innerHTML = '<div class="waveform"></div>';
        voiceElements.waveformDisplay = waveformContainer;

        // Add to document (in real implementation would be placed in header)
        document.body.appendChild(waveformContainer);
        waveformContainer.style.position = 'fixed';
        waveformContainer.style.top = '4rem';
        waveformContainer.style.right = '1rem';
        waveformContainer.style.width = '80px';
        waveformContainer.style.height = '20px';
        waveformContainer.style.zIndex = '1000';
    }

    // Set up audio processing
    function setupAudioProcessing() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Web Audio API not available for voice sync');
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                voiceElements.microphoneStream = stream;
                voiceElements.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                voiceElements.analyser = voiceElements.audioContext.createAnalyser();
                voiceElements.analyser.fftSize = 256;
                const bufferLength = voiceElements.analyser.frequencyBinCount;
                voiceElements.dataArray = new Uint8Array(bufferLength);

                const source = voiceElements.audioContext.createMediaStreamSource(stream);
                source.connect(voiceElements.analyser);

                // Start analyzing audio
                analyzeAudio();
            })
            .catch(err => {
                console.error('Error accessing microphone for voice sync:', err);
            });
    }

    // Analyze audio input
    function analyzeAudio() {
        if (!voiceElements.analyser || !voiceElements.dataArray) return;

        voiceElements.analyser.getByteTimeDomainData(voiceElements.dataArray);

        // Calculate RMS (root mean square) for volume level
        let sum = 0;
        for (let i = 0; i < voiceElements.dataArray.length; i++) {
            const value = voiceElements.dataArray[i] - 128; // Center around 0
            sum += value * value;
        }
        const rms = Math.sqrt(sum / voiceElements.dataArray.length);
        const audioLevel = Math.min(rms / 128, 1); // Normalize to 0-1

        // Detect voice activity (simple threshold)
        const voiceActivity = audioLevel > 0.15;

        // Update voice elements
        voiceElements.audioLevel = audioLevel;
        voiceElements.voiceActivity = voiceActivity;

        requestAnimationFrame(analyzeAudio);
    }

    // Start animation loop
    function startAnimationLoop() {
        function animate() {
            updateVoiceVisuals();
            voiceElements.animationFrame = requestAnimationFrame(animate);
        }
        voiceElements.animationFrame = requestAnimationFrame(animate);
    }

    // Update voice visuals based on audio input
    function updateVoiceVisuals() {
        const { audioLevel, voiceActivity, microphoneRing, waveformDisplay, dataArray } = voiceElements;

        if (!microphoneRing || !waveformDisplay || !dataArray) return;

        // Update microphone ring pulse based on audio level
        const ringSize = 20 + audioLevel * 30; // 20-50px
        microphoneRing.style.width = `${ringSize}px`;
        microphoneRing.style.height = `${ringSize}px`;
        microphoneRing.style.backgroundColor = `rgba(0, 255, 255, ${0.3 + audioLevel * 0.7})`;

        // Update microphone dot color based on voice activity
        const micDot = microphoneRing.querySelector('.mic-dot');
        if (micDot) {
            micDot.style.backgroundColor = voiceActivity
                ? 'var(--accent-success)'
                : 'var(--accent-primary)';
            micDot.style.boxShadow = voiceActivity
                ? `0 0 ${audioLevel * 20}px var(--accent-success)`
                : `0 0 ${audioLevel * 10}px var(--accent-primary)`;
        }

        // Update waveform display
        const waveform = waveformDisplay.querySelector('.waveform');
        if (waveform) {
            // Create waveform visualization
            const points = 20;
            let waveformHTML = '';
            for (let i = 0; i < points; i++) {
                // Use audio data for waveform height
                const index = Math.floor((i / points) * voiceElements.dataArray.length);
                const value = voiceElements.dataArray[index];
                const normalized = (value - 128) / 128; // -1 to 1
                const height = Math.abs(normalized) * 15; // 0-15px
                waveformHTML += `<div class="wave-point" style="height: ${height}px;"></div>`;
            }
            waveform.innerHTML = waveformHTML;

            // Color waveform based on voice activity
            const wavePoints = waveform.querySelectorAll('.wave-point');
            wavePoints.forEach((point, index) => {
                const intensity = audioLevel * (0.5 + Math.sin(performance.now() * 0.01 + index) * 0.5);
                point.style.backgroundColor = `rgba(0, 255, 255, ${intensity})`;
            });
        }

        // Notify globe of voice activity (would connect to globe component)
        if (voiceElements.globeReference) {
            voiceElements.globeReference.updateVoiceActivity(audioLevel, voiceActivity);
        }

        // Notify panels of AEGIS speaking (would be set externally)
        if (voiceElements.isSpeaking) {
            updateSpeakingVisuals();
        }
    }

    // Update visuals when AEGIS is speaking
    function updateSpeakingVisuals() {
        // Make panels glow softly
        voiceElements.panels.forEach(panel => {
            if (panel) {
                panel.style.boxShadow = `0 0 ${20 + Math.sin(performance.now() * 0.005) * 10}px var(--accent-primary)`;
                panel.style.transition = 'box-shadow 0.1s ease';
            }
        });

        // Animate synchronization lines
        voiceElements.synchronizationLines.forEach((line, index) => {
            const opacity = 0.3 + Math.sin(performance.now() * 0.003 + index * 0.1) * 0.4;
            line.style.opacity = opacity.toString();
            line.style.backgroundColor = `rgba(0, 255, 255, ${opacity * 0.8})`;
        });

        // Pulse execution layer
        if (voiceElements.executionLayer) {
            const scale = 1 + Math.sin(performance.now() * 0.007) * 0.05;
            voiceElements.executionLayer.style.transform = `scale(${scale})`;
            voiceElements.executionLayer.style.transition = 'transform 0.1s ease';
        }
    }

    // Set globe reference for voice-to-globe communication
    function setGlobeReference(globeComponent) {
        voiceElements.globeReference = globeComponent;
    }

    // Add panel to voice synchronization
    function addPanel(panelElement) {
        if (panelElement && !voiceElements.panels.includes(panelElement)) {
            voiceElements.panels.push(panelElement);
        }
    }

    // Remove panel from voice synchronization
    function removePanel(panelElement) {
        const index = voiceElements.panels.indexOf(panelElement);
        if (index > -1) {
            voiceElements.panels.splice(index, 1);
        }
    }

    // Add synchronization line
    function addSyncLine(lineElement) {
        if (lineElement && !voiceElements.synchronizationLines.includes(lineElement)) {
            voiceElements.synchronizationLines.push(lineElement);
            lineElement.style.position = 'fixed';
            lineElement.style.pointerEvents = 'none';
            lineElement.style.zIndex = '900';
            document.body.appendChild(lineElement);
        }
    }

    // Remove synchronization line
    function removeSyncLine(lineElement) {
        const index = voiceElements.synchronizationLines.indexOf(lineElement);
        if (index > -1) {
            voiceElements.synchronizationLines.splice(index, 1);
            if (lineElement.parentNode) {
                lineElement.parentNode.removeChild(lineElement);
            }
        }
    }

    // Set execution layer reference
    function setExecutionLayer(element) {
        voiceElements.executionLayer = element;
    }

    // Set speaking state (when AEGIS is speaking)
    function setSpeakingState(isSpeaking) {
        voiceElements.isSpeaking = isSpeaking;
        if (!isSpeaking) {
            // Reset speaking visuals
            voiceElements.panels.forEach(panel => {
                if (panel) {
                    panel.style.boxShadow = '';
                }
            });
            voiceElements.synchronizationLines.forEach(line => {
                line.style.opacity = '0';
            });
            if (voiceElements.executionLayer) {
                voiceElements.executionLayer.style.transform = 'scale(1)';
            }
        }
    }

    // Set listening state
    function setListeningState(isListening) {
        voiceElements.isListening = isListening;
        if (voiceElements.microphoneRing) {
            voiceElements.microphoneRing.style.opacity = isListening ? '1' : '0.5';
        }
    }

    // Public API
    return {
        init,
        setGlobeReference,
        addPanel,
        removePanel,
        addSyncLine,
        removeSyncLine,
        setExecutionLayer,
        setSpeakingState,
        setListeningState,
        destroy: () => {
            if (voiceElements.animationFrame) {
                cancelAnimationFrame(voiceElements.animationFrame);
            }
            if (voiceElements.microphoneStream) {
                voiceElements.microphoneStream.getTracks().forEach(track => track.stop());
            }
            if (voiceElements.audioContext) {
                voiceElements.audioContext.close();
            }
            if (voiceElements.microphoneRing && voiceElements.microphoneRing.parentNode) {
                voiceElements.microphoneRing.parentNode.removeChild(voiceElements.microphoneRing);
            }
            if (voiceElements.waveformDisplay && voiceElements.waveformDisplay.parentNode) {
                voiceElements.waveformDisplay.parentNode.removeChild(voiceElements.waveformDisplay);
            }
            // Remove synchronization lines
            voiceElements.synchronizationLines.forEach(line => {
                if (line.parentNode) {
                    line.parentNode.removeChild(line);
                }
            });
        }
    };
}

// Add CSS for voice sync visualization
const voiceSyncStyle = document.createElement('style');
voiceSyncStyle.textContent = `
    .voice-mic-ring {
        position: relative;
        border-radius: 50%;
        background-color: rgba(0, 255, 255, 0.3);
        transition: all 0.1s ease;
        z-index: 1000;
    }

    .voice-mic-ring .mic-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--accent-primary);
        transition: all 0.1s ease;
    }

    .voice-mic-ring.pulse-soft {
        animation: pulseSoft 2s ease-in-out infinite;
    }

    .voice-waveform-container {
        position: fixed;
        top: 4rem;
        right: 1rem;
        width: 80px;
        height: 20px;
        z-index: 1000;
        pointer-events: none;
    }

    .waveform {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
    }

    .wave-point {
        width: 2px;
        background-color: var(--accent-primary);
        margin: 0 1px;
        border-radius: 1px;
        transition: height 0.1s ease;
    }

    /* Pulse animation */
    @keyframes pulseSoft {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }

    /* Synchronization lines */
    .sync-line {
        position: fixed;
        pointer-events: none;
        z-index: 900;
        background-color: rgba(0, 255, 255, 0.4);
        transition: opacity 0.1s ease, background-color 0.1s ease;
    }

    .sync-line.horizontal {
        height: 2px;
    }

    .sync-line.vertical {
        width: 2px;
    }

    .sync-line.diagonal {
        width: 2px;
        height: 2px;
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 5px,
            rgba(0, 255, 255, 0.4) 5px,
            rgba(0, 255, 255, 0.4) 10px
        );
    }
`;

document.head.appendChild(voiceSyncStyle);