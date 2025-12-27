# 4x4 Vehicle Export Package

Bu paket, 4x4 araç modelini ve tüm kontrollerini başka bir React Three.js projesinde kullanabilmeniz için gerekli tüm dosyaları içerir.

## 📁 Paket İçeriği

```
vehicle-export/
├── components/
│   └── scene/
│       └── vehicles/
│           ├── Vehicle.jsx        # Ana araç bileşeni
│           ├── Wheels.jsx         # Tekerlek bileşeni
│           ├── Rim.jsx            # Jant bileşeni
│           ├── Tire.jsx           # Lastik bileşeni
│           ├── EngineAudio.jsx    # Motor sesi
│           ├── Dust.jsx           # Toz efekti
│           ├── TireTracks.jsx     # Lastik izleri
│           ├── Lighting.jsx       # Araç aydınlatması
│           └── ...
├── hooks/
│   ├── useVehiclePhysics.js       # Fizik sistemi (süspansiyon, vites, tork)
│   ├── useVehicleInput.js         # Kontrol sistemi (klavye, gamepad)
│   ├── useVehicleDimensions.js    # Boyut hesaplamaları
│   ├── useMaterialProperties.js   # Malzeme özellikleri
│   └── ...
├── store/
│   ├── inputStore.js              # Giriş state yönetimi
│   └── gameStore.js               # Oyun state yönetimi
├── assets/
│   └── models/
│       ├── vehicles/              # Araç 3D modelleri (.glb)
│       └── wheels/                # Tekerlek modelleri (.glb)
├── vehicleConfigs.js              # Araç konfigürasyonu
├── package.json                   # Gerekli bağımlılıklar
├── example-usage.jsx              # Örnek kullanım
└── README.md                      # Bu dosya
```

## 🔧 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install @react-three/fiber @react-three/drei @react-three/rapier @react-three/xr three zustand
```

### 2. Dosyaları Projenize Kopyalayın

Export klasöründeki dosyaları projenizin uygun dizinlerine kopyalayın:

- `components/` → Projenizin `src/components/` dizinine
- `hooks/` → `src/hooks/` dizinine
- `store/` → `src/store/` dizinine
- `assets/` → `public/assets/` dizinine
- `vehicleConfigs.js` → `src/` dizinine

### 3. Import Yollarını Güncelleyin

Her dosyadaki import yollarını kendi proje yapınıza göre düzenleyin.

## 🚗 Temel Kullanım

```jsx
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import Vehicle from './components/scene/vehicles/Vehicle'

function App() {
  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      
      <Physics gravity={[0, -9.81, 0]}>
        <Vehicle 
          body="jeep_yj"
          color="#c81414"
          tire_diameter={40}
          rim_diameter={24}
        />
        {/* Zemin */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
      </Physics>
    </Canvas>
  )
}

export default App
```

## 🎮 Kontroller

| Tuş | Aksiyon |
|-----|---------|
| W / ↑ | İleri git |
| S / ↓ | Geri git / Fren |
| A / ← | Sola dön |
| D / → | Sağa dön |
| Shift | Drift modu |
| R | Aracı sıfırla |
| L | Işıkları aç/kapat |

**Gamepad Desteği:** Sol analog çubuk (direksiyon), sağ analog çubuk (gaz/fren)

## ⚙️ Araç Özellikleri (Props)

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `body` | string | `"jeep_yj"` | Araç gövde modeli |
| `color` | string | `"#c81414"` | Araç rengi |
| `roughness` | number | `0` | Malzeme pürüzlülüğü |
| `lift` | number | `8` | Süspansiyon yüksekliği |
| `tire` | string | `"bfg_km2"` | Lastik modeli |
| `tire_diameter` | number | `40` | Lastik çapı (inch) |
| `rim` | string | `"konig_countersteer"` | Jant modeli |
| `rim_diameter` | number | `24` | Jant çapı (inch) |
| `rim_width` | number | `16` | Jant genişliği (inch) |
| `rim_color` | string | `"gloss_black"` | Jant rengi |

## 🔌 Fizik Sistemi

`useVehiclePhysics` hook'u şu özellikleri içerir:

- ✅ Gerçekçi süspansiyon sistemi
- ✅ 5 vitesli şanzıman simülasyonu
- ✅ Tork eğrisi
- ✅ Bağımsız tekerlek fiziği
- ✅ Drift mekaniği
- ✅ Hava kontrolü (havadayken pitch/roll)

## 📝 Notlar

1. **Fizik Motoru:** Bu sistem `@react-three/rapier` kütüphanesini kullanır
2. **Performans:** Mobil cihazlarda toz ve lastik izi efektleri otomatik devre dışı bırakılır
3. **XR Desteği:** VR/AR için `@react-three/xr` entegrasyonu mevcuttur

## 🐛 Sorun Giderme

**Model yüklenmiyor:**
- `vehicleConfigs.js` içindeki model yollarını kontrol edin
- Assets klasörünün `public/` içinde olduğundan emin olun

**Fizik çalışmıyor:**
- `<Physics>` bileşeni içinde olduğunuzdan emin olun
- Zemin collider'ı eklediğinizden emin olun

**Kontroller çalışmıyor:**
- `store/inputStore.js` dosyasının doğru import edildiğinden emin olun
- Klavye event listener'larının aktif olduğunu kontrol edin
