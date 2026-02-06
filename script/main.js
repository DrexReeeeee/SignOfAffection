const CANVAS_FILTERS = {
    'cupid':       'contrast(1.2) saturate(1.6) brightness(1.15) sepia(0.1) hue-rotate(-5deg)',
    'romance':     'brightness(0.9) contrast(1.3) sepia(0.8) hue-rotate(-60deg) saturate(2.0)',
    'dreamy':      'brightness(1.1) contrast(0.9) sepia(0.2) hue-rotate(30deg)',
    'alien':       'hue-rotate(120deg) invert(0.1)', 
    'ghost':       'grayscale(1) brightness(1.3) contrast(1.2)', 
    'radioactive': 'contrast(1.5) saturate(3) hue-rotate(90deg)', 
    'joy':         'brightness(1.2) saturate(1.5) contrast(1.1) sepia(0.1)',
    'sadness':     'grayscale(0.8) hue-rotate(190deg) brightness(0.9) contrast(0.9)',
    'anger':       'contrast(1.5) saturate(2.0) sepia(0.5) hue-rotate(-50deg)',
    'disgust':     'sepia(0.6) hue-rotate(60deg) saturate(1.2) contrast(1.1)',
    'neutral':     'none'
};

const FILTERS = {
    'cupid':       { hue: 330, emoji: '❤️', name: 'Cupid' },
    'romance':     { hue: 360, emoji: '🌹', name: 'Romance' },
    'dreamy':      { hue: 270, emoji: '✨', name: 'Dreamy' },
    'joy':         { hue: 50,  emoji: '😁', name: 'Joy' },
    'sadness':     { hue: 210, emoji: '💧', name: 'Sadness' },
    'anger':       { hue: 10,  emoji: '🤬', name: 'Anger' },
    'disgust':     { hue: 120, emoji: '🤢', name: 'Disgust' },
    'alien':       { hue: 280, emoji: '👽', name: 'Alien' }, 
    'ghost':       { hue: 180, emoji: '👻', name: 'Ghost' },
    'radioactive': { hue: 90,  emoji: '☢️', name: 'Radioactive' },
    'neutral':     { hue: 260, emoji: '✨', name: 'Neutral' }
};

// Load configuration from localStorage
const savedConfig = localStorage.getItem('photoboothConfig');
let userConfig = savedConfig ? JSON.parse(savedConfig) : {
    HEART:  { text: "LOVE YOU", filter: "cupid", color: "#ff6b9d" },
    OPEN:   { text: "MISS YOU", filter: "sadness", color: "#6b9dff" },
    THUMBS: { text: "SO PROUD", filter: "joy", color: "#6bffd3" }
};

let activeFilter = 'neutral';
let overlayInterval = null;
let currentTextColor = '#ff6b9d';

// Media capture variables
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let currentMediaItem = null;
let galleryItems = JSON.parse(localStorage.getItem('photoboothGallery')) || [];

// Recording buffers
let recordingCanvas = document.createElement('canvas');
let recordingCtx = recordingCanvas.getContext('2d');

const getResponsiveConfig = () => {
    const isMobile = window.innerWidth <= 768;
    return {
        scanGap: isMobile ? 8 : 5,             
        particleCount: isMobile ? 1500 : 3500,    
        starSize: isMobile ? 3.5 : 4.5,          
        friction: 0.78,         
        ease: 0.60,             
        textScale: isMobile ? 80 : 150,         
        trailFade: 0.25,        
        trackingSmoothness: 0.45 
    };
};

let CONFIG = getResponsiveConfig();

const videoElement = document.getElementById('input_video');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d', { alpha: true }); 
const overlayLayer = document.getElementById('overlay-layer');
const guideText = document.getElementById('guide-text');
const currentGestureIcon = document.getElementById('current-gesture-icon');
const currentGestureText = document.getElementById('current-gesture-text');
const filterEmoji = document.getElementById('filter-emoji');
const filterName = document.getElementById('filter-name');
const currentColorDot = document.getElementById('current-color-dot');
const colorHeartPreview = document.getElementById('color-heart-preview');
const colorOpenPreview = document.getElementById('color-open-preview');
const colorThumbsPreview = document.getElementById('color-thumbs-preview');
const photoBtn = document.getElementById('photo-btn');
const videoBtn = document.getElementById('video-btn');
const galleryItemsContainer = document.getElementById('gallery-items');
const downloadOverlay = document.getElementById('download-overlay');
const downloadPreview = document.getElementById('download-preview');

// Toggle Elements
const instructionToggle = document.getElementById('instruction-toggle');
const instructionsBox = document.getElementById('instructions-box');

