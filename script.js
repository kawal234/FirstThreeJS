import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const headerSplits = new SplitText(".header-1 h1", {
        type: "chars",
        charsClass: "char",
    });

    const titleSplits = new SplitText(".tooltip .title h2", {
        type: "lines",
        linesClass: "line",
    });

    const descriptionSplits = new SplitText(".tooltip .description p", {
        type: "lines",
        linesClass: "line",
    });

    headerSplits.chars.forEach(
        (char) => (char.innerHTML = `<span>${char.innerHTML}</span>`)
    );

    [...titleSplits.lines, ...descriptionSplits.lines].forEach(
        (line) => (line.innerHTML = `<span>${line.innerHTML}</span>`)
    );

    const animOptions = { duration: 1, ease: "power3.out", stagger: 0.025 };
    const tooltipSelector = [
        {
            trigger: 0.65,
            elements: [
                ".tooltips .tooltip:nth-child(1) .icon ion-icon",
                ".tooltips .tooltip:nth-child(1) .title .line > span",
                ".tooltips .tooltip:nth-child(1) .description .line > span"
            ],
        },
        {
            trigger: 0.85,
            elements: [
                ".tooltips .tooltip:nth-child(2) .icon ion-icon",
                ".tooltips .tooltip:nth-child(2) .title .line > span",
                ".tooltips .tooltip:nth-child(2) .description .line > span"
            ],
        },
    ];

    ScrollTrigger.create({
        trigger: ".product-overview",
        start: "75% bottom",
        onEnter: () =>
            gsap.to(".header-1 h1 .char>span", {
                y: "0%",
                duration: 1,
                ease: "power3.out",
                stagger: 0.025,
            }),
        onLeaveBack: () =>
            gsap.to(".header-1 h1 .char>span", {
                y: "100%",
                duration: 1,
                ease: "power3.out",
                stagger: 0.025,
            }),
    });

    let model,
        currentRotation = 0,
        modelSize;

    const scene = new THREE.Scene();
    const modalContainer = document.querySelector(".modal-container");
    const getContainerSize = () => ({
        width: modalContainer?.clientWidth || window.innerWidth,
        height: modalContainer?.clientHeight || window.innerHeight,
    });

    const { width: initialWidth, height: initialHeight } = getContainerSize();

    const camera = new THREE.PerspectiveCamera(
        60,
        initialWidth / initialHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // FIXED: Use newer Three.js property names
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    modalContainer.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(1, 2, 3);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.001;
    mainLight.shadow.mapSize.width = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 0, -2);
    scene.add(fillLight);

    function setupModel() {
        if (!model || !modelSize) return;

        const isMobile = window.innerWidth < 1000;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());

        const horizontalOffset = isMobile ? 0 : modelSize.x * 0.45;
        model.position.set(
            center.x + horizontalOffset,
            -center.y + modelSize.y * 0.085,
            -center.z
        );

        model.rotation.z = isMobile ? 0 : THREE.MathUtils.degToRad(25);

        const cameraDistance = isMobile ? 2.2 : 1.45;
        camera.position.set(
            isMobile ? 0 : modelSize.x * 0.18,
            0,
            Math.max(modelSize.x, modelSize.y, modelSize.z) * cameraDistance
        );
        camera.lookAt(0, 0, 0);
    }

    // Create a placeholder model while GLB loads
    function createPlaceholder() {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x667eea,
            metalness: 0.3,
            roughness: 0.4,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        const capGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 32);
        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0x764ba2,
            metalness: 0.6,
            roughness: 0.3
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 1.45;
        group.add(cap);

        return group;
    }

    // Load placeholder first
    model = createPlaceholder();
    scene.add(model);
    
    const box = new THREE.Box3().setFromObject(model);
    modelSize = box.getSize(new THREE.Vector3());
    setupModel();

    // Try to load the GLB model
    const loader = new GLTFLoader();
    const shakerUrl = new URL("./shaker.glb", import.meta.url).href;

    loader.load(
        shakerUrl,
        (gltf) => {
            // Remove placeholder
            if (model) {
                scene.remove(model);
            }

            model = gltf.scene;

            model.traverse((node) => {
                if (node.isMesh && node.material) {
                    Object.assign(node.material, {
                        metalness: 0.5,
                        roughness: 0.9,
                    });
                }
            });
            
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());

            modelSize = size;

            scene.add(model);
            setupModel();
            
            console.log('GLB model loaded successfully');
        },
        (progress) => {
            console.log('Loading:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading GLB model:', error);
            console.log('Using placeholder model instead');
        }
    );

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        const { width, height } = getContainerSize();
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        setupModel();
    });

    ScrollTrigger.create({
        trigger: ".product-overview",
        start: "top top",
        end: `+=${window.innerHeight * 10}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: ({ progress }) => {
            const headerProgress = Math.max(0, Math.min(1, (progress - 0.5) / 0.3));
            gsap.to(".header-1", {
                xPercent:
                    progress < 0.05 ? 0 : progress > 0.35 ? -100 : -100 * headerProgress,
                duration: 0,
            });

            const maskSize =
                progress < 0.2 ? 0 : progress > 0.3 ? 100 : 100 * ((progress - 0.2) / 0.1);
            gsap.to(".circular-mask", {
                clipPath: `circle(${maskSize}% at 50% 50%)`,
                duration: 0,
            });

            const header2Progress = (progress - 0.15) / 0.35;
            const header2xPercent = progress < 0.15 ? 100 : progress > 0.5 ? -200 : 100 - 300 * header2Progress;
            gsap.to(".header-2", { 
                xPercent: header2xPercent,
                duration: 0,
            });

            const scaleX = progress < 0.45 ? 0 : progress > 0.65 ? 1 : ((progress - 0.45) / 0.2);
            gsap.to(".tooltip .divider", { 
                scaleX: scaleX, 
                transformOrigin: "left center",
                duration: 0,
            });

            tooltipSelector.forEach(({ trigger, elements }) => {
                gsap.to(elements, {
                    y: progress >= trigger ? "0%" : "125%",
                    ...animOptions,
                });
            });

            if (model && progress >= 0.05) {
                const rotationProgress = (progress - 0.05) / 0.95;
                const targetRotation = Math.PI * 3 * 4 * rotationProgress;
                const rotationDiff = targetRotation - currentRotation;
                if (Math.abs(rotationDiff) > 0.001) {
                    model.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationDiff);
                    currentRotation = targetRotation;
                }
            }
        }
    });
});