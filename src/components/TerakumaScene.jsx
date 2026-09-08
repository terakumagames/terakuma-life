import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { FurnitureObject, FURNITURE_RADII } from './FurnitureObjects.jsx'

const clampRoomX = (value) => THREE.MathUtils.clamp(value, -3.5, 3.5)
const clampRoomZ = (value) => THREE.MathUtils.clamp(value, -2.6, 2.6)
const smooth = (value) => value * value * (3 - 2 * value)

function isBlocked(position, placements) {
  return placements.some((item) => {
    const radius = FURNITURE_RADII[item.itemId] ?? 0.75
    const dx = position.x - item.x
    const dz = position.z - item.z
    return Math.hypot(dx, dz) < radius + 0.48
  })
}

function Sunglasses() {
  return (
    <group position={[0, 1.93, 0.545]}>
      <mesh position={[-0.235, -0.01, 0]} rotation={[0, 0.04, 0.02]}>
        <boxGeometry args={[0.43, 0.235, 0.075]} />
        <meshStandardMaterial color="#111513" roughness={0.28} metalness={0.22} />
      </mesh>
      <mesh position={[0.235, -0.01, 0]} rotation={[0, -0.04, -0.02]}>
        <boxGeometry args={[0.43, 0.235, 0.075]} />
        <meshStandardMaterial color="#111513" roughness={0.28} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.015, 0.01]}>
        <boxGeometry args={[0.13, 0.052, 0.058]} />
        <meshStandardMaterial color="#101412" roughness={0.3} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.135, 0.012]}>
        <boxGeometry args={[0.94, 0.052, 0.062]} />
        <meshStandardMaterial color="#557a68" roughness={0.46} metalness={0.08} />
      </mesh>
      <mesh position={[-0.49, 0.015, -0.01]} rotation={[0, 0, -0.06]}>
        <boxGeometry args={[0.07, 0.24, 0.055]} />
        <meshStandardMaterial color="#161a18" />
      </mesh>
      <mesh position={[0.49, 0.015, -0.01]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[0.07, 0.24, 0.055]} />
        <meshStandardMaterial color="#161a18" />
      </mesh>
    </group>
  )
}

function FoodTreat({ foodRef }) {
  return (
    <group ref={foodRef} visible={false}>
      <mesh castShadow scale={[0.46, 0.2, 0.19]}>
        <sphereGeometry args={[0.55, 18, 12]} />
        <meshStandardMaterial color="#ef8f79" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[-0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.22, 0.35, 3]} />
        <meshStandardMaterial color="#d86f64" roughness={0.8} />
      </mesh>
      <mesh position={[0.31, 0.07, 0.1]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshStandardMaterial color="#202423" />
      </mesh>
    </group>
  )
}

function PlayBall({ ballRef }) {
  return (
    <mesh ref={ballRef} castShadow visible={false}>
      <sphereGeometry args={[0.23, 20, 16]} />
      <meshStandardMaterial color="#4d81a7" roughness={0.55} />
    </mesh>
  )
}

function PettingHand({ handRef }) {
  return (
    <group ref={handRef} visible={false} rotation={[0.28, 0, 0]}>
      <mesh castShadow scale={[0.42, 0.3, 0.17]}>
        <sphereGeometry args={[0.7, 20, 14]} />
        <meshStandardMaterial color="#e7c5a1" roughness={0.78} />
      </mesh>
      {[-0.28, -0.1, 0.08, 0.26].map((x, index) => (
        <mesh key={x} castShadow position={[x, 0.28 + index * 0.012, 0]} scale={[0.11, 0.34, 0.11]}>
          <sphereGeometry args={[0.62, 14, 10]} />
          <meshStandardMaterial color="#e7c5a1" roughness={0.78} />
        </mesh>
      ))}
      <mesh castShadow position={[-0.43, 0.02, 0]} rotation={[0, 0, -0.7]} scale={[0.13, 0.3, 0.12]}>
        <sphereGeometry args={[0.62, 14, 10]} />
        <meshStandardMaterial color="#e7c5a1" roughness={0.78} />
      </mesh>
    </group>
  )
}

