// Compute a rotation axis between the first & last
// points of the chain, the apply the twist rotation
// to the first joint of the chain
export class ChainTwistAdditive {
  constructor (chName, rad = 0) {
    this.chainName = chName
    this.angle = rad
  }

  apply (rt) {
    if (this.angle === 0) return

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const ch = rt.tarRig.chains[this.chainName]
    const itm0 = ch[0]
    const itm1 = ch.at(-1)
    const ptran = rt.pose.getWorld(itm0.pidx)
    const ctran = new Transform().fromMul(ptran, rt.pose.joints[itm0.idx].local) // Chain Start Transform
    const etran = rt.pose.getWorld(itm1.idx) // Chain End Transform

    // Debug.pnt.add( ctran.pos, 0xff0000, 2, 0 );
    // Debug.pnt.add( etran.pos, 0xffff00, 2, 0 );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const axis = new Vec3().fromSub(etran.pos, ctran.pos).norm()
    const q = new Quat()
      .fromAxisAngle(axis, this.angle) // Compute WS Rotation
      .mul(ctran.rot) // Apply to joint
      .pmulInvert(ptran.rot) // To LocalSpace

    rt.pose.setRot(itm0.idx, q)
  }
}

// Run 3KJS's GetWorld functions & return as a Transform Object
function getWorld (skel, idx, t = new Transform()) {
  const b = skel.bones[idx]
  const p = b.getWorldPosition(new THREE.Vector3())
  const q = b.getWorldQuaternion(new THREE.Quaternion())

  t.pos[0] = p.x
  t.pos[1] = p.y
  t.pos[2] = p.z

  t.rot[0] = q.x
  t.rot[1] = q.y
  t.rot[2] = q.z
  t.rot[3] = q.w

  // SCALE - Not Needed for this proto
  return t
}

// Make a rotation's invert directions match the target directions
// Create neutral transfroms for each joint as a starting point
// which is the current pose's parent joint worldspace transform applied
// to the local space tpose transform of the joint.
// This gives the transform of the joint as if itself has not change
// but its heirarchy has.
function applySwingTwist (itm, tSwing, tTwist, tpose, pose) {
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Compute Neutral Transform of the joint
  // curentPose.parentJoint.world.rot * tPose.joint.local.rot
  const j = tpose.joints[itm.idx]
  const ptran = pose.getWorld(j.pindex) // Get WS of current pose of parent joint
  const ctran = new Transform().fromMul(ptran, j.local) // Apply to Tpose's locaa for neutral rotation
  const dir = new Vec3()
  const sRot = new Quat()
  const tRot = new Quat()

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // SWING
  dir.fromQuat(ctran.rot, itm.swing) // Get Worldspace direction
  sRot.fromSwing(dir, tSwing) // Compute rot current dir to target dir
    .mul(ctran.rot) // PMul result to neutral rotation

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Twist
  dir.fromQuat(sRot, itm.twist) // Get WS twist direction after swring rotation
  tRot.fromSwing(dir, tTwist) // Compute rot to make twist vectors match
    .mul(sRot) // twist * ( swing * neutral )
    .pmulInvert(ptran.rot) // To Localspace

  return tRot
}