let width = window.innerWidth;
let height = window.innerHeight;
let particles = [];
let currentText = "";
let time = 0;
let handPos = { x: width/2, y: height/2 };
let smoothHandPos = { x: width/2, y: height/2 };
let currentMask = null;

function createStars() {
    const starsContainer = document.getElementById('stars-container');
    const starCount = 150;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 5;
        
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

// Load gallery from localStorage
function loadGallery() {
    galleryItemsContainer.innerHTML = '';
    galleryItems.forEach((item, index) => {
        addGalleryItem(item.url, item.type, index);
    });
}

// Add item to gallery
function addGalleryItem(url, type, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.index = index;
    
    if (type === 'photo') {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Captured photo';
        item.appendChild(img);
    } else {
        const video = document.createElement('video');
        video.src = url;
        video.controls = false;
        video.muted = true;
        video.onmouseenter = () => video.play();
        video.onmouseleave = () => {
            video.pause();
            video.currentTime = 0;
        };
        item.appendChild(video);
    }
    
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'gallery-item-delete';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteGalleryItem(index);
    };
    
    item.appendChild(deleteBtn);
    item.onclick = () => showMediaPreview(url, type);
    
    galleryItemsContainer.prepend(item);
}

// Delete gallery item
function deleteGalleryItem(index) {
    galleryItems.splice(index, 1);
    localStorage.setItem('photoboothGallery', JSON.stringify(galleryItems));
    loadGallery();
}

// Show media preview for download
function showMediaPreview(url, type) {
    downloadPreview.src = url;
    currentMediaItem = { url, type };
    downloadOverlay.style.display = 'flex';
}

// Close download overlay
function closeDownloadOverlay() {
    downloadOverlay.style.display = 'none';
    currentMediaItem = null;
}

