import { type Object3D, Scene, type SkinnedMesh, type AnimationClip, type Group } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import { AnimationRetargetService } from '../AnimationRetargetService'
import { TargetBoneMappingType } from './StepBoneMapping'

export class StepExportRetargetedAnimations extends EventTarget {
  public animation_clips_to_export: AnimationClip[] = []

  // Retargeting-related properties
  private bone_mapping = new Map<string, string>()
  private target_mapping_type: TargetBoneMappingType = TargetBoneMappingType.None
  private source_armature: Group | null = null
  private target_skeleton_data: Scene | null = null
  private target_skinned_meshes: SkinnedMesh[] = []

  public setup_retargeting (meshes: SkinnedMesh[], bone_mapping: Map<string, string>,
    mapping_type: TargetBoneMappingType, armature: Group, skeleton_data: Scene | null): void {
    this.bone_mapping = bone_mapping
    this.target_mapping_type = mapping_type
    this.source_armature = armature
    this.target_skeleton_data = skeleton_data
    this.target_skinned_meshes = meshes
  }

  public set_animation_clips_to_export (all_animations_clips: AnimationClip[], animation_checkboxes: number[]): void {
    this.animation_clips_to_export = []
    animation_checkboxes.forEach((indx) => {
      const original_clip: AnimationClip = all_animations_clips[indx]
      const cloned_clip: AnimationClip = original_clip.clone()
      this.animation_clips_to_export.push(cloned_clip)
    })
  }

  public export (filename = 'exported_model'): void {
    if (this.animation_clips_to_export.length === 0) {
      console.log('ERROR: No animation clips added to export')
      return
    }

    // Retarget all animation clips before export
    let retargeted_clips: AnimationClip[] = []
    retargeted_clips = this.animation_clips_to_export.map((clip) =>
      AnimationRetargetService.retarget_animation_clip(
        clip,
        this.bone_mapping,
        this.target_mapping_type,
        this.source_armature,
        this.target_skeleton_data,
        this.target_skinned_meshes // use the meshes being exported as the target
      )
    )
    console.log('Retargeted animation clips:', retargeted_clips)


    const export_scene = new Scene()
    // When exporting to a file, we need to temporarily move the skinned mesh to a new scene
    // skinned meshes can only be part of one scene at a time, so we must move it back to
    // its original parent after exporting
    const original_parents = new Map<SkinnedMesh, Object3D | null>()

    this.target_skinned_meshes.forEach((final_skinned_mesh) => {
      // Save the original parent
      original_parents.set(final_skinned_mesh, final_skinned_mesh.parent)
      export_scene.add(final_skinned_mesh)
    })

    console.log('Retarget: trying to export the following scene as a GLB ', this.target_skinned_meshes)
    console.log('Retarget: animations to export', retargeted_clips)

    this.export_glb(export_scene, retargeted_clips, filename)
      .then(() => {
        // Move the skinned meshes back to their original parents
        this.target_skinned_meshes.forEach((final_skinned_mesh) => {
          const original_par = original_parents.get(final_skinned_mesh)
          if (original_par != null) {
            original_par.add(final_skinned_mesh)
          } else {
            // If there was no original parent, remove it from the scene
            export_scene.remove(final_skinned_mesh)
            console.log('ERROR: No original parent found for skinned mesh when exporting and re-parenting to original scene')
          }
        })
      })
      .catch((error) => { console.log('Error exporting GLB:', error) })
  }

  public async export_glb (exported_scene: Scene, animations_to_export: AnimationClip[], file_name: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const gltf_exporter = new GLTFExporter()

      const export_options = {
        binary: true,
        onlyVisible: false,
        embedImages: true,
        animations: animations_to_export
      }

      gltf_exporter.parse(
        exported_scene,
        (result: ArrayBuffer) => {
          // Handle the result of the export
          if (result !== null) {
            this.save_array_buffer(result, `${file_name}.glb`)
            resolve() // Resolve the promise when the export is complete
          } else {
            console.log('ERROR: result is not an instance of ArrayBuffer')
            reject(new Error('Export result is not an ArrayBuffer'))
          }
        },
        (error: any) => {
          console.log('An error happened during parsing', error)
          reject(error) // Reject the promise if an error occurs
        },
        export_options
      )
    })
  }

  /**
   * 
   * @param blob 
   * @param filename 
   */
  private save_file (blob: Blob, filename: string): void {
    const export_button_hidden_link: HTMLAnchorElement | null = document.querySelector('#download-hidden-link')
    if (export_button_hidden_link != null) {
      export_button_hidden_link.href = URL.createObjectURL(blob)
      export_button_hidden_link.download = filename
      export_button_hidden_link.click()
    } else {
      console.log('ERROR: dom_export_button_hidden_link is null')
    }
  }

  // used for GLB to turn content into a byte array for saving
  private save_array_buffer (buffer: ArrayBuffer, filename: string): void {
    this.save_file(new Blob([buffer], { type: 'application/octet-stream' }), filename)
  }
}
