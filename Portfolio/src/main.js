import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' 
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';


const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Geo 
// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
// const mesh = new THREE.Mesh(geometry, material)

// scene.add(mesh)

const cssRenderer = new CSS3DRenderer()
cssRenderer.setSize(window.innerWidth,window.innerHeight)
cssRenderer.domElement.style.position = 'absolute'
cssRenderer.domElement.style.pointerEvents = 'none'


document.body.appendChild(cssRenderer.domElement)
const wrapper = document.createElement('div')
wrapper.style.width = '1920px'
wrapper.style.height = '1080px'
wrapper.style.overflow = 'hidden'
wrapper.style.position = 'relative'
wrapper.style.zIndex = '9999'

const iframe = document.createElement('iframe')
iframe.src = 'https://humaidportfolio.vercel.app/'
iframe.style.width = '100%'
iframe.style.height = '100%'
iframe.style.border = 'none'
iframe.style.pointerEvents = 'auto'
iframe.style.transform = 'translateZ(0)'
iframe.style.willChange = 'transform'
iframe.style.backfaceVisibility = 'hidden'

wrapper.appendChild(iframe)

const cssObject = new CSS3DObject(wrapper)
cssObject.position.set(0.4,0.3,0.1)
cssObject.scale.set(0.0003, 0.0003, 0.0003)
scene.add(cssObject)

// Lights
const rgbeLoader = new RGBELoader()
rgbeLoader.load('/static/en_suite_1k.hdr', (envMap) => {
  envMap.mapping = THREE.EquirectangularReflectionMapping
  
  scene.environment = envMap
  scene.environmentIntensity = 0.5
  
})
const ambientLight = new THREE.AmbientLight(0xffffff,2)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 2)
dirLight.position.set(-2, 5, 2)
scene.add(dirLight)

const loadingBar = document.querySelector('.loading-bar')

const loadingManager = new THREE.LoadingManager(
  () => {

    window.setTimeout(() => {
      gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 })
      loadingBar.classList.add('ended')
      loadingBar.style.transform = ''
    }, 500)
  },

  (itemUrl, itemsLoaded, itemsTotal) => {
    console.log(itemUrl,itemsLoaded, itemsTotal)
    const progress = itemsLoaded / itemsTotal
    loadingBar.style.transform = `scaleX(${progress})`
  },

  () => {
    
  }
)

// Models
const gltfLoader = new GLTFLoader(loadingManager)

let cosmo = null

gltfLoader.load(
  '/static/models/room.glb',
  (gltf) => {
    console.log("loaded")
    cosmo = gltf.scene
    cosmo.position.set(0,0,1)
    scene.add(cosmo)
    console.log("room",cosmo)
  },
  (progress) => {
    console.log("loading")
  },
  (error) => {
    console.log(error)
  }
)

let screen = null

gltfLoader.load(
  '/static/models/screen.glb',
  (gltf) => {
    console.log("loaded")
    screen = gltf.scene
    screen.position.set(0.6,0,0.2)
    //screen.position.set(0,0,0)
    // cssObject.scale.set(0.00031, 0.00031, 0.00031) // Scale down appropriately
    // cssObject.position.set(0.4,0.3,-0.9)
    // screen.add(cssObject)
    
    scene.add(screen)
    console.log("screen",screen)
    
  }
)

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// loader 

const overlayGeo = new THREE.PlaneGeometry(2,2)

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
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height)
camera.position.set(1,0.3,10)

scene.add(camera)

// controls
const controls = new OrbitControls(camera,canvas)
controls.enableDamping = true
controls.minDistance = 0.9
controls.maxDistance = 3.5
controls.minAzimuthAngle = -Math.PI / 4
controls.maxAzimuthAngle = Math.PI / 4
controls.maxPolarAngle = Math.PI / 2
controls.rotateSpeed = 0.5

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)

// Resize window
window.addEventListener('resize', () => {

    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    cssRenderer.setSize(sizes.width, sizes.height)
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

})

// Fullscreen

window.addEventListener('dblclick', () => {
  if(!document.fullscreenElement) {
    canvas.requestFullscreen()
  }
  else {
    document.exitFullscreen()
  }

})

// Raycaster
const raycaster = new THREE.Raycaster()
// const rayOrigin = new THREE.Vector3(-3,0,0)
// const rayDirection = new THREE.Vector3(10,0,0)
// rayDirection.normalize()

//mouse

const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX / sizes.width * 2 -1
  mouse.y = - (event.clientY / sizes.height) * 2 + 1

})

let currentIntersect = null

var stats = new Stats()
stats.showPanel(0) // fps
document.body.appendChild(stats.dom)



const tick = () => {
  
  stats.begin()

  controls.update()
  renderer.render(scene, camera)

  
    cssRenderer.render(scene, camera) 
  
  // check intersection
  raycaster.setFromCamera(mouse,camera)

  if(screen) {
     const intersect = raycaster.intersectObject(screen)

      // mouse enter
    if(intersect.length) {
      
      if(!currentIntersect) {
        console.log('mouse enter')
      }

      currentIntersect = intersect[0]
     
    }
    else {

      if(currentIntersect) {
        console.log('mouse leave')
      }

      currentIntersect = null
    }
  }
 
  stats.end()
  window.requestAnimationFrame(tick)
}

let lookAt = false
window.addEventListener('click', () => {
  if(currentIntersect) {

    iframe.style.pointerEvents = 'auto'

    console.log('clicked')
    console.log(currentIntersect)
    lookAt = true
    controls.saveState()
   
    // const targetPos = currentIntersect.object.position
    // const offset = new THREE.Vector3(0,0.3,1)
    // const worldDir = offset.applyQuaternion(currentIntersect.object.quaternion)
    // const cameraPos = targetPos.clone().add(worldDir);
    camera.position.set(0,0.4,1)
    //camera.quaternion.set(2.4,-0.01,-4.34)
    //camera.lookAt(targetPos)
    //controls.target.copy(targetPos)

    controls.minDistance = 0.8
    controls.maxDistance = 1
    // controls.enabled = false
    
     controls.update()
    

    //camera.rotation.set(90,45,0)
   
  }
  else if(lookAt === true && !currentIntersect){
    lookAt = false
    controls.minDistance = 0
    controls.maxDistance = 2
    controls.target.set(0,0,0)
    cssRenderer.domElement.style.pointerEvents = 'none'
    //iframe.style.pointerEvents = 'none'
    controls.enabled = true
  
  }
})


tick()