// Download media
function downloadMedia() {
    if (!currentMediaItem) return;
    
    const link = document.createElement('a');
    link.href = currentMediaItem.url;
    link.download = `galaxy_photobooth_${Date.now()}.${currentMediaItem.type === 'photo' ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function saveToGalleryMobile(blob) {
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';

    const file = new File([blob], `galaxy_${Date.now()}.${ext}`, {
        type: blob.type
    });


    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'Galaxy Photobooth',
            text: 'Saved from Galaxy Photobooth'
        });
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// --- FIXED PHOTO CAPTURE FUNCTION ---
function takePhoto() {
    const tempCanvas = document.createElement('canvas');
    // Force integer dimensions to prevent mobile rendering glitches
    const vWidth = Math.floor(videoElement.videoWidth || width);
    const vHeight = Math.floor(videoElement.videoHeight || height);
    
    tempCanvas.width = vWidth;
    tempCanvas.height = vHeight;
    
    const tempCtx = tempCanvas.getContext('2d');

    // 1. Apply Filter using the safe map
    const safeFilter = CANVAS_FILTERS[activeFilter] || 'none';
    
    tempCtx.save(); // Save state
    tempCtx.filter = safeFilter;
    tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.restore(); // Restore state (removes filter for particles)

    // 2. Draw Particles
    const scaleX = tempCanvas.width / width;
    const scaleY = tempCanvas.height / height;
    
    tempCtx.save();
    tempCtx.scale(scaleX, scaleY);
    tempCtx.globalCompositeOperation = 'lighter';
    particles.forEach(particle => {
        if (particle.active) {
            particle.drawToContext(tempCtx);
        }
    });
    tempCtx.restore();
    
    // 3. Save
    const photoUrl = tempCanvas.toDataURL('image/png');
    
    const galleryItem = {
        url: photoUrl,
        type: 'photo',
        timestamp: Date.now()
    };
    
    galleryItems.push(galleryItem);
    localStorage.setItem('photoboothGallery', JSON.stringify(galleryItems));
    addGalleryItem(photoUrl, 'photo', galleryItems.length - 1);
    
    // Visual feedback
    photoBtn.style.background = 'rgba(0, 255, 0, 0.5)';
    setTimeout(() => {
        photoBtn.style.background = '';
    }, 300);
}

async function toggleVideoRecording() {
    if (!isRecording) {
        // Setup hidden canvas for high-quality composition
        recordingCanvas.width = Math.floor(videoElement.videoWidth || 1280);
        recordingCanvas.height = Math.floor(videoElement.videoHeight || 720);
        
        // Start recording
        try {
            const stream = recordingCanvas.captureStream(30);
            const mimeType = MediaRecorder.isTypeSupported('video/mp4')
                ? 'video/mp4'
                : 'video/webm';

            mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 5_000_000
            });

            
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                const webmBlob = new Blob(recordedChunks, { type: 'video/webm' });

                // Detect Android
                const isAndroid = /Android/i.test(navigator.userAgent);

                if (isAndroid) {
                    // ✅ Saves into Gallery via MediaStore
                    await saveToGalleryMobile(webmBlob);
                } else {
                    // Desktop / iOS fallback (normal gallery flow)
                    const videoUrl = URL.createObjectURL(webmBlob);

                    const galleryItem = {
                        url: videoUrl,
                        type: 'video',
                        timestamp: Date.now()
                    };

                    galleryItems.push(galleryItem);
                    localStorage.setItem('photoboothGallery', JSON.stringify(galleryItems));
                    addGalleryItem(videoUrl, 'video', galleryItems.length - 1);
                }
            };

            
            mediaRecorder.start();
            isRecording = true;
            videoBtn.classList.add('recording');
            videoBtn.innerHTML = '<i class="fas fa-stop"></i>';
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Unable to start video recording. Please try again.');
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        videoBtn.classList.remove('recording');
        videoBtn.innerHTML = '<i class="fas fa-video"></i>';
    }
}

// Initialize with saved configuration
document.addEventListener('DOMContentLoaded', () => {
    createStars();
    loadGallery();
    
    colorHeartPreview.style.backgroundColor = userConfig.HEART.color;
    colorOpenPreview.style.backgroundColor = userConfig.OPEN.color;
    colorThumbsPreview.style.backgroundColor = userConfig.THUMBS.color;
    
    // Update guide text with user configuration
    guideText.innerHTML = 
        `✊ ${userConfig.HEART.text} &nbsp; • &nbsp; ✋ ${userConfig.OPEN.text} &nbsp; • &nbsp; 👍 ${userConfig.THUMBS.text}`;
    
    photoBtn.addEventListener('click', takePhoto);
    videoBtn.addEventListener('click', toggleVideoRecording);
    
    // Mobile Instruction Toggle
    instructionToggle.addEventListener('click', () => {
        instructionsBox.classList.toggle('active');
        instructionToggle.querySelector('i').classList.toggle('fa-question');
        instructionToggle.querySelector('i').classList.toggle('fa-times');
    });

    initAI();
});

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    handPos = { x: width/2, y: height/2 };
    smoothHandPos = { x: width/2, y: height/2 };
    
    // Update config for mobile responsiveness
    CONFIG = getResponsiveConfig();
    initParticles();
    
    // Update video element size
    videoElement.style.width = `min(1280px, 95vw)`;
    videoElement.style.height = `min(720px, 95vh)`;
});


function spawnEmoji() {
    if (activeFilter === 'neutral') return;

    const data = FILTERS[activeFilter];
    if (!data || !data.emoji) return;

    const el = document.createElement('div');
    el.innerText = data.emoji;
    el.className = 'floater';
    
    const rX = Math.random() * 100;
    const size = Math.random() * 30 + 30; 
    
    el.style.left = `${rX}%`;
    el.style.fontSize = `${size}px`;
    
    const duration = Math.random() * 2 + 2; 
    el.style.animationDuration = `${duration}s`;

    overlayLayer.appendChild(el);

    setTimeout(() => {
        if(el.parentNode) el.parentNode.removeChild(el);
    }, duration * 1000);
}

function setFilter(filterName) {
    if (activeFilter === filterName) return;
    activeFilter = filterName;
    
    document.body.className = `filter-${filterName}`;
    
    // Update filter display
    const filterData = FILTERS[filterName];
    filterEmoji.textContent = filterData.emoji;
    filterName.textContent = filterData.name;

    if (overlayInterval) clearInterval(overlayInterval);
    if (filterName !== 'neutral') {
        overlayInterval = setInterval(spawnEmoji, 400);
    }
}


class Particle {
    constructor() {
        this.initGalaxy();
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 5; 
        this.vy = (Math.random() - 0.5) * 5;
        this.size = Math.random() * CONFIG.starSize + 1.0;
        this.active = false; 
        this.isTextPixel = false;
        this.targetOffsetX = 0;
        this.targetOffsetY = 0;
    }

    initGalaxy() {
        this.orbitRadius = Math.pow(Math.random(), 1.5) * (Math.max(width, height) * 0.55) + 50; 
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitSpeed = (60 / this.orbitRadius) * 0.01; 
    }

    update() {
        let tx, ty;
        if (this.active) {
            tx = smoothHandPos.x + this.targetOffsetX;
            ty = smoothHandPos.y + this.targetOffsetY;
            const dx = tx - this.x;
            const dy = ty - this.y;
            const ease = this.isTextPixel ? CONFIG.ease : CONFIG.ease * 0.7;
            this.vx += dx * ease;
            this.vy += dy * ease;
            if (!this.isTextPixel) {
                this.vx += Math.sin(time * 10 + this.x) * 1.0; 
                this.vy += Math.cos(time * 10 + this.y) * 1.0;
            }
        } else {
            this.orbitAngle += this.orbitSpeed;
            const angle = this.orbitAngle + (this.orbitRadius * 0.003 * 5); 
            const cx = width / 2;
            const cy = height / 2;
            tx = cx + Math.cos(angle) * this.orbitRadius;
            ty = cy + Math.sin(angle) * this.orbitRadius * 0.85;
            const dx = tx - this.x;
            const dy = ty - this.y;
            this.vx += dx * 0.025; 
            this.vy += dy * 0.025;
        }
        this.vx *= CONFIG.friction;
        this.vy *= CONFIG.friction;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        let h, s, l, a;
        if (this.active) {
            if (this.isTextPixel) {
                const rgb = hexToRgb(currentTextColor);
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                h = hsl.h;
                s = hsl.s * 100;
                l = hsl.l * 100;
                a = 1.0;
            } else {
                const baseHue = FILTERS[activeFilter].hue;
                h = baseHue + (this.x / width) * 30 + (time * 10); 
                s = 100; 
                l = 50;
                a = 0.6;
            }
        } else {
            const dist = Math.sqrt(Math.pow(this.x - width/2, 2) + Math.pow(this.y - height/2, 2));
            const maxDist = height / 1.5;
            const ratio = Math.min(1, dist / maxDist);
            h = 45 + (ratio * 240); 
            s = 90; 
            l = 95 - (ratio * 30); 
            a = 0.9;
        }
        
        const timeVal = time * 5;
        const flicker = Math.abs(Math.sin(timeVal + this.x)); 
        const finalSize = this.isTextPixel ? this.size + (flicker * 2) : (this.size * 0.7) + flicker;

        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${a})`;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(time + this.x); 
        ctx.beginPath();
        ctx.moveTo(0, -finalSize); 
        ctx.lineTo(finalSize, 0);
        ctx.lineTo(0, finalSize); 
        ctx.lineTo(-finalSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawToContext(tempCtx) {
        const rgb = hexToRgb(currentTextColor);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const h = hsl.h;
        const s = hsl.s * 100;
        const l = hsl.l * 100;
        
        tempCtx.fillStyle = `hsla(${h}, ${s}%, ${l}%, 1.0)`;
        tempCtx.save();
        tempCtx.translate(this.x, this.y);
        tempCtx.rotate(time + this.x); 
        tempCtx.beginPath();
        tempCtx.moveTo(0, -this.size); 
        tempCtx.lineTo(this.size, 0);
        tempCtx.lineTo(0, this.size); 
        tempCtx.lineTo(-this.size, 0);
        tempCtx.closePath();
        tempCtx.fill();
        tempCtx.restore();
    }
}

// Helper functions for color conversion
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 107, b: 157 };
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: s,
        l: l
    };
}

