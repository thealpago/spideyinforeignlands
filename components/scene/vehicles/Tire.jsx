import { memo, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Vector3 } from 'three'

import vehicleConfigs from '../../../vehicleConfigs'
import useTireDirtMaterial from '../../../hooks/useTireDirtMaterial'

// Calculate point on line (a to b, at length)
const linePoint = (a, b, length) => {
	let dir = b.clone().sub(a).normalize().multiplyScalar(length)
	return a.clone().add(dir)
}

// Tire component - loads and renders a single tire
const Tire = memo(({ tire, tire_diameter, tire_muddiness, rim_diameter, rim_width }) => {
	// Temel kontrol: tire konfigürasyonu var mı?
	const tireConfig = vehicleConfigs.wheels.tires[tire]
	if (!tireConfig) return null

	// Load tire model
	const tireGltf = useGLTF(tireConfig.model)

	// Scale tire
	const tireGeometry = useMemo(() => {
		if (!tireGltf) return null

		// Modeli sahne içinde ara (ilk mesh'i bul)
		let mesh = null
		tireGltf.scene.traverse((child) => {
			if (child.isMesh && !mesh) mesh = child
		})

		if (!mesh || !mesh.geometry) return null

		// Determine y scale as a percentage of width
		const wheelWidth = (rim_width * 2.54) / 100
		const wheelWidthScale = wheelWidth / tireConfig.width

		const tireOD = tireConfig.od / 2
		const tireID = tireConfig.id / 2
		const odDiff = tireOD - tireID

		const newOd = (tire_diameter * 2.54) / 10 / 2
		const newId = (rim_diameter * 2.54) / 10 / 2

		// Create a copy of the original geometry
		const geometry = mesh.geometry.clone()

		// Scale to match wheel width
		geometry.scale(1, 1, wheelWidthScale)

		// Get position attributes
		const positionAttribute = geometry.getAttribute('position')
		const positionArray = positionAttribute.array

		// Loop through vertices
		for (var i = 0, l = positionAttribute.count; i < l; i++) {
			// Start vector
			let startVector = new Vector3().fromBufferAttribute(positionAttribute, i)

			// Center vector
			let centerVector = new Vector3(0, 0, startVector.z)

			// Distance from center
			let centerDist = centerVector.distanceTo(startVector)

			// Distance from rim
			let rimDist = centerDist - tireID

			// Percentage from rim (division by zero safety)
			let percentOut = odDiff > 0 ? rimDist / odDiff : 0

			// New distance from center
			let newRimDist = (percentOut * (newOd - newId) + newId) / 10

			// End vector
			let setVector = linePoint(centerVector, startVector, newRimDist)

			// Set x,y
			positionArray[i * 3] = setVector.x
			positionArray[i * 3 + 1] = setVector.y
		}

		return geometry
	}, [tireGltf, rim_diameter, rim_width, tire, tire_diameter])

	// Calculate tire radius for shader
	const tireRadius = useMemo(() => (tire_diameter * 2.54) / 100 / 2, [tire_diameter])
	const rimRadius = useMemo(() => (rim_diameter * 2.54) / 100 / 2, [rim_diameter])

	// Create dirt shader callback
	const dirtShaderCallback = useTireDirtMaterial({ tireRadius, rimRadius, coverage: tire_muddiness })

	return (
		<mesh name='Tire' geometry={tireGeometry} castShadow receiveShadow>
			<meshStandardMaterial color='#121212' metalness={0} roughness={0.75} flatShading={true} onBeforeCompile={dirtShaderCallback} />
		</mesh>
	)
})

export default Tire
