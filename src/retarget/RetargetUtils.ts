import { type Group, type Object3DEventMap, type Skeleton, type SkinnedMesh } from 'three'
import { ModalDialog } from '../lib/ModalDialog.ts'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RetargetUtils {
  /**
   * Resets all SkinnedMeshes in the group to their rest pose
   */
  static reset_skinned_mesh_to_rest_pose (skinned_meshes_group: Group<Object3DEventMap>): void {
    skinned_meshes_group.traverse((child) => {
      if (child.type === 'SkinnedMesh') {
        const skinned_mesh = child as SkinnedMesh
        const skeleton: Skeleton = skinned_mesh.skeleton
        skeleton.pose()
        skinned_mesh.updateMatrixWorld(true)
      }
    })
  }

  /**
   * Validates that the retargetable model contains SkinnedMeshes with bones
   * @returns true if valid SkinnedMeshes are found, false otherwise
   */
  static validate_skinned_mesh_has_bones (retargetable_model: Group<Object3DEventMap>): boolean {
    // Collect all SkinnedMeshes
    const skinned_meshes: SkinnedMesh[] = []
    retargetable_model.traverse((child) => {
      if (child.type === 'SkinnedMesh') {
        const skinned_mesh = child as SkinnedMesh
        skinned_meshes.push(skinned_mesh)
      }
    })

    // Check if we have any SkinnedMeshes
    if (skinned_meshes.length === 0) {
      new ModalDialog('No SkinnedMeshes found in file', 'Error opening file').show()
      return false
    }

    console.log('skinned meshes found. ready to start retargeting process:', skinned_meshes)
    return true
  }
}
