import { Transform } from './Transform'

// Threejs does not have a method to clone a skeleton that works correctly.
// Pose allows to make copies of a skeleton state. This is great to cache
// the bindpose plus have a working space for computing a new pose before
// commiting the results to the skeleton
export class Pose {
  // #region MAIN
  srcPose = null
  nameIdx = new Map()
  joints = []
  rootOffset = new Transform() // Absolute root transform
  poseOffset = new Transform() // Offset applied to pose
  constructor (skel) {
    if (skel) this.fromSkeleton(skel)
  }
  // #endregion

  // #region GETTERS / SETTERS

  getJoint (o) {
    switch (typeof o) {
      case 'number': return this.joints[o]
      case 'string': {
        const idx = this.nameIdx.get(o)
        return (idx !== undefined) ? this.joints[idx] : null
      }
    }
    return null
  }

  clone () {
    const p = new Pose()
    p.rootOffset.copy(this.rootOffset)
    p.poseOffset.copy(this.poseOffset)

    for (const j of this.joints) p.joints.push(j.clone())

    p.srcPose = this.srcPose ?? this
    p.nameIdx = this.nameIdx // Ref copy, should never change
    return p
  }

  fromSkeleton (skel) {
    this.nameIdx.clear()

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let j
    for (const [i, b] of skel.bones.entries()) {
      // console.log( i, b );
      // Create Joint
      j = new Joint().fromBone(b)
      j.index = i

      // Map Name to Index
      this.nameIdx.set(j.name, j.index)

      // Link up parent-child relationshop
      if ((b.parent?.isBone)) {
        j.pindex = this.nameIdx.get(b.parent.name)
        this.joints[j.pindex].children.push(j.index)
      }

      this.joints[i] = j
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Get pose offset transform

    const b = skel.bones[0]
    if (b.parent) {
      const v = new THREE.Vector3()
      b.parent.getWorldPosition(v)
      this.poseOffset.pos[0] = v.x
      this.poseOffset.pos[1] = v.y
      this.poseOffset.pos[2] = v.z

      b.parent.getWorldScale(v)
      this.poseOffset.scl[0] = v.x
      this.poseOffset.scl[1] = v.y
      this.poseOffset.scl[2] = v.z

      const q = new THREE.Quaternion()
      b.parent.getWorldQuaternion(q)
      this.poseOffset.rot[0] = q.x
      this.poseOffset.rot[1] = q.y
      this.poseOffset.rot[2] = q.z
      this.poseOffset.rot[3] = q.w
    }

    this.updateWorld()
  }

  reset () {
    if (!this.srcPose) { console.log('Pose.reset - No source available for resetting'); return }

    for (let i = 0; i < this.joints.length; i++) {
      this.joints[i].local.copy(this.srcPose.joints[i].local)
    }

    return this
  }

  toSkeleton (skel) {
    let j
    for (const [i, b] of skel.bones.entries()) {
      j = this.joints[i]
      b.position.fromArray(j.local.pos)
      b.quaternion.fromArray(j.local.rot)
      b.scale.fromArray(j.local.scl)
    }
  }

  setRot (i, rot) {
    const r = this.joints[i].local.rot
    r[0] = rot[0]
    r[1] = rot[1]
    r[2] = rot[2]
    r[3] = rot[3]
    return this
  }

  setPos (i, pos) {
    const p = this.joints[i].local.pos
    p[0] = pos[0]
    p[1] = pos[1]
    p[2] = pos[2]
    return this
  }

  setScl (i, scl) {
    const p = this.joints[i].local.scl
    p[0] = scl[0]
    p[1] = scl[1]
    p[2] = scl[2]
    return this
  }

  setScalar (i, s) {
    const p = this.joints[i].local.scl
    p[0] = s
    p[1] = s
    p[2] = s
    return this
  }

  // #endregion

  // #region COMPUTE
  updateWorld () {
    for (const j of this.joints) {
      if (j.pindex !== -1) {
        // Parent Exists
        j.world.fromMul(this.joints[j.pindex].world, j.local)
      } else {
        // No Parent, apply any possible offset
        j.world
          .fromMul(this.rootOffset, this.poseOffset)
          .mul(j.local)
      }
    }

    return this
  }

  getWorld (id, out = new Transform()) {
    let joint = this.getJoint(id)

    if (!joint) {
      if (id === -1) out.fromMul(this.rootOffset, this.poseOffset)
      else console.error('Pose.getWorld - joint not found', id)
      return out
    }

    // Work up the heirarchy till the root bone
    out.copy(joint.local)
    while (joint.pindex !== -1) {
      joint = this.joints[joint.pindex]
      out.pmul(joint.local)
    }

    // Add offset
    out.pmul(this.poseOffset)
      .pmul(this.rootOffset)

    return out
  }
  // #endregion

  // #region DEBUGGING
  debug () {
    const LN = 0x707070
    const PT = 0x505050

    let c
    for (const j of this.joints) {
      Debug.pnt.add(j.world.pos, PT, 0.7)
      for (const i of j.children) {
        c = this.joints[i]
        Debug.ln.add(j.world.pos, c.world.pos, LN)
      }
    }
    return this
  }
  // #endregion
}