function scanText(text) {
    if (text === currentText) return;
    currentText = text;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const oCtx = offCanvas.getContext('2d');
    if (text !== "") {
        oCtx.fillStyle = currentTextColor;
        oCtx.font = `900 ${CONFIG.textScale}px "Arial Black", sans-serif`;
        oCtx.textAlign = 'center';
        oCtx.textBaseline = 'middle';
        oCtx.fillText(text, width / 2, height / 2);
    }
    const imgData = oCtx.getImageData(0, 0, width, height).data;
    const targets = [];
    if (text !== "") {
        for (let y = 0; y < height; y += CONFIG.scanGap) {
            for (let x = 0; x < width; x += CONFIG.scanGap) {
                if (imgData[(y * width + x) * 4 + 3] > 128) {
                    targets.push({ offsetX: x - width/2, offsetY: y - height/2 });
                }
            }
        }
    }
    assignParticles(targets);
}

function assignParticles(targets) {
    if (targets.length === 0) {
        particles.forEach(p => p.active = false);
        return;
    }
    particles.sort(() => Math.random() - 0.5);
    for (let i = 0; i < particles.length; i++) {
        particles[i].active = true; 
        if (i < targets.length) {
            particles[i].targetOffsetX = targets[i].offsetX;
            particles[i].targetOffsetY = targets[i].offsetY;
            particles[i].isTextPixel = true;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 80 + 30; 
            particles[i].targetOffsetX = Math.cos(angle) * radius;
            particles[i].targetOffsetY = Math.sin(angle) * radius;
            particles[i].isTextPixel = false;
        }
    }
}

