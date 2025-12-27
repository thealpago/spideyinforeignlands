import { memo, useMemo, useRef, useEffect, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Gltf } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { Vector3, Quaternion, Euler, MathUtils } from 'three'

import useGameStore, { vehicleState } from '../../../store/gameStore'
import vehicleConfigs from '../../../vehicleConfigs'
import useAnimateHeight from '../../../hooks/useAnimateHeight'
import useMaterialProperties from '../../../hooks/useMaterialProperties'
import useVehicleDimensions from '../../../hooks/useVehicleDimensions'
import useVehicleInput from '../../../hooks/useVehicleInput'
import { getTerrainHeight } from '../../../utils/helpers'
import EngineAudio from './EngineAudio'
import Dust from './Dust'
import TireTracks from './TireTracks'
import Wheels from './Wheels'
import Lighting from './Lighting'

// Body component
const Body = memo(({ id, height, color, roughness, addons, lighting }) => {
	const vehicle = useRef()
	const { setObjectMaterials } = useMaterialProperties()

	useEffect(() => {
		setObjectMaterials(vehicle.current, color, roughness)
	}, [setObjectMaterials, color, roughness, addons])

	const addonPaths = useMemo(() => {
		return Object.entries(addons)
			.filter(([type, value]) => vehicleConfigs.vehicles[id]['addons'][type]?.['options'][value])
			.map(([type, value]) => {
				return vehicleConfigs.vehicles[id]['addons'][type]['options'][value]['model']
			})
	}, [id, addons])

	useAnimateHeight(vehicle, height, height + (0.1 * (height / 2)))

	return (
		<group ref={vehicle} name='Body' key={id}>
			<Gltf src={vehicleConfigs.vehicles[id].model} />
			{addonPaths.length ? (
				<group name='Addons'>
					{addonPaths.map((addon) => (
						<Gltf key={addon} src={addon} />
					))}
				</group>
			) : null}
			<Lighting id={id} lighting={lighting} />
		</group>
	)
})

const TRANSMISSION = {
	gearRatios: [0, 3.5, 2.2, 1.4, 1.0, 0.75],
	finalDrive: 3.73,
	wheelRadius: 0.35,
	idleRpm: 850,
	maxRpm: 6200,
	shiftUpRpm: 5500,
	shiftDownRpm: 1800,
	shiftCooldown: 0.4,
}

const TORQUE_CURVE = [
	[850, 0.65], [1500, 0.78], [2000, 0.88], [2500, 0.94], [3000, 0.98],
	[3500, 1.0], [4000, 0.97], [4500, 0.92], [5000, 0.85], [5500, 0.75],
	[6000, 0.6], [6200, 0.5],
]

const getTorqueMultiplier = (rpm) => {
	if (rpm <= TORQUE_CURVE[0][0]) return TORQUE_CURVE[0][1]
	if (rpm >= TORQUE_CURVE[TORQUE_CURVE.length - 1][0]) return TORQUE_CURVE[TORQUE_CURVE.length - 1][1]
	for (let i = 0; i < TORQUE_CURVE.length - 1; i++) {
		const [rpm1, torque1] = TORQUE_CURVE[i]
		const [rpm2, torque2] = TORQUE_CURVE[i + 1]
		if (rpm >= rpm1 && rpm <= rpm2) {
			const t = (rpm - rpm1) / (rpm2 - rpm1)
			return torque1 + t * (torque2 - torque1)
		}
	}
	return 1.0
}

