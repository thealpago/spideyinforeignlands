/**
 * Deep clones a THREE.Object3D and its materials.
 * Useful for when you need multiple instances of a model but with independent colors/roughness.
 */
export default function cloneWithMaterials(object) {
    const clone = object.clone()

    clone.traverse((node) => {
        if (node.isMesh) {
            if (Array.isArray(node.material)) {
                node.material = node.material.map((m) => m.clone())
            } else {
                node.material = node.material.clone()
            }
        }
    })

    return clone
}