function initParticles() {
    particles = [];
    for(let i = 0; i < CONFIG.particleCount; i++) {
        particles.push(new Particle());
    }
}

// --- FIXED ANIMATION LOOP FOR VIDEO RECORDING ---
function animate() {
    time += 0.015;
    let targetX = (activeFilter === 'neutral') ? width/2 : handPos.x;
    let targetY = (activeFilter === 'neutral') ? height/2 : handPos.y;
    smoothHandPos.x += (targetX - smoothHandPos.x) * CONFIG.trackingSmoothness;
    smoothHandPos.y += (targetY - smoothHandPos.y) * CONFIG.trackingSmoothness;

    // --- Draw Main Canvas (Particles) ---
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.trailFade})`;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter'; 
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }

    if (currentMask && activeFilter === 'neutral') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.filter = 'blur(5px)'; 
        ctx.drawImage(currentMask, 0, 0, width, height);
        ctx.filter = 'none';
    }

    ctx.globalCompositeOperation = 'source-over';

    // --- UPDATED VIDEO RECORDING LOGIC (Using Safe Filters) ---
    if (isRecording) {
        // 1. Clear Buffer
        recordingCtx.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
        
        // 2. Apply the Safe Filter (This fixes the mobile video issue)
        const safeFilter = CANVAS_FILTERS[activeFilter] || 'none';
        recordingCtx.save(); // Save state
        recordingCtx.filter = safeFilter;
        
        // 3. Draw Filtered Video Frame
        recordingCtx.drawImage(videoElement, 0, 0, recordingCanvas.width, recordingCanvas.height);
        recordingCtx.restore(); // Restore to remove filter
        
        // 4. Draw the Particles (from the main canvas) on top
        recordingCtx.drawImage(canvas, 0, 0, recordingCanvas.width, recordingCanvas.height);
    }

    requestAnimationFrame(animate);
}

function detectGesture(landmarks) {
    const isFolded = (idx) => landmarks[idx].y > landmarks[idx-2].y;
    const isExtended = (idx) => landmarks[idx].y < landmarks[idx-2].y;
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const thumbIndexDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    handPos.x = landmarks[9].x * width;
    handPos.y = landmarks[9].y * height;

    if (thumbIndexDist < 0.08 && isFolded(12) && isFolded(16) && isFolded(20)) {
        return { 
            text: userConfig.HEART.text, 
            filter: userConfig.HEART.filter,
            color: userConfig.HEART.color,
            icon: '✊',
            gesture: 'Fist Sign'
        };
    }
    if (thumbTip.y < landmarks[3].y && isFolded(8) && isFolded(12) && isFolded(16) && isFolded(20)) {
        return { 
            text: userConfig.THUMBS.text, 
            filter: userConfig.THUMBS.filter,
            color: userConfig.THUMBS.color,
            icon: '👍',
            gesture: 'Thumbs Up'
        };
    }
    if (isExtended(8) && isExtended(12) && isExtended(16) && isExtended(20)) {
        return { 
            text: userConfig.OPEN.text, 
            filter: userConfig.OPEN.filter,
            color: userConfig.OPEN.color,
            icon: '✋',
            gesture: 'Open Hand'
        };
    }
    return { 
        text: "", 
        filter: "neutral",
        color: "#ffffff",
        icon: '✨',
        gesture: 'Make a gesture'
    };
}

function onHandResults(results) {
    let result = { 
        text: "", 
        filter: "neutral",
        color: "#ffffff",
        icon: '✨',
        gesture: 'Make a gesture'
    };
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        result = detectGesture(results.multiHandLandmarks[0]);
    }
    
    currentGestureIcon.textContent = result.icon;
    currentGestureText.textContent = result.gesture;
    currentColorDot.style.backgroundColor = result.color;
    currentTextColor = result.color;
    
    setFilter(result.filter);
    scanText(result.text);
}

function onSegmentationResults(results) {
    currentMask = results.segmentationMask;
}

function initAI() {
    canvas.width = width;
    canvas.height = height;
    initParticles();
    const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults(onHandResults);
    const segmenter = new SelfieSegmentation({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`});
    segmenter.setOptions({ modelSelection: 1 });
    segmenter.onResults(onSegmentationResults);
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
            await segmenter.send({image: videoElement});
        },
        width: 1280,
        height: 720
    });
    camera.start();
    animate();
}