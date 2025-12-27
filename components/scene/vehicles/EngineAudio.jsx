import { memo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore, { vehicleState } from '../../../store/gameStore'

/**
 * GLOBAL_AUDIO: TRAKTÖR DİZEL MOTOR SENTEZLEYİCİ
 * Rölanti korunmuş, gaza duyarlı tok ses modifiyeli sürüm.
 */
const GLOBAL_AUDIO = {
	context: null,
	masterGain: null,
	nodes: {
		carrier: null,
		modulator: null,
		modGain: null,
		distortion: null,
		filter: null,
		noise: null,
		noiseGain: null
	},
	initialized: false,
	error: null
}

function makeDistortionCurve(amount) {
	const k = typeof amount === 'number' ? amount : 50
	const n_samples = 44100
	const curve = new Float32Array(n_samples)
	const deg = Math.PI / 180
	for (let i = 0; i < n_samples; ++i) {
		const x = (i * 2) / n_samples - 1
		curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x))
	}
	return curve
}

const initGlobalAudio = () => {
	if (GLOBAL_AUDIO.initialized) return

	try {
		const AudioCtx = window.AudioContext || window.webkitAudioContext
		GLOBAL_AUDIO.context = new AudioCtx({ latencyHint: 'interactive' })

		const masterGain = GLOBAL_AUDIO.context.createGain()
		masterGain.gain.value = 0.15
		masterGain.connect(GLOBAL_AUDIO.context.destination)
		GLOBAL_AUDIO.masterGain = masterGain

		const distortion = GLOBAL_AUDIO.context.createWaveShaper()
		distortion.curve = makeDistortionCurve(120)
		distortion.oversample = '4x'

		const filter = GLOBAL_AUDIO.context.createBiquadFilter()
		filter.type = 'lowpass'
		filter.Q.value = 2.0 // Başlangıç rezonansı

		distortion.connect(filter)
		filter.connect(masterGain)

		const carrier = GLOBAL_AUDIO.context.createOscillator()
		carrier.type = 'sawtooth'

		const modGain = GLOBAL_AUDIO.context.createGain()
		modGain.gain.value = 0

		carrier.connect(modGain)
		modGain.connect(distortion)

		const modulator = GLOBAL_AUDIO.context.createOscillator()
		modulator.type = 'sawtooth'

		const depth = GLOBAL_AUDIO.context.createGain()
		depth.gain.value = 0.95

		modulator.connect(depth)
		depth.connect(modGain.gain)

		const bufferSize = GLOBAL_AUDIO.context.sampleRate * 2
		const buffer = GLOBAL_AUDIO.context.createBuffer(1, bufferSize, GLOBAL_AUDIO.context.sampleRate)
		const data = buffer.getChannelData(0)
		for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5

		const noise = GLOBAL_AUDIO.context.createBufferSource()
		noise.buffer = buffer
		noise.loop = true
		const noiseFilter = GLOBAL_AUDIO.context.createBiquadFilter()
		noiseFilter.type = 'bandpass'
		noiseFilter.frequency.value = 800
		const noiseGain = GLOBAL_AUDIO.context.createGain()
		noiseGain.gain.value = 0.03

		noise.connect(noiseFilter).connect(noiseGain).connect(masterGain)

		carrier.start()
		modulator.start()
		noise.start()

		GLOBAL_AUDIO.nodes = {
			carrier, modulator, modGain, distortion, filter, noise, noiseGain
		}

		GLOBAL_AUDIO.initialized = true
	} catch (e) {
		console.error("Ses Başlatılamadı:", e)
	}
}

