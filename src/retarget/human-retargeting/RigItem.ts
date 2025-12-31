import { type Joint } from './Joint'
import Quat from './Quat'
import Vec3 from './Vec3'

// Rig data about a single joint
export class RigItem {
  private idx: number = -1 // Joint Index
  private pidx: number = -1 // Parent Joint Index
  private readonly swing: Vec3 = new Vec3(0, 0, 1) // Swing Direction - Z
  private readonly twist: Vec3 = new Vec3(0, 1, 0) // Twist Direction - Y

  public fromJoint (j: Joint, swing = null, twist = null): this {
    this.idx = j.index
    this.pidx = j.pindex

    // Compute inverse direction on the current joint rotation
    if (swing || twist) {
      const q = new Quat().fromInvert(j.world.rot)
      if (swing) this.swing.fromQuat(q, swing)
      if (twist) this.twist.fromQuat(q, twist)
    }

    return this
  }
}
