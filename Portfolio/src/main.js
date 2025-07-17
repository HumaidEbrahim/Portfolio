import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' 

import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';


const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Geo 
// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
// const mesh = new THREE.Mesh(geometry, material)

// scene.add(mesh)

// const cssRenderer = new CSS3DRenderer()
// cssRenderer.setSize(window.innerWidth, window.innerHeight)
// cssRenderer.domElement.style.position = 'absolute'
// cssRenderer.domElement.style.top = '0'
// document.body.appendChild(cssRenderer.domElement)
// // Create iframe
// const iframe = document.createElement('iframe')
// iframe.src = 'https://www.youtube.com/embed/d-WlaSwe-Kg' 
// iframe.title = 'YouTube video player'
// iframe.style.width = '1024px'
// iframe.style.height = '768px'
// iframe.style.border = 'none'
// iframe.referrerPolicy=''


// iframe.style.pointerEvents = 'none';

// iframe.addEventListener('mouseenter', () => {
//   iframe.style.pointerEvents = 'auto';
// })
// iframe.addEventListener('mouseleave', () => {
//   iframe.style.pointerEvents = 'none';
// })

// // Convert iframe to 3D object
// const cssObject = new CSS3DObject(iframe)
// cssObject.position.set(0, 0, 0)     // Place it in your scene
// cssObject.scale.set(0.0001, 0.0001, 0.0001) // Scale down appropriately
// scene.add(cssObject)


// Lights
const ambientLight = new THREE.AmbientLight(0xffffff,5)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 10)
dirLight.position.set(3, 5, 2)
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
  '/static/models/untitled.glb',
  (gltf) => {
    console.log("loaded")
    cosmo = gltf.scene
    scene.add(cosmo)
  },
  (progress) => {
    console.log("loading")
  },
  (error) => {
    console.log(error)
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 1

scene.add(camera)

// controls
const controls = new OrbitControls(camera,canvas)
controls.enableDamping = true
controls.minDistance = 0
controls.maxDistance = 2
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
  // cssRenderer.render(scene, camera) 
  // check intersection
  raycaster.setFromCamera(mouse,camera)

  if(cosmo) {
     const intersect = raycaster.intersectObject(cosmo)

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

window.addEventListener('click', () => {
  if(currentIntersect) {
    console.log('clicked')
  }
})



tick()