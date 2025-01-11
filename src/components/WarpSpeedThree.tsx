import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface WarpSpeedThreeProps {
  isVisible: boolean;
}

export function WarpSpeedThree({ isVisible }: WarpSpeedThreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const starsRef = useRef<any[]>([])
  const asteroidsRef = useRef<any[]>([])
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const cameraZRef = useRef(0)
  const lightSpeedRef = useRef(1)
  const speedStopRef = useRef(false)
  const asteroidSpawnRef = useRef(100)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!containerRef.current || !isVisible) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#000000', 750, 1000)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY }
    }

    const handleClick = () => {
      lightSpeedRef.current = 2
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)

    const randint = (min: number, max: number) => Math.floor(Math.random() * max) + min

    const newStar = () => {
      const geometry = new THREE.SphereGeometry(1, 8, 8)
      const material = new THREE.MeshBasicMaterial({ color: 'white' })
      const sphere = new THREE.Mesh(geometry, material)
      scene.add(sphere)

      const w = window.innerWidth
      const h = window.innerHeight
      const w2 = w / 2
      const h2 = h / 2

      sphere.position.x = randint(-w2, w)
      sphere.position.y = randint(-h2, h)
      sphere.position.z = cameraZRef.current - 1000

      return { geometry, material, sphere }
    }

    const newAsteroid = () => {
      const geometry = new THREE.SphereGeometry(1, randint(3, 5), randint(2, 5))
      const material = new THREE.MeshBasicMaterial({ color: 'gray' })
      const shape = new THREE.Mesh(geometry, material)
      scene.add(shape)

      const w = window.innerWidth
      const h = window.innerHeight
      const w2 = w / 2
      const h2 = h / 2

      shape.position.x = randint(-w2 / 100, w / 100)
      shape.position.y = randint(-h2 / 100, h / 100)
      shape.position.z = cameraZRef.current - 1000
      shape.scale.x = randint(1, 3)
      shape.scale.y = randint(1, 3)
      shape.scale.z = randint(1, 3)

      return { geometry, material, shape }
    }

    const mainloop = () => {
      if (starsRef.current.length < 1000) {
        starsRef.current.push(newStar())
      }

      if (asteroidsRef.current.length < 10) {
        asteroidSpawnRef.current -= 1
        if (asteroidSpawnRef.current === 0) {
          asteroidsRef.current.push(newAsteroid())
          asteroidSpawnRef.current = 100
        }
      }

      starsRef.current = starsRef.current.filter((star, i) => {
        if (star.sphere.position.z > cameraZRef.current) {
          scene.remove(star.sphere)
          return false
        }
        star.sphere.scale.z = lightSpeedRef.current
        return true
      })

      asteroidsRef.current = asteroidsRef.current.filter((asteroid, i) => {
        if (asteroid.shape.position.z > cameraZRef.current) {
          scene.remove(asteroid.shape)
          return false
        }
        asteroid.shape.rotation.x += 0.01
        asteroid.shape.rotation.y += 0.01
        return true
      })

      if (!speedStopRef.current) {
        if (lightSpeedRef.current > 1) {
          lightSpeedRef.current += 2
        }
        if (lightSpeedRef.current > 300) {
          speedStopRef.current = true
        }
      } else {
        lightSpeedRef.current -= 5
        if (lightSpeedRef.current < 2) {
          speedStopRef.current = false
          lightSpeedRef.current = 1
        }
      }

      if (lightSpeedRef.current > 150) {
        cameraZRef.current -= lightSpeedRef.current / 2
      } else {
        cameraZRef.current -= 1
      }

      const lookX = -(mouseRef.current.x - window.innerWidth / 2) / 50
      const lookY = (mouseRef.current.y - window.innerHeight / 2) / 50
      const lookAt = new THREE.Vector3(lookX, lookY, cameraZRef.current - 10)

      camera.position.z = cameraZRef.current
      camera.lookAt(lookAt)

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(mainloop)
    }

    mainloop()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      starsRef.current.forEach(star => scene.remove(star.sphere))
      asteroidsRef.current.forEach(asteroid => scene.remove(asteroid.shape))
      starsRef.current = []
      asteroidsRef.current = []
    }
  }, [isVisible])

  return <div ref={containerRef} className={`fixed inset-0 ${isVisible ? '' : 'hidden'}`} />
}