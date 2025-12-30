// Rig data about a single joint
export class RigItem {
  constructor () {
    this.idx = -1 // Joint Index
    this.pidx = -1 // Parent Joint Index
    this.swing = new Vec3(0, 0, 1) // Swing Direction - Z
    this.twist = new Vec3(0, 1, 0) // Twist Direction - Y
  }

  fromJoint (j, swing = null, twist = null) {
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
