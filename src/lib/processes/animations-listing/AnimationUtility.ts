import { AnimationClip, type KeyframeTrack } from "three"

export class AnimationUtility {
  // when we scaled the skeleton itself near the beginning, we kept track of that
  // this scaling will affect position keyframes since they expect the original skeleton scale
  // this will fix any issues with position keyframes not matching the current skeleton scale
  static apply_skeleton_scale_to_position_keyframes (animation_clips: AnimationClip[], scaleAmount: number): void {
    animation_clips.forEach((animation_clip: AnimationClip) => {
      animation_clip.tracks.forEach((track: KeyframeTrack) => {
        if (track.name.includes('.position')) {
          const values = track.values
          for (let i = 0; i < values.length; i += 3) {
            values[i] *= scaleAmount
            values[i + 1] *= scaleAmount
            values[i + 2] *= scaleAmount
          }
        }
      })
    })
  }

  static deep_clone_animation_clip (clip: AnimationClip): AnimationClip {
    const tracks = clip.tracks.map((track: KeyframeTrack) => track.clone())
    return new AnimationClip(clip.name, clip.duration, tracks)
  }

  static deep_clone_animation_clips (animation_clips: AnimationClip[]): AnimationClip[] {
    return animation_clips.map((clip: AnimationClip) => {
      return this.deep_clone_animation_clip(clip)
    })
  }

  /// Removes position tracks from animation clips, keeping only rotation tracks.
  /// @param animation_clips - The animation clips to modify.
  /// @param preserve_root_position - Whether to keep the root position track.
  static clean_track_data (animation_clips: AnimationClip[], preserve_root_position: boolean = false): void {
    animation_clips.forEach((animation_clip: AnimationClip) => {
      // remove all position nodes except root
      let rotation_tracks: KeyframeTrack[] = []

      if (preserve_root_position) {
        rotation_tracks = animation_clip.tracks
          .filter((x: KeyframeTrack) => x.name.includes('quaternion') || x.name.toLowerCase().includes('hips.position'))
      } else {
        rotation_tracks = animation_clip.tracks
          .filter((x: KeyframeTrack) => x.name.includes('quaternion') || x.name.includes('hips.position'))
      }

      animation_clip.tracks = rotation_tracks // update track data
      // console.log(animation_clip.tracks) // UNUSED DEBUG CODE
    })
  }
}