function Bear({ reactionTick, reactionAction, furniture = [], layoutMode = false }) {
  const group = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()
  const foodRef = useRef()
  const ballRef = useRef()
  const handRef = useRef()
  const target = useRef(new THREE.Vector3(1, 0, 1))
  const waitUntil = useRef(0)
  const phase = useRef(0)
  const playCount = useRef(0)
  const action = useRef({
    type: 'none',
    variant: null,
    start: 0,
    end: 0,
    origin: new THREE.Vector3(),
    ballStart: new THREE.Vector3(),
    ballEnd: new THREE.Vector3(),
  })

  const chooseTarget = () => {
    for (let i = 0; i < 14; i += 1) {
      const candidate = new THREE.Vector3(
        THREE.MathUtils.randFloat(-3.6, 3.6),
        0,
        THREE.MathUtils.randFloat(-2.7, 2.7),
      )
      if (!isBlocked(candidate, furniture)) {
        target.current.copy(candidate)
        return
      }
    }
    target.current.set(0, 0, 0)
  }

  useEffect(() => {
    if (reactionTick <= 0 || !group.current) return

    const now = performance.now()
    const type = reactionAction || 'happy'
    const origin = group.current.position.clone()
    origin.y = 0.04

    let variant = null
    let duration = 1800

    if (type === 'hunger') duration = 3400
    if (type === 'play') {
      playCount.current += 1
      variant = playCount.current % 2 === 1 ? 'ball' : 'pet'
      duration = variant === 'ball' ? 4300 : 3200
    }

    const ballStart = new THREE.Vector3(
      clampRoomX(origin.x - 2.5),
      2.45,
      clampRoomZ(origin.z + 2.2),
    )
    const ballEnd = new THREE.Vector3(
      clampRoomX(origin.x + (origin.x > 0.8 ? -2.5 : 2.5)),
      0.23,
      clampRoomZ(origin.z - 0.9),
    )

    action.current = {
      type,
      variant,
      start: now,
      end: now + duration,
      origin,
      ballStart,
      ballEnd,
    }

    group.current.rotation.y = 0
  }, [reactionTick, reactionAction])

  useEffect(() => {
    chooseTarget()
  }, [furniture.length])

  useFrame((state, delta) => {
    if (!group.current) return

    const bear = group.current
    const p = bear.position
    const now = performance.now()
    const current = action.current
    const activeAction = now < current.end

    if (foodRef.current) foodRef.current.visible = false
    if (ballRef.current) ballRef.current.visible = false
    if (handRef.current) handRef.current.visible = false

    if (activeAction) {
      const total = Math.max(1, current.end - current.start)
      const t = THREE.MathUtils.clamp((now - current.start) / total, 0, 1)

      if (leftLeg.current && rightLeg.current) {
        leftLeg.current.rotation.x = THREE.MathUtils.damp(leftLeg.current.rotation.x, 0, 8, delta)
        rightLeg.current.rotation.x = THREE.MathUtils.damp(rightLeg.current.rotation.x, 0, 8, delta)
      }

      if (current.type === 'hunger') {
        bear.rotation.y = THREE.MathUtils.damp(bear.rotation.y, 0, 8, delta)
        bear.rotation.z = THREE.MathUtils.damp(bear.rotation.z, 0, 8, delta)
        p.x = THREE.MathUtils.damp(p.x, current.origin.x, 7, delta)
        p.z = THREE.MathUtils.damp(p.z, current.origin.z, 7, delta)

        if (foodRef.current) {
          foodRef.current.visible = t < 0.72
          if (t < 0.34) {
            const u = smooth(t / 0.34)
            foodRef.current.position.set(
              current.origin.x,
              THREE.MathUtils.lerp(4.6, 2.35, u),
              current.origin.z + 0.58,
            )
            foodRef.current.rotation.z += delta * 4
            foodRef.current.scale.setScalar(1)
          } else if (t < 0.62) {
            const u = smooth((t - 0.34) / 0.28)
            foodRef.current.position.set(
              current.origin.x,
              THREE.MathUtils.lerp(2.35, 1.67, u),
              THREE.MathUtils.lerp(current.origin.z + 0.58, current.origin.z + 0.72, u),
            )
            foodRef.current.scale.setScalar(1 - u * 0.25)
          } else {
            const u = smooth((t - 0.62) / 0.1)
            foodRef.current.position.set(current.origin.x, 1.67, current.origin.z + 0.72)
            foodRef.current.scale.setScalar(Math.max(0.05, 0.75 * (1 - u)))
          }
        }

        const catchAmount = t > 0.23 && t < 0.67
          ? Math.sin(((t - 0.23) / 0.44) * Math.PI)
          : 0
        if (leftArm.current) {
          leftArm.current.rotation.z = -catchAmount * 1.05
          leftArm.current.rotation.x = -catchAmount * 0.45
        }
        if (rightArm.current) {
          rightArm.current.rotation.z = catchAmount * 1.05
          rightArm.current.rotation.x = -catchAmount * 0.45
        }

        if (t > 0.6 && t < 0.82) {
          p.y = 0.04 + Math.abs(Math.sin(state.clock.elapsedTime * 15)) * 0.055
        } else if (t >= 0.82) {
          const celebrate = (t - 0.82) / 0.18
          p.y = 0.04 + Math.sin(celebrate * Math.PI) * 0.3
          bear.rotation.y += delta * 2.3
        } else {
          p.y = THREE.MathUtils.damp(p.y, 0.04, 8, delta)
        }
        return
      }

      if (current.type === 'play' && current.variant === 'pet') {
        p.x = THREE.MathUtils.damp(p.x, current.origin.x, 7, delta)
        p.z = THREE.MathUtils.damp(p.z, current.origin.z, 7, delta)
        bear.rotation.y = THREE.MathUtils.damp(bear.rotation.y, 0, 7, delta)

        if (handRef.current) {
          handRef.current.visible = t < 0.83
          const descend = smooth(Math.min(1, t / 0.22))
          const leave = t > 0.72 ? smooth((t - 0.72) / 0.11) : 0
          handRef.current.position.set(
            current.origin.x + Math.sin(state.clock.elapsedTime * 5.5) * 0.18 * descend,
            THREE.MathUtils.lerp(3.8, 2.42, descend) + leave * 1.4,
            current.origin.z + 0.15,
          )
          handRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 5.5) * 0.12
        }

        if (t > 0.18 && t < 0.75) {
          bear.rotation.z = Math.sin(state.clock.elapsedTime * 6.5) * 0.055
          p.y = 0.04 - Math.abs(Math.sin(state.clock.elapsedTime * 7)) * 0.018
          if (leftArm.current) leftArm.current.rotation.z = -0.28
          if (rightArm.current) rightArm.current.rotation.z = 0.28
        } else if (t >= 0.82) {
          const celebrate = (t - 0.82) / 0.18
          bear.rotation.z = 0
          p.y = 0.04 + Math.sin(celebrate * Math.PI) * 0.26
        }
        return
      }

      if (current.type === 'play' && current.variant === 'ball') {
        if (ballRef.current) {
          ballRef.current.visible = t < 0.9
          if (t < 0.38) {
            const u = smooth(t / 0.38)
            ballRef.current.position.x = THREE.MathUtils.lerp(current.ballStart.x, current.ballEnd.x, u)
            ballRef.current.position.z = THREE.MathUtils.lerp(current.ballStart.z, current.ballEnd.z, u)
            ballRef.current.position.y = THREE.MathUtils.lerp(current.ballStart.y, current.ballEnd.y, u)
              + Math.sin(u * Math.PI) * 1.9
          } else {
            const bounceT = Math.min(1, (t - 0.38) / 0.22)
            ballRef.current.position.set(
              current.ballEnd.x,
              current.ballEnd.y + Math.abs(Math.sin(bounceT * Math.PI * 2)) * (1 - bounceT) * 0.45,
              current.ballEnd.z,
            )
          }
          ballRef.current.rotation.x += delta * 5
          ballRef.current.rotation.z += delta * 3
        }

        if (t < 0.33) {
          const look = current.ballEnd.clone().sub(p)
          look.y = 0
          if (look.lengthSq() > 0.001) {
            bear.rotation.y = THREE.MathUtils.damp(
              bear.rotation.y,
              Math.atan2(look.x, look.z),
              7,
              delta,
            )
          }
        } else if (t < 0.82) {
          const direction = current.ballEnd.clone().sub(p)
          direction.y = 0
          const distance = direction.length()
          if (distance > 0.48) {
            direction.normalize()
            p.addScaledVector(direction, Math.min(1.75 * delta, distance - 0.35))
            bear.rotation.y = THREE.MathUtils.damp(
              bear.rotation.y,
              Math.atan2(direction.x, direction.z),
              9,
              delta,
            )
            phase.current += delta * 13
            const runSwing = Math.sin(phase.current) * 0.62
            if (leftLeg.current) leftLeg.current.rotation.x = runSwing
            if (rightLeg.current) rightLeg.current.rotation.x = -runSwing
            if (leftArm.current) leftArm.current.rotation.x = -runSwing * 0.55
            if (rightArm.current) rightArm.current.rotation.x = runSwing * 0.55
            p.y = 0.04 + Math.abs(Math.sin(phase.current * 2)) * 0.035
          }
        } else {
          const celebrate = (t - 0.82) / 0.18
          p.y = 0.04 + Math.sin(celebrate * Math.PI) * 0.3
          bear.rotation.y += delta * 2.1
        }
        return
      }

      p.y = 0.04 + Math.abs(Math.sin(state.clock.elapsedTime * 7)) * 0.28
      bear.rotation.y += delta * 2.6
      return
    }

    bear.rotation.z = THREE.MathUtils.damp(bear.rotation.z, 0, 9, delta)
    p.y = THREE.MathUtils.damp(p.y, 0.04, 8, delta)
    if (leftArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.damp(leftArm.current.rotation.x, 0, 9, delta)
      leftArm.current.rotation.z = THREE.MathUtils.damp(leftArm.current.rotation.z, 0, 9, delta)
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = THREE.MathUtils.damp(rightArm.current.rotation.x, 0, 9, delta)
      rightArm.current.rotation.z = THREE.MathUtils.damp(rightArm.current.rotation.z, 0, 9, delta)
    }

    if (layoutMode) return
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
    const next = p.clone().addScaledVector(direction, Math.min(0.62 * delta, distance))
    if (isBlocked(next, furniture)) {
      chooseTarget()
      waitUntil.current = state.clock.elapsedTime + 0.25
      return
    }

    p.copy(next)
    bear.rotation.y = THREE.MathUtils.damp(
      bear.rotation.y,
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
    <>
      <group ref={group} position={[0, 0.04, 0]}>
        <mesh castShadow position={[0, 1.02, 0]} scale={[0.78, 0.98, 0.62]}>
          <sphereGeometry args={[0.72, 32, 24]} />
          <meshStandardMaterial color="#f8f7f2" roughness={0.9} />
        </mesh>

        <mesh castShadow position={[0, 1.79, 0.06]} scale={[1.02, 0.98, 0.96]}>
          <sphereGeometry args={[0.59, 32, 24]} />
          <meshStandardMaterial color="#fbfaf6" roughness={0.9} />
        </mesh>

        <mesh castShadow position={[-0.41, 2.15, 0.015]}>
          <sphereGeometry args={[0.205, 20, 16]} />
          <meshStandardMaterial color="#f6f4ed" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.41, 2.15, 0.015]}>
          <sphereGeometry args={[0.205, 20, 16]} />
          <meshStandardMaterial color="#f6f4ed" roughness={0.9} />
        </mesh>

        <mesh castShadow position={[0, 1.62, 0.515]} scale={[0.64, 0.43, 0.38]}>
          <sphereGeometry args={[0.48, 28, 20]} />
          <meshStandardMaterial color="#b9bbb7" roughness={0.96} />
        </mesh>
        <mesh castShadow position={[0, 1.49, 0.49]} scale={[0.48, 0.26, 0.29]}>
          <sphereGeometry args={[0.42, 24, 18]} />
          <meshStandardMaterial color="#c6c7c3" roughness={0.98} />
        </mesh>
        <mesh castShadow position={[0, 1.68, 0.705]} scale={[1.28, 0.78, 0.64]}>
          <sphereGeometry args={[0.125, 20, 14]} />
          <meshStandardMaterial color="#151716" roughness={0.58} />
        </mesh>
        <mesh position={[0, 1.515, 0.69]} scale={[0.95, 0.25, 0.35]}>
          <sphereGeometry args={[0.105, 18, 12]} />
          <meshStandardMaterial color="#353735" roughness={0.85} />
        </mesh>

        <Sunglasses />

        <group ref={leftArm} position={[-0.63, 1.0, 0]}>
          <mesh castShadow scale={[0.27, 0.62, 0.28]}>
            <sphereGeometry args={[0.52, 18, 14]} />
            <meshStandardMaterial color="#f7f6f0" />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.63, 1.0, 0]}>
          <mesh castShadow scale={[0.27, 0.62, 0.28]}>
            <sphereGeometry args={[0.52, 18, 14]} />
            <meshStandardMaterial color="#f7f6f0" />
          </mesh>
        </group>

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

      <FoodTreat foodRef={foodRef} />
      <PlayBall ballRef={ballRef} />
      <PettingHand handRef={handRef} />
    </>
  )
}

