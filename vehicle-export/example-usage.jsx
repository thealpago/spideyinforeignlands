/**
 * Örnek Kullanım - 4x4 Araç
 * 
 * Bu dosya, aracın yeni bir projede nasıl kullanılacağını gösterir.
 * Kendi projenize import yollarını düzenleyerek entegre edebilirsiniz.
 */

import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { OrbitControls, Sky, Environment } from '@react-three/drei'

// Araç bileşeni - import yolunu kendi projenize göre düzenleyin
import Vehicle from './components/scene/vehicles/Vehicle'

// Input store - klavye/gamepad kontrolü için gerekli
import useInputStore from './store/inputStore'

/**
 * Klavye Event Handler Bileşeni
 * Bu bileşen klavye girdilerini dinler ve store'a aktarır
 */
const KeyboardHandler = () => {
    useEffect(() => {
        const { setKey } = useInputStore.getState()

        const handleKeyDown = (e) => {
            setKey(e.key, true)
        }

        const handleKeyUp = (e) => {
            setKey(e.key, false)
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    return null
}

/**
 * Zemin Bileşeni
 * Araç için fiziksel bir zemin sağlar
 */
const Ground = () => {
    return (
        <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[50, 0.1, 50]} position={[0, -0.1, 0]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#4a7c4e" />
            </mesh>
        </RigidBody>
    )
}

/**
 * Ana Sahne Bileşeni
 */
const Scene = () => {
    return (
        <>
            {/* Aydınlatma */}
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[50, 50, 25]}
                intensity={1}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            {/* Gökyüzü */}
            <Sky sunPosition={[100, 20, 100]} />

            {/* Fizik Dünyası */}
            <Physics gravity={[0, -9.81, 0]} debug={false}>
                {/* Araç */}
                <Vehicle
                    body="jeep_yj"
                    color="#c81414"
                    roughness={0.3}
                    lift={8}
                    tire="bfg_km2"
                    tire_diameter={40}
                    rim="konig_countersteer"
                    rim_diameter={24}
                    rim_width={16}
                    rim_color="gloss_black"
                />

                {/* Zemin */}
                <Ground />
            </Physics>

            {/* Kamera Kontrolü (Geliştirme için) */}
            <OrbitControls />
        </>
    )
}

/**
 * Ana Uygulama Bileşeni
 */
const App = () => {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            {/* Klavye handler - Canvas dışında */}
            <KeyboardHandler />

            {/* Kontrol Bilgisi */}
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                }}
            >
                <h3 style={{ margin: '0 0 10px 0' }}>🎮 Kontroller</h3>
                <p style={{ margin: '5px 0' }}>W / ↑ : İleri</p>
                <p style={{ margin: '5px 0' }}>S / ↓ : Geri / Fren</p>
                <p style={{ margin: '5px 0' }}>A / ← : Sol</p>
                <p style={{ margin: '5px 0' }}>D / → : Sağ</p>
                <p style={{ margin: '5px 0' }}>Shift : Drift</p>
                <p style={{ margin: '5px 0' }}>R : Sıfırla</p>
                <p style={{ margin: '5px 0' }}>L : Işıklar</p>
            </div>

            {/* 3D Canvas */}
            <Canvas
                shadows
                camera={{
                    position: [10, 8, 10],
                    fov: 60,
                    near: 0.1,
                    far: 1000,
                }}
            >
                <Scene />
            </Canvas>
        </div>
    )
}

export default App
