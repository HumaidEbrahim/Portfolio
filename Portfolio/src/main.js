import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';


const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()


const cssRenderer = new CSS3DRenderer()
cssRenderer.setSize(window.innerWidth, window.innerHeight)
cssRenderer.domElement.style.position = 'absolute'
cssRenderer.domElement.style.pointerEvents = 'none'

document.body.appendChild(cssRenderer.domElement)

const iframe = document.createElement('iframe')
iframe.src = 'https://humaidcv.vercel.app/'
iframe.style.width = '1920px'
iframe.style.height = '1080px'
iframe.style.border = 'none'

const cssObject = new CSS3DObject(iframe)
cssObject.position.set(0.69, 0.305, -0.1)
cssObject.scale.set(0.00028, 0.00027, 0.00027)
scene.add(cssObject)
iframe.style.visibility = 'hidden'
iframe.style.overflow = 'visible';
cssRenderer.domElement.style.overflow = 'visible';
// Lights
const rgbeLoader = new RGBELoader()
rgbeLoader.load('/static/envMap.hdr', (envMap) =>
{
  envMap.mapping = THREE.EquirectangularReflectionMapping

  scene.environment = envMap
  scene.environmentIntensity = 0.5

})
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 2)
dirLight.position.set(-2, 5, 2)
scene.add(dirLight)

const loadingBar = document.querySelector('.loading-bar')

const loadingManager = new THREE.LoadingManager(
  () =>
  {

    window.setTimeout(() =>
    {
      gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 })
      loadingBar.classList.add('ended')
      loadingBar.style.transform = ''
    }, 500)
  },

  (itemUrl, itemsLoaded, itemsTotal) =>
  {
    console.log(itemUrl, itemsLoaded, itemsTotal)
    const progress = itemsLoaded / itemsTotal
    loadingBar.style.transform = `scaleX(${progress})`
  },

  () =>
  {

  }
)

// Models
const gltfLoader = new GLTFLoader(loadingManager)

let cosmo = null

gltfLoader.load(
  '/static/models/room.glb',
  (gltf) =>
  {
    console.log("loaded")
    cosmo = gltf.scene
    cosmo.position.set(0, 0, 1)
    scene.add(cosmo)
    console.log("room", cosmo)
  },
  (progress) =>
  {
    console.log("loading")
  },
  (error) =>
  {
    console.log(error)
  }
)

let screen = null

gltfLoader.load(
  '/static/models/screen.glb',
  (gltf) =>
  {
    console.log("loaded")
    screen = gltf.scene.children[0]
    console.log(screen)
    screen.position.set(0.69, 0.3, -0.145)
    screen.po

    scene.add(screen)
    console.log("screen", screen)

  }
)

let leaves = null
gltfLoader.load(
  '/static/models/leaves.glb',
  (gltf) =>
  {
    console.log("loaded")
    leaves = gltf.scene


    leaves.traverse((child) =>
    {
      if (child.isMesh)
      {
        child.material.transparent = false
        //child.material.opacity = 1
        //child.material.depthWrite = false
        //child.material.depthTest = true
        child.renderOrder = 1
        child.material.alphaTest = 0.5
      }

    })

    leaves.position.set(0, 0, 1)
    scene.add(leaves)
    console.log("leaves", leaves)
  }
)

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// loader 

const overlayGeo = new THREE.PlaneGeometry(2, 2)

const overlayMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uAlpha: { value: 0.5 }
  },
  vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
  fragmentShader: `

        uniform float uAlpha;
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `
})


const overlay = new THREE.Mesh(overlayGeo, overlayMaterial)
scene.add(overlay)

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.001, 1000)
camera.position.set(1, 0.3, 10)

scene.add(camera)

// controls
const controls = new OrbitControls(camera, canvas)

const setControls = () =>
{
  controls.enableDamping = true
  controls.minDistance = 0.9
  controls.maxDistance = 3.5
  controls.target.set(0, 0, 0)
  controls.enabled = true
  controls.minAzimuthAngle = -Math.PI / 4
  controls.maxAzimuthAngle = Math.PI / 4
  controls.maxPolarAngle = Math.PI / 2
  controls.rotateSpeed = 0.5
}
controls.zoomToCursor = true
setControls()

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)

// Resize window
window.addEventListener('resize', () =>
{

  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  cssRenderer.setSize(sizes.width, sizes.height)
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

})

// function setResponsiveZoom() {
//   if (window.matchMedia("(max-width: 600px)").matches) {
//     controls.minDistance = 1.2;
//     controls.maxDistance = 4;
//     console.log('ok')
//   }
//   else if (window.matchMedia("(max-width: 1100px)").matches) {
//     controls.minDistance = 0.9;
//     controls.maxDistance = 3.5;
//   }
//   else {
//     controls.minDistance = 0.5;
//     controls.maxDistance = 0.6;
//   }
//   controls.update();
// }

// window.addEventListener('resize', setResponsiveZoom);
// setResponsiveZoom(); 


// Raycaster
const raycaster = new THREE.Raycaster()
//mouse

const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) =>
{
  mouse.x = event.clientX / sizes.width * 2 - 1
  mouse.y = - (event.clientY / sizes.height) * 2 + 1

})

let currentIntersect = null

var stats = new Stats()
stats.showPanel(0) // fps
document.body.appendChild(stats.dom)

const interactables = [screen]
let lookAtScreen = false

const tick = () =>
{

  stats.begin()

  controls.update()
  renderer.render(scene, camera)
  cssRenderer.render(scene, camera)

  // check intersection
  raycaster.setFromCamera(mouse, camera)

  if (screen)
  {
    const intersect = raycaster.intersectObject(screen)

    // mouse enter
    if (intersect.length)
    {

      if (!currentIntersect)
      {
        console.log('mouse enter')
      }

      currentIntersect = intersect[0]


    }
    else
    {

      if (currentIntersect)
      {
        console.log('mouse leave')
      }

      currentIntersect = null
    }
  }

  stats.end()
  window.requestAnimationFrame(tick)
}



window.addEventListener('click', () =>
{
  if (currentIntersect && currentIntersect.object.name === 'Cube011_1')
  {
    console.log('clicked screen')

    const objectPosition = new THREE.Vector3()
    currentIntersect.object.getWorldPosition(objectPosition)

    const offset = new THREE.Vector3(0, 0, 0.1)
    offset.applyQuaternion(currentIntersect.object.quaternion)

    const targetPosition = objectPosition.clone().add(offset)

    if (window.matchMedia("(max-width: 550px)").matches)
    {
      controls.minDistance = 1.3
    }
    else if (window.matchMedia("(max-width: 750px)").matches)
    {
      controls.minDistance = 1
    }
    else if (window.matchMedia("(max-width: 1100px)").matches)
    {
      controls.minDistance = 0.8
    }
    else
    {
      controls.minDistance = 0.5
      console.log('big')
    }


    gsap.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 1,
      //onUpdate: () => controls.update(),
      onComplete: () =>
      {
        controls.enabled = false

      }
    });

    controls.target.copy(objectPosition);
    controls.update();
    lookAtScreen = true;
    iframe.style.visibility = ''
  }

  else if (!currentIntersect && lookAtScreen)
  {
    // reset controls
    lookAtScreen = false
    iframe.style.visibility = 'hidden'
    setControls()
  }
})


tick()