function Room({ roomStyle }) {
  const wallColor = roomStyle?.wallpaper === 'wallpaper-warm' ? '#e3d0b9' : '#ede9df'
  const sideWallColor = roomStyle?.wallpaper === 'wallpaper-warm' ? '#dac5ae' : '#e8e3d8'
  const floorColor = roomStyle?.floor === 'floor-wood' ? '#b1845f' : '#d8cab4'

  return (
    <group>
      <mesh receiveShadow position={[0, -0.08, 0]}>
        <boxGeometry args={[10, 0.16, 8]} />
        <meshStandardMaterial color={floorColor} roughness={0.96} />
      </mesh>
      <mesh receiveShadow position={[0, 1.8, -4]}>
        <boxGeometry args={[10, 3.6, 0.16]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[-5, 1.8, 0]}>
        <boxGeometry args={[0.16, 3.6, 8]} />
        <meshStandardMaterial color={sideWallColor} roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[5, 1.8, 0]}>
        <boxGeometry args={[0.16, 3.6, 8]} />
        <meshStandardMaterial color={sideWallColor} roughness={0.92} />
      </mesh>
    </group>
  )
}

function FurnitureLayer({ placements, layoutMode, selectedFurnitureId, onSelectFurniture }) {
  return placements.map((item) => (
    <group
      key={item.itemId}
      position={[item.x, 0, item.z]}
      rotation={[0, item.rotation ?? 0, 0]}
    >
      <FurnitureObject
        itemId={item.itemId}
        selected={layoutMode && selectedFurnitureId === item.itemId}
        onSelect={layoutMode ? () => onSelectFurniture?.(item.itemId) : undefined}
      />
    </group>
  ))
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

export default function TerakumaScene({
  status,
  reactionTick,
  reactionAction = 'happy',
  placedFurniture = [],
  roomStyle = { wallpaper: 'default', floor: 'default' },
  layoutMode = false,
  selectedFurnitureId = null,
  onSelectFurniture,
}) {
  return (
    <div className="scene-wrap">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [6.4, 4.8, 7.4], fov: 43 }}
        onPointerMissed={() => {
          if (layoutMode) onSelectFurniture?.(null)
        }}
      >
        <color attach="background" args={['#cfd7d8']} />
        <ambientLight intensity={1.25} />
        <directionalLight castShadow intensity={2.1} position={[4, 7, 5]} />
        <Room roomStyle={roomStyle} />
        <FurnitureLayer
          placements={placedFurniture}
          layoutMode={layoutMode}
          selectedFurnitureId={selectedFurnitureId}
          onSelectFurniture={onSelectFurniture}
        />
        {status === 'active' ? (
          <Bear
            reactionTick={reactionTick}
            reactionAction={reactionAction}
            furniture={placedFurniture}
            layoutMode={layoutMode}
          />
        ) : (
          <Marker status={status} />
        )}
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
