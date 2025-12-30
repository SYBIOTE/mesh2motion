export class SwingTwistRetargeter {
  private srcRig = null // Rig & Skeleton of the animation
  private tarRig = null // Rig & Skeleton of target character

  public set_source_rig (rig: any): any {
    this.srcRig = rig
    return this
  }

  public set_target_rig (rig: any): any {
    this.tarRig = rig
    return this
  }
}