const EngineAudio = memo(({ isActive = true }) => {
	const [debugInfo, setDebugInfo] = useState({ state: 'bekliyor', rpm: 0 })

	useEffect(() => {
		initGlobalAudio()
		const existing = document.getElementById('engine-debug-v2')
		if (existing) existing.remove()
		const unlock = () => {
			if (GLOBAL_AUDIO.context && GLOBAL_AUDIO.context.state === 'suspended') {
				GLOBAL_AUDIO.context.resume()
			}
		}
		window.addEventListener('click', unlock)
		window.addEventListener('keydown', unlock)
		return () => {
			window.removeEventListener('click', unlock)
			window.removeEventListener('keydown', unlock)
			const div = document.getElementById('engine-debug-v2')
			if (div) div.remove()
		}
	}, [])

	useEffect(() => {
		if (GLOBAL_AUDIO.initialized && GLOBAL_AUDIO.masterGain) {
			const target = isActive ? 0.5 : 0
			const fadeTime = isActive ? 0.3 : 0.15 // Faster fade-out when deactivating
			GLOBAL_AUDIO.masterGain.gain.setTargetAtTime(target, GLOBAL_AUDIO.context.currentTime, fadeTime)
		}
	}, [isActive])

	// Cleanup when component unmounts - always ensure audio is stopped
	useEffect(() => {
		return () => {
			if (GLOBAL_AUDIO.initialized && GLOBAL_AUDIO.masterGain) {
				// Immediate fade out on unmount
				GLOBAL_AUDIO.masterGain.gain.setTargetAtTime(0, GLOBAL_AUDIO.context.currentTime, 0.1)
			}
		}
	}, [])

	useFrame(() => {
		if (!GLOBAL_AUDIO.initialized || !GLOBAL_AUDIO.nodes.carrier || !isActive) return

		const rpm = Math.max(450, vehicleState.rpm || 450)
		const throttle = vehicleState.throttle || 0
		const now = GLOBAL_AUDIO.context.currentTime

		// 1. TEMEL TON (Tokluk Korumalı)
		// Gaza basınca frekansın aşırı artıp inceleşmesini (V8 gibi olmasını) engelliyoruz
		const carrierFreq = 35 + (rpm / 120)
		GLOBAL_AUDIO.nodes.carrier.frequency.setTargetAtTime(carrierFreq, now, 0.1)

		// 2. VURUŞ HIZI (Rölanti Ritmi Korundu)
		const modFreq = rpm / 40
		GLOBAL_AUDIO.nodes.modulator.frequency.setTargetAtTime(modFreq, now, 0.1)

		// 3. TOK SES MODİFİKASYONU (Filtre ve Q)
		// Rölantide (throttle=0) eski yumuşak tonu korur. 
		// Gaza basınca filtre frekansı artarken rezonansı (Q) ciddi şekilde yükseltir.
		const baseFilterFreq = 200 + (rpm / 20)
		const throttleBoost = throttle * 50
		GLOBAL_AUDIO.nodes.filter.frequency.setTargetAtTime(baseFilterFreq + throttleBoost, now, 1.1)

		// Dinamik Tokluk: Gaz verdikçe filtre sivriliğini artırarak "dolgunluk" sağlar
		const dynamicQ = 2.0 + (throttle * 4.0)
		GLOBAL_AUDIO.nodes.filter.Q.setTargetAtTime(dynamicQ, now, 0.1)

		// 4. MEKANİK SESLER
		GLOBAL_AUDIO.nodes.noiseGain.gain.setTargetAtTime(0.02 + (rpm / 25000), now, 0.1)

		if (Math.random() < 0.05) {
			setDebugInfo({ state: GLOBAL_AUDIO.context.state, rpm: Math.round(rpm) })
		}
	})

	// Keep state referenced to avoid unused state warnings in some setups
	void debugInfo

	return null
})

const HtmlOverlay = ({ info }) => {
	useEffect(() => {
		let div = document.getElementById('engine-debug-v2')
		if (!div) {
			div = document.createElement('div')
			div.id = 'engine-debug-v2'
			div.style.cssText = `position:absolute; top:50px; left:10px; padding:8px; background:rgba(0,0,0,0.7); color:#fbbf24; font-family:monospace; font-size:10px; z-index:99999; pointer-events:none; border-left: 3px solid #fbbf24;`
			document.body.appendChild(div)
		}
		div.innerHTML = `TRAKTÖR DİZEL ÜNİTESİ<br>RPM: ${info.rpm}<br>DURUM: ${info.state.toUpperCase()}`
	}, [info])
	return null
}

export default EngineAudio