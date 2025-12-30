export class HumanRig {
  private skeleton: any
  private chains: any = {}
  private t_pose: any = null
  private scalar: number = 1.0

  constructor (skeleton: any) {
    this.skeleton = skeleton
  }
}