const Vehicle = (props) => {
	const config = { ...vehicleConfigs.defaults, ...props }
	const { body, color, roughness, rim, rim_diameter, rim_width, rim_color, rim_color_secondary, tire, tire_diameter, tire_muddiness, addons, lighting, isLocked, controlsRef, terrainType, onMoveStateChange, sharedPosRef } = config
	const performanceDegraded = useGameStore((state) => state.performanceDegraded)
	const isMobile = useGameStore((state) => state.isMobile)
	const { camera } = useThree()

	// 4x4 Karakteri için özel kamera yakınlığı ayarı
	useEffect(() => {
		if (!controlsRef?.current) return

		// Aracı yakından takip etmek için mesafeleri kısıtla
		const originalMin = controlsRef.current.minDistance
		const originalMax = controlsRef.current.maxDistance

		controlsRef.current.minDistance = 12
		controlsRef.current.maxDistance = 45

		// Eğer kamera çok uzaktaysa (başka karakterden geçiş yapıldıysa) kamerayı yaklaştır
		const currentDist = camera.position.distanceTo(controlsRef.current.target)
		if (currentDist > 45 || currentDist < 10) {
			const direction = new Vector3().subVectors(camera.position, controlsRef.current.target).normalize()
			// Yeni pozisyonu hesapla (25 birim uzaklık ideal)
			camera.position.copy(controlsRef.current.target).add(direction.multiplyScalar(22))
		}

		return () => {
			if (controlsRef.current) {
				controlsRef.current.minDistance = originalMin
				controlsRef.current.maxDistance = originalMax
			}
		}
	}, [camera, controlsRef])

	let isInXR = false
	try {
		const xrState = useXR()
		isInXR = xrState?.mode !== null && xrState?.mode !== undefined
	} catch (e) { }

	const chassisGroupRef = useRef(null)
	const wheelRefsArray = useRef([{ current: null }, { current: null }, { current: null }, { current: null }])
	const wheelRefs = wheelRefsArray.current

	const { validBody, axleHeight, liftHeight, wheelbase, wheelPositions, offset } = useVehicleDimensions(config)
	const SCALE_FACTOR = 2.5;

	const sim = useRef({
		position: new Vector3(0, 5, 0),
		velocity: new Vector3(),
		quaternion: new Quaternion(),
		wheelRotation: 0,
		steeringAngle: 0,
		forwardSpeed: 0,
		terrainHeights: [0, 0, 0, 0],
		verticalVelocity: 0,
		pitch: 0,
		pitchVelocity: 0,
		roll: 0,
		rollVelocity: 0,
		yaw: 0,
		frontAxleRoll: 0,
		frontAxleRollVel: 0,
		rearAxleRoll: 0,
		rearAxleRollVel: 0,
	})

	const getVehicleInput = useVehicleInput()
	const drivetrainAngularVel = useRef(TRANSMISSION.idleRpm * ((2 * Math.PI) / 60))
	const smoothedLoad = useRef(0.5)
	const lastShiftTime = useRef(0)

	const mockController = useRef({
		chassis: () => ({
			linvel: () => ({ x: sim.current.velocity.x, y: sim.current.velocity.y, z: sim.current.velocity.z }),
			rotation: () => ({ x: sim.current.quaternion.x, y: sim.current.quaternion.y, z: sim.current.quaternion.z, w: sim.current.quaternion.w }),
			translation: () => ({ x: sim.current.position.x, y: sim.current.position.y, z: sim.current.position.z })
		}),
		wheelIsInContact: () => true
	})

	const _vec3 = useMemo(() => new Vector3(), [])
	const _quat = useMemo(() => new Quaternion(), [])
	const _euler = useMemo(() => new Euler(), [])

	useFrame((state, delta) => {
		if (!chassisGroupRef.current) return
		const s = sim.current
		const dt = Math.min(delta, 0.1)

		const { throttleInput, brakeInput, steerInput, shouldReset } = getVehicleInput(dt, s.forwardSpeed)

		if (shouldReset) {
			s.position.set(0, 10, 0)
			s.forwardSpeed = 0
			s.verticalVelocity = 0
			s.pitch = s.roll = s.pitchVelocity = s.rollVelocity = 0
			s.frontAxleRoll = s.rearAxleRoll = 0
			s.frontAxleRollVel = s.rearAxleRollVel = 0
			drivetrainAngularVel.current = TRANSMISSION.idleRpm * ((2 * Math.PI) / 60)
			vehicleState.gear = 1
		}

		const absSpeed = Math.abs(s.forwardSpeed)
		const currentAngularVel = drivetrainAngularVel.current
		const currentRpm = (currentAngularVel * 60) / (2 * Math.PI)
		const currentGear = vehicleState.gear
		const gearRatio = TRANSMISSION.gearRatios[currentGear] || 1
		const totalRatio = gearRatio * TRANSMISSION.finalDrive
		const currentTime = performance.now() / 1000
		const canShift = currentTime - lastShiftTime.current > TRANSMISSION.shiftCooldown

		if (vehicleState.gear !== -1) {
			if (canShift && currentRpm > TRANSMISSION.shiftUpRpm && currentGear < TRANSMISSION.gearRatios.length - 1 && throttleInput > 0.3) {
				vehicleState.gear++
				lastShiftTime.current = currentTime
			} else if (canShift && currentRpm < TRANSMISSION.shiftDownRpm && currentGear > 1 && absSpeed > 0.5) {
				vehicleState.gear--
				lastShiftTime.current = currentTime
			} else if (absSpeed < 0.5) {
				vehicleState.gear = 1
			}
		}

		if (throttleInput > 0 && vehicleState.gear === -1) {
			vehicleState.gear = 1
		} else if (brakeInput > 0 && absSpeed < 0.5) {
			vehicleState.gear = -1
		}

		const idleAngularVel = TRANSMISSION.idleRpm * ((2 * Math.PI) / 60)
		const maxAngularVel = TRANSMISSION.maxRpm * ((2 * Math.PI) / 60)
		let angularAccel = 0
		const drivetrainInertia = 1.15
		const torqueMultiplier = getTorqueMultiplier(currentRpm)
		const throttleForce = throttleInput * 30.0 * torqueMultiplier
		angularAccel += throttleForce / drivetrainInertia
		const internalFriction = 0.5 + (currentRpm / TRANSMISSION.maxRpm) * 2.0
		angularAccel -= internalFriction / drivetrainInertia
		const groundWheelAngularVel = absSpeed / TRANSMISSION.wheelRadius
		const groundEngineAngularVel = groundWheelAngularVel * totalRatio
		const velocityError = groundEngineAngularVel - currentAngularVel
		angularAccel += (velocityError * 10.0) / drivetrainInertia
		if (currentAngularVel < idleAngularVel) {
			angularAccel += (idleAngularVel - currentAngularVel) * 5.0 / drivetrainInertia
		}
		drivetrainAngularVel.current += angularAccel * dt
		drivetrainAngularVel.current = Math.max(idleAngularVel * 0.9, Math.min(maxAngularVel, drivetrainAngularVel.current))

		let engineForce = 0
		if (vehicleState.gear === -1) {
			engineForce = 25 * brakeInput
		} else {
			const gearMultiplier = gearRatio / TRANSMISSION.gearRatios[1]
			engineForce = 80 * throttleInput * torqueMultiplier * gearMultiplier
			const MAX_FORWARD_SPEED = 80.0
			const MAX_REVERSE_SPEED = -10.0
			if (s.forwardSpeed > MAX_FORWARD_SPEED) s.forwardSpeed = MAX_FORWARD_SPEED
			if (s.forwardSpeed < MAX_REVERSE_SPEED) s.forwardSpeed = MAX_REVERSE_SPEED
		}

		const targetSteerAngle = steerInput * (Math.PI / 6)
		s.steeringAngle = MathUtils.lerp(s.steeringAngle, targetSteerAngle, dt * 5)
		s.forwardSpeed += (engineForce - (brakeInput * 50)) * dt
		s.forwardSpeed *= 0.985
		s.yaw += s.steeringAngle * s.forwardSpeed * dt * 0.12
		const velDir = _vec3.set(0, 0, 1).applyEuler(_euler.set(0, s.yaw, 0))
		s.velocity.copy(velDir).multiplyScalar(s.forwardSpeed)
		s.position.x += s.velocity.x * dt
		s.position.z += s.velocity.z * dt
		const wheelRadius = (axleHeight || 0.4) * SCALE_FACTOR
		s.wheelRotation += (s.forwardSpeed * dt) / (wheelRadius || 1)

		// --- GÜNCELLENMİŞ TIRMANMA VE SPİN FİZİĞİ ---
		const wb = (wheelbase / 2) * SCALE_FACTOR
		const off = offset * SCALE_FACTOR
		const currentQuat = _quat.setFromEuler(_euler.set(s.pitch, s.yaw, s.roll, 'YXZ'))

		const h = [
			getTerrainHeight(_vec3.set(off, 0, wb).applyQuaternion(currentQuat).add(s.position).x, _vec3.set(off, 0, wb).applyQuaternion(currentQuat).add(s.position).z, terrainType),
			getTerrainHeight(_vec3.set(-off, 0, wb).applyQuaternion(currentQuat).add(s.position).x, _vec3.set(-off, 0, wb).applyQuaternion(currentQuat).add(s.position).z, terrainType),
			getTerrainHeight(_vec3.set(off, 0, -wb).applyQuaternion(currentQuat).add(s.position).x, _vec3.set(off, 0, -wb).applyQuaternion(currentQuat).add(s.position).z, terrainType),
			getTerrainHeight(_vec3.set(-off, 0, -wb).applyQuaternion(currentQuat).add(s.position).x, _vec3.set(-off, 0, -wb).applyQuaternion(currentQuat).add(s.position).z, terrainType)
		]
		s.terrainHeights = h

		const frontH = (h[0] + h[1]) / 2
		const rearH = (h[2] + h[3]) / 2
		const avgH = (frontH + rearH) / 2

		// Gövde Eğimleri
		const terrainPitch = Math.atan2(rearH - frontH, wheelbase * SCALE_FACTOR)
		const terrainRoll = Math.atan2(h[1] + h[3] - (h[0] + h[2]), offset * 4 * SCALE_FACTOR)

		// SPIN DÜZELTME: Viraj yatışını kontrol altına al
		const lateralG = s.steeringAngle * s.forwardSpeed * 0.008
		const targetRoll = terrainRoll + lateralG

		// YÜKSEKLİK: Spin sırasında havaya kalkmayı önlemek için min-height ve avg-height dengesi
		const targetY = (Math.min(...h) * 0.4 + avgH * 0.6) + (axleHeight + liftHeight * 0.05) * SCALE_FACTOR

		const accelerationEffect = (engineForce - (brakeInput * 40)) * -0.002
		const targetPitch = terrainPitch + accelerationEffect

		const targetFrontAxleRoll = Math.atan2(h[1] - h[0], offset * 2 * SCALE_FACTOR)
		const targetRearAxleRoll = Math.atan2(h[3] - h[2], offset * 2 * SCALE_FACTOR)

		// Fizik Yayları
		const springK = 80.0, damperK = 18.0
		s.verticalVelocity += ((targetY - s.position.y) * springK - s.verticalVelocity * damperK) * dt
		s.position.y += s.verticalVelocity * dt

		const rotK = 80.0, rotD = 18.0
		s.pitchVelocity += ((targetPitch - s.pitch) * rotK - s.pitchVelocity * rotD) * dt
		s.pitch += s.pitchVelocity * dt
		s.rollVelocity += ((targetRoll - s.roll) * rotK - s.rollVelocity * rotD) * dt
		s.roll += s.rollVelocity * dt

		const axleK = 120.0, axleD = 15.0
		s.frontAxleRollVel += ((targetFrontAxleRoll - s.frontAxleRoll) * axleK - s.frontAxleRollVel * axleD) * dt
		s.frontAxleRoll += s.frontAxleRollVel * dt
		s.rearAxleRollVel += ((targetRearAxleRoll - s.rearAxleRoll) * axleK - s.rearAxleRollVel * axleD) * dt
		s.rearAxleRoll += s.rearAxleRollVel * dt

		s.quaternion.setFromEuler(_euler.set(s.pitch, s.yaw, s.roll, 'YXZ'))
		chassisGroupRef.current.position.copy(s.position)
		chassisGroupRef.current.quaternion.copy(s.quaternion)

		// TEKERLEKLER: Spin ve tırmanma telafisi
		wheelRefs.forEach((ref, i) => {
			if (!ref.current) return
			const isFront = i < 2
			const axleRoll = isFront ? s.frontAxleRoll : s.rearAxleRoll

			if (wheelPositions[i]) {
				const localGroundY = (s.terrainHeights[i] - s.position.y) / SCALE_FACTOR + axleHeight

				// SPIN DÜZELTME: Tekerleğin şasiye göre aşağı uzanma limitini artırdık (-1.5)
				ref.current.position.set(
					wheelPositions[i].position[0],
					MathUtils.clamp(localGroundY, -1.5, 0.5),
					wheelPositions[i].position[2]
				)
			}

			const steer = isFront ? s.steeringAngle : 0
			ref.current.rotation.set(s.wheelRotation, steer, (axleRoll - s.roll), 'ZYX')
		})

		if (isLocked && controlsRef?.current) {
			controlsRef.current.target.lerp(s.position.clone().add(_vec3.set(0, 1.2, 0)), 0.12)
		}

		// Global State
		vehicleState.position.copy(s.position)
		vehicleState.heading = s.yaw
		vehicleState.speed = s.forwardSpeed
		vehicleState.rpm = currentRpm
		vehicleState.throttle = throttleInput
		let engineLoad = 0.1 + (throttleInput * 0.45) + (Math.abs(velocityError) * 0.05)
		smoothedLoad.current += (Math.min(1.0, engineLoad) - smoothedLoad.current) * 0.1
		vehicleState.load = smoothedLoad.current
	})

	return (
		<>
			<group ref={chassisGroupRef} name='Vehicle' scale={SCALE_FACTOR}>
				<EngineAudio />
				<Suspense fallback={null}>
					<Body key={validBody} id={validBody} height={liftHeight} color={color} roughness={roughness} addons={addons} lighting={lighting} />
				</Suspense>
				<Wheels
					rim={rim}
					rim_diameter={rim_diameter}
					rim_width={rim_width}
					rim_color={rim_color}
					rim_color_secondary={rim_color_secondary}
					tire={tire}
					tire_diameter={tire_diameter}
					tire_muddiness={tire_muddiness}
					color={color}
					roughness={roughness}
					wheelPositions={wheelPositions}
					wheelRefs={wheelRefs}
				/>
			</group>
			{!performanceDegraded && !isInXR && !isMobile && (
				<>
					<Dust vehicleController={mockController} wheelRefs={wheelRefs} />
					<TireTracks vehicleController={mockController} wheelRefs={wheelRefs} tireWidth={(rim_width * 2.54) / 100} tireRadius={axleHeight * SCALE_FACTOR} />
				</>
			)}
		</>
	)
}

export default Vehicle