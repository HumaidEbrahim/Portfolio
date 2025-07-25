import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { cos } from 'three/src/nodes/TSL.js'


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
cssObject.position.set(0.687, 0.306, -0.21)
cssObject.scale.set(0.000305, 0.0003, 0.000305)
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

// const dirLight = new THREE.DirectionalLight(0xffffff, 2)
// dirLight.position.set(-2, 5, 0)
// scene.add(dirLight)

const lamp = new THREE.PointLight(0xF7C57C,1,1)
lamp.position.set(0.69, 0.3, -0.3)

scene.add(lamp)

const leds = new THREE.RectAreaLight(0xff8400,20,3,0.2)
leds.position.set(0.69, 1.2, -0.16)

scene.add(leds)
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

let room = null
let screen = null
let alphas = null
let chair = null
let interactables = null
gltfLoader.load(
  '/static/models/room.glb',
  (gltf) =>
  {
    console.log("loaded")
    room = gltf.scene
    screen = gltf.scene.getObjectByName('Screen')
    alphas = gltf.scene.getObjectByName('Alphas')
    chair = gltf.scene.getObjectByName('Chair')
    chair = chair.children[2]
    interactables = [screen,chair]
    alphas.traverse((child) =>
    {
      if (child.isMesh)
      {
        child.material.transparent = false
        child.renderOrder = 1
        child.material.alphaTest = 0.5
      }
    })

    console.log(chair)
    room.position.set(0, 0, 1)
    scene.add(room)
    console.log("room", room)
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

// var stats = new Stats()
// stats.showPanel(0) // fps
// document.body.appendChild(stats.dom)


let lookAtScreen = false

const tick = () =>
{

  // stats.begin()

  controls.update()
  renderer.render(scene, camera)
  cssRenderer.render(scene, camera)

  // check intersection
  raycaster.setFromCamera(mouse, camera)

  if (screen)
  {
    const intersect = raycaster.intersectObjects(interactables)

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

  // stats.end()
  window.requestAnimationFrame(tick)
}


// click on interactable object
window.addEventListener('click', () =>
{
  if (currentIntersect && currentIntersect.object.name === 'Screen')
  {
    console.log('clicked screen')

    const objectPosition = new THREE.Vector3()
    currentIntersect.object.getWorldPosition(objectPosition)

    const offset = new THREE.Vector3(0, 0, 0.1)
    offset.applyQuaternion(currentIntersect.object.quaternion)

    const targetPosition = objectPosition.clone().add(offset)

    if (window.matchMedia("(max-width: 550px)").matches)
    {
      controls.minDistance = 0.7
    }
    else{
      
    controls.minDistance = 0.5
    }
    gsap.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 1,
      onUpdate: () => controls.update(),
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
    controls.enabled = true
    controls.update
  }


})


tick()