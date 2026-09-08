import * as THREE from 'three'

const wood = '#9a7658'
const darkWood = '#6f5541'
const fabric = '#718881'
const metal = '#5d6668'

function Chair() {
  return (
    <group>
      <mesh castShadow position={[0, 0.58, 0]}>
        <boxGeometry args={[0.85, 0.14, 0.82]} />
        <meshStandardMaterial color={wood} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 1.05, -0.34]}>
        <boxGeometry args={[0.85, 0.82, 0.12]} />
        <meshStandardMaterial color={wood} roughness={0.82} />
      </mesh>
      {[[-0.31, 0.28, -0.28], [0.31, 0.28, -0.28], [-0.31, 0.28, 0.28], [0.31, 0.28, 0.28]].map((p) => (
        <mesh key={p.join('-')} castShadow position={p}>
          <boxGeometry args={[0.12, 0.55, 0.12]} />
          <meshStandardMaterial color={darkWood} roughness={0.88} />
        </mesh>
      ))}
    </group>
  )
}

function LowTable() {
  return (
    <group>
      <mesh castShadow position={[0, 0.65, 0]}>
        <boxGeometry args={[1.7, 0.18, 1.05]} />
        <meshStandardMaterial color={wood} roughness={0.78} />
      </mesh>
      {[[-0.68, 0.31, -0.38], [0.68, 0.31, -0.38], [-0.68, 0.31, 0.38], [0.68, 0.31, 0.38]].map((p) => (
        <mesh key={p.join('-')} castShadow position={p}>
          <boxGeometry args={[0.14, 0.62, 0.14]} />
          <meshStandardMaterial color={darkWood} roughness={0.88} />
        </mesh>
      ))}
    </group>
  )
}

function Sofa() {
  return (
    <group>
      <mesh castShadow position={[0, 0.48, 0]}>
        <boxGeometry args={[2.15, 0.55, 0.95]} />
        <meshStandardMaterial color={fabric} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 1.05, -0.38]}>
        <boxGeometry args={[2.15, 0.85, 0.25]} />
        <meshStandardMaterial color="#657a74" roughness={0.96} />
      </mesh>
      <mesh castShadow position={[-1.02, 0.72, 0]}>
        <boxGeometry args={[0.24, 0.7, 0.98]} />
        <meshStandardMaterial color="#657a74" roughness={0.96} />
      </mesh>
      <mesh castShadow position={[1.02, 0.72, 0]}>
        <boxGeometry args={[0.24, 0.7, 0.98]} />
        <meshStandardMaterial color="#657a74" roughness={0.96} />
      </mesh>
      <mesh castShadow position={[-0.5, 0.81, 0.08]}>
        <boxGeometry args={[0.9, 0.18, 0.72]} />
        <meshStandardMaterial color="#81958f" roughness={0.96} />
      </mesh>
      <mesh castShadow position={[0.5, 0.81, 0.08]}>
        <boxGeometry args={[0.9, 0.18, 0.72]} />
        <meshStandardMaterial color="#81958f" roughness={0.96} />
      </mesh>
    </group>
  )
}

function Television() {
  return (
    <group>
      <mesh castShadow position={[0, 1.18, 0]}>
        <boxGeometry args={[1.65, 1.0, 0.14]} />
        <meshStandardMaterial color="#1f2425" roughness={0.38} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.18, 0.076]}>
        <planeGeometry args={[1.48, 0.83]} />
        <meshStandardMaterial color="#29424b" emissive="#102329" emissiveIntensity={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.17, 0.34, 0.17]} />
        <meshStandardMaterial color={metal} roughness={0.55} />
      </mesh>
      <mesh castShadow position={[0, 0.34, 0]}>
        <boxGeometry args={[0.82, 0.1, 0.42]} />
        <meshStandardMaterial color={metal} roughness={0.55} />
      </mesh>
    </group>
  )
}

function Wardrobe() {
  return (
    <group>
      <mesh castShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[1.45, 2.3, 0.72]} />
        <meshStandardMaterial color={wood} roughness={0.9} />
      </mesh>
      <mesh position={[-0.37, 1.15, 0.366]}>
        <boxGeometry args={[0.68, 2.05, 0.035]} />
        <meshStandardMaterial color="#a98768" roughness={0.9} />
      </mesh>
      <mesh position={[0.37, 1.15, 0.366]}>
        <boxGeometry args={[0.68, 2.05, 0.035]} />
        <meshStandardMaterial color="#a98768" roughness={0.9} />
      </mesh>
      <mesh position={[-0.08, 1.17, 0.42]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshStandardMaterial color="#3e3934" metalness={0.4} />
      </mesh>
      <mesh position={[0.08, 1.17, 0.42]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshStandardMaterial color="#3e3934" metalness={0.4} />
      </mesh>
    </group>
  )
}

function Dumbbell() {
  return (
    <group position={[0, 0.28, 0]} rotation={[0, 0.3, 0]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.15, 14]} />
        <meshStandardMaterial color={metal} metalness={0.35} roughness={0.45} />
      </mesh>
      {[-0.5, -0.38, 0.38, 0.5].map((x) => (
        <mesh key={x} castShadow position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.13, 16]} />
          <meshStandardMaterial color="#34393a" roughness={0.65} />
        </mesh>
      ))}
    </group>
  )
}

function Treadmill() {
  return (
    <group>
      <mesh castShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[1.15, 0.22, 2.2]} />
        <meshStandardMaterial color="#3f4749" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0.05]}>
        <boxGeometry args={[0.82, 0.05, 1.68]} />
        <meshStandardMaterial color="#1f2425" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-0.46, 0.95, -0.83]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[0.09, 1.45, 0.09]} />
        <meshStandardMaterial color={metal} metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0.46, 0.95, -0.83]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[0.09, 1.45, 0.09]} />
        <meshStandardMaterial color={metal} metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.48, -0.67]}>
        <boxGeometry args={[1.12, 0.1, 0.1]} />
        <meshStandardMaterial color={metal} metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.36, -0.72]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.62, 0.32, 0.12]} />
        <meshStandardMaterial color="#202728" roughness={0.5} />
      </mesh>
    </group>
  )
}

export const FURNITURE_RADII = {
  'chair-basic': 0.65,
  'table-basic': 1.0,
  'sofa-basic': 1.25,
  'tv-basic': 0.95,
  'wardrobe-basic': 0.95,
  'dumbbell-basic': 0.55,
  'treadmill-basic': 1.2,
}

export function FurnitureObject({ itemId, selected = false, onSelect }) {
  let object = null
  if (itemId === 'chair-basic') object = <Chair />
  if (itemId === 'table-basic') object = <LowTable />
  if (itemId === 'sofa-basic') object = <Sofa />
  if (itemId === 'tv-basic') object = <Television />
  if (itemId === 'wardrobe-basic') object = <Wardrobe />
  if (itemId === 'dumbbell-basic') object = <Dumbbell />
  if (itemId === 'treadmill-basic') object = <Treadmill />

  if (!object) return null

  return (
    <group
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
    >
      {object}
      {selected && (
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.73, 36]} />
          <meshBasicMaterial color="#4f8b72" side={THREE.DoubleSide} transparent opacity={0.92} />
        </mesh>
      )}
    </group>
  )
}
