import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let scene, camera, renderer, controls;
let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
const sensitivity = 0.002;
const lookAtPoint = new THREE.Vector3(0, 5, 0);

function init() {
    scene = new THREE.Scene();
    
    scene.background = new THREE.Color(0x2D2E32);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 22);
    camera.lookAt(lookAtPoint);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    new RGBELoader().load(
        'assets/light.hdr',
        function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;

            texture.encoding = THREE.sRGBEncoding; 

        },
        function (xhr) {
            console.log(`Chargement de EXR : ${(xhr.loaded / xhr.total * 100)}%`);
        },
        function (error) {
            console.error('Erreur de chargement de EXR', error);
            alert("Le fichier EXR n'a pas pu être chargé.");
        }
    );

    const loader = new GLTFLoader();
    loader.load(
        '/assets/memphis.glb',
        function (gltf) {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(gltf.scene);
        },
        function (xhr) {
            console.log(`Chargement : ${(xhr.loaded / xhr.total * 100)}%`);
        },
        function (error) {
            console.error('Erreur de chargement du modèle', error);
        }
    );

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.target.copy(lookAtPoint);

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);

    animate();
}

function onMouseMove(event) {
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    targetX = (event.clientX - halfWidth) * sensitivity;
    targetY = (event.clientY - halfHeight) * sensitivity;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;
    camera.position.x = mouseX * 5;
    camera.position.y = 25 + mouseY * 2;
    camera.lookAt(lookAtPoint);
    controls.update();
    renderer.render(scene, camera);
}

init();
