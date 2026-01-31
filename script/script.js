    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Show notice on mobile
        if (isMobile) {
            document.getElementById('noticeBanner').classList.add('mobile-visible');
        }

        let gyroEnabled = false;
        let alpha = 0, beta = 0, gamma = 0;
        let lastUpdate = 0;
        const gyroIndicator = document.getElementById('gyroIndicator');
        
        function initGyroscope() {
            if (!isMobile) return;
            
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+ needs permission
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            enableGyroscope();
                        }
                    })
                    .catch(console.error);
            } else {
                enableGyroscope();
            }
        }
        
        function enableGyroscope() {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            gyroEnabled = true;
            gyroIndicator.classList.add('active');
            setTimeout(() => {
                gyroIndicator.style.opacity = '0.7';
            }, 1000);
        }
        
        function handleDeviceOrientation(event) {
            const now = Date.now();
            if (now - lastUpdate < 100) return; 
            
            lastUpdate = now;
            alpha = event.alpha; // 0-360 degrees
            beta = event.beta;   // -180 to 180 degrees
            gamma = event.gamma; // -90 to 90 degrees
            
            applyGyroscopeEffects();
        }
        
        function applyGyroscopeEffects() {
            if (!isMobile || !gyroEnabled) return;
            
            const featureCards = document.querySelectorAll('.feature-card');
            featureCards.forEach(card => {
                // Calculate tilt-based transformation
                const tiltX = gamma / 45; // Normalize to -2 to 2
                const tiltY = beta / 45;  // Normalize to -4 to 4
                
                // Apply subtle 3D transform
                card.style.transform = `perspective(1000px) rotateX(${tiltY * 2}deg) rotateY(${tiltX * 2}deg) translateZ(10px)`;
                card.style.transition = 'transform 0.3s ease';
                
                // Highlight card if tilted toward user
                if (Math.abs(tiltY) > 1.5) {
                    card.classList.add('active');
                    createParticles(card);
                } else {
                    card.classList.remove('active');
                }
            });
            
            // Apply to Setup section control deck
            const controlDeck = document.getElementById('controlDeck');
            if (controlDeck) {
                const deckTiltX = gamma / 30;
                const deckTiltY = beta / 30;
                controlDeck.style.transform = `perspective(1000px) rotateX(${deckTiltY}deg) rotateY(${deckTiltX}deg)`;
                controlDeck.style.transition = 'transform 0.5s ease';
            }
            
            // Apply to modules individually
            const modules = document.querySelectorAll('.module');
            modules.forEach((module, index) => {
                const moduleTiltX = (gamma + (index * 10)) / 40;
                const moduleTiltY = (beta + (index * 5)) / 40;
                module.style.transform = `perspective(500px) rotateX(${moduleTiltY}deg) rotateY(${moduleTiltX}deg)`;
                module.style.transition = 'transform 0.4s ease';
                
                // Add glowing border if tilted significantly
                if (Math.abs(gamma) > 30 || Math.abs(beta) > 30) {
                    module.style.borderColor = 'var(--primary)';
                    module.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.3)';
                } else {
                    module.style.borderColor = '';
                    module.style.boxShadow = '';
                }
            });
        }
        
        function createParticles(card) {
            const particleEffect = card.querySelector('.particle-effect');
            if (!particleEffect) return;
            
            // Clear old particles
            particleEffect.innerHTML = '';
            
            // Create new particles
            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
            
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                particle.style.left = `${x}%`;
                particle.style.top = `${y}%`;
                
                const size = 2 + Math.random() * 4;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                const colors = ['#c77dff', '#00f3ff', '#ffd700', '#ff0055'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.background = color;
                particle.style.boxShadow = `0 0 10px ${color}`;
                
                const duration = 1 + Math.random() * 1;
                const delay = Math.random() * 0.5;
                particle.style.animation = `particleFloat ${duration}s ease-out ${delay}s forwards`;
                
                particleEffect.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => {
                    if (particle.parentElement) {
                        particle.remove();
                    }
                }, (duration + delay) * 1000);
            }
        }
        
        // Add particle animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes particleFloat {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(${Math.random() * 100 - 50}px, -100px) scale(0);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // DESKTOP INTERACTIONS 
        function initDesktopInteractions() {
            if (isMobile) return;
            
            // About section hover effects
            const featureCards = document.querySelectorAll('.feature-card');
            featureCards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.classList.add('active');
                    createParticles(card);
                });
                
                card.addEventListener('mouseleave', () => {
                    card.classList.remove('active');
                });
            });
            
            // Setup section module hover effects
            const modules = document.querySelectorAll('.module');
            modules.forEach(module => {
                module.addEventListener('mouseenter', () => {
                    module.style.borderColor = 'var(--primary)';
                    module.style.boxShadow = '0 0 30px rgba(0, 243, 255, 0.2)';
                });
                
                module.addEventListener('mouseleave', () => {
                    module.style.borderColor = '';
                    module.style.boxShadow = '';
                });
            });
        }
        
        function createShootingStars() {
            const sections = ['.dedication-section', '.about-section', '.setup-section'];
            sections.forEach(sectionClass => {
                const section = document.querySelector(sectionClass);
                if (!section) return;
                for (let i = 0; i < 5; i++) {
                    createShootingStar(section);
                }
            });
        }
        
        function createShootingStar(container) {
            const star = document.createElement('div');
            star.classList.add('shooting-star');
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            star.style.left = `${left}%`;
            star.style.top = `${top}%`;
            const size = 1 + Math.random() * 2;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            const duration = 1.5 + Math.random() * 2.5;
            const delay = Math.random() * 8;
            const animationType = Math.random() > 0.5 ? 'shootStar' : 'shootStar2';
            star.style.animation = `${animationType} ${duration}s linear ${delay}s infinite`;
            container.appendChild(star);
            setTimeout(() => { if (star.parentElement) { star.remove(); createShootingStar(container); } }, (duration + delay) * 1000);
        }

        // WELCOME SCREEN
        function enterSite() {
            const welcomeScreen = document.getElementById('welcomeScreen');
            welcomeScreen.style.opacity = '0';
            welcomeScreen.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                welcomeScreen.style.display = 'none';
                document.getElementById('navbar').classList.add('visible');
                document.getElementById('planetLeft').style.opacity = '1';
                document.getElementById('planetLeft').style.transform = 'translateX(0)';
                document.getElementById('centerOrb').style.opacity = '1';
                document.getElementById('centerOrb').style.transform = 'scale(1)';
                document.getElementById('rightText').style.opacity = '1';
                document.getElementById('rightText').style.transform = 'translateY(-50%) translateX(0)';
                document.getElementById('socialBar').style.opacity = '1';
                document.getElementById('socialBar').style.transform = 'translateY(0)';
                document.querySelector('.top-tagline').classList.add('visible');
                createShootingStars();
                initThreeJS(); // Initialize 3D scenes after entry
                
                // Initialize interactions based on device
                if (isMobile) {
                    initGyroscope();
                } else {
                    initDesktopInteractions();
                }
            }, 1000);
        }

        function redirectToMain() {
            const config = {
                HEART: { text: document.getElementById('txt-heart')?.value || "LOVE YOU", filter: document.getElementById('sel-heart')?.value || 'cupid', color: '#ff6b9d' },
                OPEN:  { text: document.getElementById('txt-open')?.value || "MISS YOU", filter: document.getElementById('sel-open')?.value || 'sadness', color: '#6b9dff' },
                THUMBS: { text: document.getElementById('txt-thumbs')?.value || "SO PROUD", filter: document.getElementById('sel-thumbs')?.value || 'joy', color: '#6bffd3' }
            };
            localStorage.setItem('photoboothConfig', JSON.stringify(config));
            const buttons = document.querySelectorAll('.btn-signin, .big-launch-btn');
            buttons.forEach(button => {
                button.innerHTML = "<i class='fas fa-rocket'></i> SYSTEM LAUNCHING...";
                button.style.borderColor = "#00f3ff";
                button.style.color = "#00f3ff";
            });
            setTimeout(() => { window.location.href = 'main.html'; }, 1000);
        }

        function checkScroll() {
            const elements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .dedication-section, .about-section, .setup-section');
            elements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                if (elementTop < window.innerHeight - 150) { element.classList.add('visible'); }
            });
        }

        function createMovingStars() {
            const starsContainer = document.getElementById('stars-container');
            const starCount = 100;
            starsContainer.innerHTML = '';
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.classList.add('star');
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                const size = Math.random() * 3;
                star.style.width = size + 'px';
                star.style.height = size + 'px';
                const duration = 2 + Math.random() * 4;
                const delay = Math.random() * 5;
                star.style.animation = `twinkle ${duration}s infinite ${delay}s`;
                starsContainer.appendChild(star);
            }
        }

        let pickrHeart, pickrOpen, pickrThumbs;
        const filterOptions = [
            { val: 'cupid', txt: '💘 Cupid Mode' },
            { val: 'romance', txt: '🌹 Romance Mode' },
            { val: 'alien', txt: '👽 Alien Mode' },
            { val: 'ghost', txt: '👻 Ghost Mode' },
            { val: 'joy', txt: '☀️ Joy Mode' },
            { val: 'sadness', txt: '💧 Sadness Mode' },
            { val: 'dreamy', txt: '🔮 Dreamy Mode' },
            { val: 'radioactive', txt: '☢️ Toxic Mode' }
        ];

        function populateSelects() {
            const selects = ['sel-heart', 'sel-open', 'sel-thumbs'];
            const defaults = ['cupid', 'sadness', 'joy']; 
            selects.forEach((id, index) => {
                const sel = document.getElementById(id);
                if (!sel) return;
                sel.innerHTML = ''; 
                filterOptions.forEach(opt => {
                    const el = document.createElement('option');
                    el.value = opt.val; el.innerText = opt.txt;
                    if(opt.val === defaults[index]) el.selected = true;
                    sel.appendChild(el);
                });
            });
        }

        function initColorPickers() {
            const commonConfig = { theme: 'monolith', default: '#00f3ff', components: { preview: true, opacity: true, hue: true, interaction: { hex: true, input: true, save: true } } };
            try {
                if (document.getElementById('color-picker-heart')) pickrHeart = Pickr.create({ ...commonConfig, el: '#color-picker-heart', default: '#ff6b9d' });
                if (document.getElementById('color-picker-open')) pickrOpen = Pickr.create({ ...commonConfig, el: '#color-picker-open', default: '#6b9dff' });
                if (document.getElementById('color-picker-thumbs')) pickrThumbs = Pickr.create({ ...commonConfig, el: '#color-picker-thumbs', default: '#6bffd3' });
            } catch (e) { console.log('Color pickers initialized'); }
        }

        function initThreeJS() {
            initDedicationScene();
            initAboutScene();
            initSetupScene();
        }

        function initDedicationScene() {
            const container = document.getElementById('canvas-dedication');
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(renderer.domElement);

            // Particles Sphere
            const geometry = new THREE.BufferGeometry();
            const count = 2000;
            const posArray = new Float32Array(count * 3);
            for(let i = 0; i < count * 3; i++) {
                posArray[i] = (Math.random() - 0.5) * 10;
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            const material = new THREE.PointsMaterial({ size: 0.02, color: 0xc77dff, transparent: true, opacity: 0.8 });
            const particlesMesh = new THREE.Points(geometry, material);
            scene.add(particlesMesh);

            camera.position.z = 4;

            // Interaction
            let mouseX = 0;
            let mouseY = 0;
            document.addEventListener('mousemove', (event) => {
                mouseX = event.clientX * 0.0005;
                mouseY = event.clientY * 0.0005;
            });

            function animate() {
                requestAnimationFrame(animate);
                particlesMesh.rotation.y += 0.003;
                particlesMesh.rotation.x += 0.001;
                particlesMesh.rotation.y += 0.05 * (mouseX - particlesMesh.rotation.y);
                particlesMesh.rotation.x += 0.05 * (mouseY - particlesMesh.rotation.x);
                renderer.render(scene, camera);
            }
            animate();
            handleResize(container, camera, renderer);
        }

        function initAboutScene() {
            const container = document.getElementById('canvas-about');
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(renderer.domElement);

            // Floating Icosahedrons
            const shapes = [];
            const geometry = new THREE.IcosahedronGeometry(0.5, 0);
            const material = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.2 });

            for(let i=0; i<15; i++) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = (Math.random() - 0.5) * 15;
                mesh.position.y = (Math.random() - 0.5) * 10;
                mesh.position.z = (Math.random() - 0.5) * 5;
                mesh.userData = { speed: Math.random() * 0.01 + 0.002, rotSpeed: Math.random() * 0.02 };
                scene.add(mesh);
                shapes.push(mesh);
            }

            camera.position.z = 5;

            function animate() {
                requestAnimationFrame(animate);
                shapes.forEach(shape => {
                    shape.rotation.x += shape.userData.rotSpeed;
                    shape.rotation.y += shape.userData.rotSpeed;
                    shape.position.y += Math.sin(Date.now() * 0.001 * shape.userData.speed) * 0.01;
                });
                renderer.render(scene, camera);
            }
            animate();
            handleResize(container, camera, renderer);
        }

        function initSetupScene() {
            const container = document.getElementById('canvas-setup');
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(renderer.domElement);

            // Cyber Grid
            const geometry = new THREE.PlaneGeometry(30, 30, 20, 20);
            const material = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.1 });
            const plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = Math.PI / 2;
            scene.add(plane);

            camera.position.y = 2;
            camera.position.z = 5;
            camera.lookAt(0,0,0);

            function animate() {
                requestAnimationFrame(animate);
                plane.position.z = (Date.now() * 0.001) % 1.5; // Moving floor effect
                renderer.render(scene, camera);
            }
            animate();
            handleResize(container, camera, renderer);
        }

        function handleResize(container, camera, renderer) {
            window.addEventListener('resize', () => {
                const width = container.clientWidth;
                const height = container.clientHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            createMovingStars();
            populateSelects();
            initColorPickers();
            
            // Smooth Scroll
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
                    }
                });
            });
            
            window.addEventListener('scroll', checkScroll);
            checkScroll();
        
            const setupItems = document.querySelectorAll('.module');
            setupItems.forEach((item, index) => { item.style.transitionDelay = `${0.1 + (index * 0.1)}s`; });
            
            // Mobile tap interactions
            if (isMobile) {
                const featureCards = document.querySelectorAll('.feature-card');
                featureCards.forEach(card => {
                    card.addEventListener('touchstart', () => {
                        card.classList.add('active');
                        createParticles(card);
                    });
                    
                    card.addEventListener('touchend', () => {
                        setTimeout(() => {
                            card.classList.remove('active');
                        }, 1000);
                    });
                });
                
                const modules = document.querySelectorAll('.module');
                modules.forEach(module => {
                    module.addEventListener('touchstart', () => {
                        module.style.borderColor = 'var(--primary)';
                        module.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.3)';
                    });
                    
                    module.addEventListener('touchend', () => {
                        setTimeout(() => {
                            module.style.borderColor = '';
                            module.style.boxShadow = '';
                        }, 500);
                    });
                });
            }
        });