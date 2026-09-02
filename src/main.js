import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

let scene, camera, renderer, controls;
let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
const sensitivity = 0.002;
const lookAtPoint = new THREE.Vector3(0, 5, 0);

let lightProgress = 0;
let modelProgress = 0;
let qnapProgress = 0;
let isLightLoaded = false;
let isModelLoaded = false;
let isQnapLoaded = false;

let rendererContainer;

const progressBar = document.getElementById('progressBar');

function init() {
    rendererContainer = document.createElement('div');
    rendererContainer.id = 'renderer-container';
    rendererContainer.style.display = 'none';
    document.body.appendChild(rendererContainer);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2D2E32);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(40, 80, 30);
    sunLight.target.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    scene.add(sunLight.target);

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
    rendererContainer.appendChild(renderer.domElement);

    new RGBELoader().load(
        'assets/light.hdr',
        function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            texture.encoding = THREE.sRGBEncoding;
            isLightLoaded = true;
            checkLoadingComplete();
        },
        function (xhr) {
            lightProgress = (xhr.loaded / xhr.total * 100);
            updateTotalProgress();
        },
        function (error) {
            console.error('Erreur de chargement de la lumière', error);
        }
    );

    const loader = new GLTFLoader();
    loader.load(
        '/assets/room.glb',
        function (gltf) {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(gltf.scene);
            isModelLoaded = true;
            checkLoadingComplete();
        },
        function (xhr) {
            modelProgress = (xhr.loaded / xhr.total * 100);
            updateTotalProgress();
        },
        function (error) {
            console.error('Erreur de chargement du modèle', error);
        }
    );

    loader.load(
        '/assets/qnap.glb',
        function (gltf) {
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const targetHeight = 1.5;
            const scale = targetHeight / size.y;
            gltf.scene.scale.setScalar(scale);

            const boxScaled = new THREE.Box3().setFromObject(gltf.scene);
            const centerScaled = boxScaled.getCenter(new THREE.Vector3());
            const offsetX = -14;
            const offsetZ = -5;
            gltf.scene.position.set(
                -centerScaled.x + offsetX,
                -boxScaled.min.y,
                -centerScaled.z + offsetZ
            );
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(gltf.scene);
            isQnapLoaded = true;
            checkLoadingComplete();
        },
        function (xhr) {
            qnapProgress = (xhr.loaded / xhr.total * 100);
            updateTotalProgress();
        },
        function (error) {
            console.error('Erreur de chargement du QNAP', error);
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
}

function updateTotalProgress() {
    const totalProgress = (lightProgress + modelProgress + qnapProgress) / 3;
    progressBar.style.width = `${totalProgress}%`;
}

function checkLoadingComplete() {
    if (isLightLoaded && isModelLoaded && isQnapLoaded) {
        progressBar.style.width = '100%';
        animate();
        document.querySelector('.loading-container').style.display = 'none';
        rendererContainer.style.display = 'block';
    }
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
