import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Bear({ reactionTick }) {
  const group = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()
  const target = useRef(new THREE.Vector3(1, 0, 1))
  const waitUntil = useRef(0)
  const phase = useRef(0)
  const happyUntil = useRef(0)

  const chooseTarget = () => {
    target.current.set(
      THREE.MathUtils.randFloat(-3.6, 3.6),
      0,
      THREE.MathUtils.randFloat(-2.7, 2.7),
    )
  }

  useEffect(() => {
    if (reactionTick > 0) happyUntil.current = performance.now() + 1700
  }, [reactionTick])

  useFrame((state, delta) => {
    if (!group.current) return
    const p = group.current.position
    const now = performance.now()

    if (now < happyUntil.current) {
      p.y = 0.04 + Math.abs(Math.sin(state.clock.elapsedTime * 7)) * 0.28
      group.current.rotation.y += delta * 2.6
      return
    }

    p.y = THREE.MathUtils.lerp(p.y, 0.04, Math.min(1, delta * 8))
    if (state.clock.elapsedTime < waitUntil.current) return

    const direction = target.current.clone().sub(p)
    direction.y = 0
    const distance = direction.length()
    if (distance < 0.18) {
      chooseTarget()
      waitUntil.current = state.clock.elapsedTime + THREE.MathUtils.randFloat(0.8, 2.6)
      return
    }

    direction.normalize()
    p.addScaledVector(direction, Math.min(0.62 * delta, distance))
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      Math.atan2(direction.x, direction.z),
      7,
      delta,
    )

    phase.current += delta * 8
    const swing = Math.sin(phase.current) * 0.38
    if (leftLeg.current) leftLeg.current.rotation.x = swing
    if (rightLeg.current) rightLeg.current.rotation.x = -swing
  })

  return (
    <group ref={group} position={[0, 0.04, 0]}>
      <mesh castShadow position={[0, 1.02, 0]} scale={[0.78, 0.98, 0.62]}>
        <sphereGeometry args={[0.72, 28, 20]} />
        <meshStandardMaterial color="#f8f7f2" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.78, 0.06]}>
        <sphereGeometry args={[0.58, 28, 20]} />
        <meshStandardMaterial color="#fbfaf6" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.4, 2.15, 0.02]}>
        <sphereGeometry args={[0.2, 18, 14]} />
        <meshStandardMaterial color="#f6f4ed" />
      </mesh>
      <mesh castShadow position={[0.4, 2.15, 0.02]}>
        <sphereGeometry args={[0.2, 18, 14]} />
        <meshStandardMaterial color="#f6f4ed" />
      </mesh>
      <mesh castShadow position={[0, 1.62, 0.5]} scale={[0.58, 0.38, 0.35]}>
        <sphereGeometry args={[0.46, 20, 14]} />
        <meshStandardMaterial color="#eeeae0" />
      </mesh>
      <mesh castShadow position={[0, 1.7, 0.68]} scale={[1.2, 0.72, 0.55]}>
        <sphereGeometry args={[0.12, 16, 10]} />
        <meshStandardMaterial color="#171717" />
      </mesh>

      <mesh position={[-0.23, 1.9, 0.52]}>
        <boxGeometry args={[0.38, 0.22, 0.08]} />
        <meshStandardMaterial color="#111111" metalness={0.15} />
      </mesh>
      <mesh position={[0.23, 1.9, 0.52]}>
        <boxGeometry args={[0.38, 0.22, 0.08]} />
        <meshStandardMaterial color="#111111" metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.9, 0.53]}>
        <boxGeometry args={[0.12, 0.045, 0.045]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh>

      <mesh castShadow position={[-0.63, 1.0, 0]} scale={[0.27, 0.62, 0.28]}>
        <sphereGeometry args={[0.52, 18, 14]} />
        <meshStandardMaterial color="#f7f6f0" />
      </mesh>
      <mesh castShadow position={[0.63, 1.0, 0]} scale={[0.27, 0.62, 0.28]}>
        <sphereGeometry args={[0.52, 18, 14]} />
        <meshStandardMaterial color="#f7f6f0" />
      </mesh>

      <group ref={leftLeg} position={[-0.3, 0.45, 0]}>
        <mesh castShadow scale={[0.35, 0.65, 0.42]}>
          <sphereGeometry args={[0.52, 18, 14]} />
          <meshStandardMaterial color="#f4f3ed" />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.3, 0.45, 0]}>
        <mesh castShadow scale={[0.35, 0.65, 0.42]}>
          <sphereGeometry args={[0.52, 18, 14]} />
          <meshStandardMaterial color="#f4f3ed" />
        </mesh>
      </group>
    </group>
  )
}

function Room() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.08, 0]}>
        <boxGeometry args={[10, 0.16, 8]} />
        <meshStandardMaterial color="#d8cab4" roughness={0.96} />
      </mesh>
      <mesh receiveShadow position={[0, 1.8, -4]}>
        <boxGeometry args={[10, 3.6, 0.16]} />
        <meshStandardMaterial color="#ede9df" />
      </mesh>
      <mesh receiveShadow position={[-5, 1.8, 0]}>
        <boxGeometry args={[0.16, 3.6, 8]} />
        <meshStandardMaterial color="#e8e3d8" />
      </mesh>
      <mesh receiveShadow position={[5, 1.8, 0]}>
        <boxGeometry args={[0.16, 3.6, 8]} />
        <meshStandardMaterial color="#e8e3d8" />
      </mesh>
    </group>
  )
}

function Marker({ status }) {
  if (status === 'dead') {
    return (
      <group>
        <mesh castShadow position={[0, 0.12, 0]}>
          <boxGeometry args={[1.35, 0.24, 0.7]} />
          <meshStandardMaterial color="#777773" />
        </mesh>
        <mesh castShadow position={[0, 0.85, 0]}>
          <boxGeometry args={[0.9, 1.35, 0.28]} />
          <meshStandardMaterial color="#8d8d88" />
        </mesh>
      </group>
    )
  }
  if (status === 'away') {
    return (
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, -0.2]}>
        <planeGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#fffaf0" side={THREE.DoubleSide} />
      </mesh>
    )
  }
  return null
}

export default function TerakumaScene({ status, reactionTick }) {
  return (
    <div className="scene-wrap">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [6.4, 4.8, 7.4], fov: 43 }}>
        <color attach="background" args={['#cfd7d8']} />
        <ambientLight intensity={1.25} />
        <directionalLight castShadow intensity={2.1} position={[4, 7, 5]} />
        <Room />
        {status === 'active' ? <Bear reactionTick={reactionTick} /> : <Marker status={status} />}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.28} scale={9} blur={2.2} far={4} />
        <OrbitControls
          enabled={status === 'active'}
          target={[0, 1.1, 0]}
          minDistance={5.2}
          maxDistance={10.5}
          minPolarAngle={0.55}
          maxPolarAngle={1.35}
          enablePan={false}
        />
      </Canvas>
    </div>
  )
}
