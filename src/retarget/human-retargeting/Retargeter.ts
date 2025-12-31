import * as THREE from 'three'
import { type Rig } from './Rig'
import { type Pose } from './Pose'
import { type ChainTwistAdditive } from './ChainTwistAdditive'
import Vec3 from './Vec3'
import Quat from './Quat'
import Transform from './Transform'
import { type RigItem } from './RigItem'
import { Joint } from './Joint'

// example and library functions taken from sketchpunklabs
// https://github.com/sketchpunklabs/threejs_proto/blob/main/code/webgl/anim/002_retarget_4m2m.html

export class Retargeter {
  private clip: THREE.AnimationClip | null = null
  private readonly mixer: THREE.AnimationMixer = new THREE.AnimationMixer(new THREE.Object3D())
  private action: THREE.AnimationAction | null = null
  public srcRig: Rig | null = null
  public tarRig: Rig | null = null
  public pose: Pose | null = null
  public readonly additives: ChainTwistAdditive[] = []

  // #region SETTERS
  public setSourceRig (rig: Rig): this {
    this.srcRig = rig
    return this
  }

  public setTargetRig (rig: Rig): this {
    this.tarRig = rig
    return this
  }

  public setClip (clip: THREE.AnimationClip): this {
    this.clip = clip

    if (this.action !== null) {
      this.action.stop() // TODO - Find how to clear out memory instead of just stopping it
      this.action = null
    }

    return this
  }
  // #endregion

  // #region METHODS
  public update (delta_time: number): void {
    if (this.srcRig === null || this.tarRig === null || this.clip === null) {
      console.warn('Retargeter: Missing srcRig, tarRig, or clip.')
      return
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // PREPARE
    if (this.action === null) {
      this.action = this.mixer.clipAction(this.clip, this.srcRig.skel.bones[0])
      this.action.play()
    }

    if (this.pose == null) this.pose = this.tarRig.tpose.clone()

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Run Animation
    this.mixer.update(delta_time)

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Compute vectors from animation source
    // then align target joints to it
    this.applyScaledTranslation('pelvis')
    this.applyChain('pelvis')
    this.applyEndInterp('spine')
    this.applyChain('head')

    this.applyChain('armL')
    this.applyChain('armR')
    this.applyChain('legL')
    this.applyChain('legR')

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Run Addtives
    for (const i of this.additives) {
      i.apply(this)
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Apply working pose to 3JS skeleton for rendering
    this.pose.toSkeleton(this.tarRig.skel)
  }

  // Apply SwingTwist to each joint of a chain, 1 to 1 mappings
  // k = chain key like 'pelvis', 'armL', etc
  applyChain (k: string): void {
    if (this.srcRig === null || this.tarRig === null || this.pose === null) {
      console.warn('Retargeter: Missing srcRig, tarRig, or pose.')
      return
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const src: RigItem[] = this.srcRig.chains[k]
    const tar: RigItem[] = this.tarRig.chains[k]
    if (src === null || tar === null) {
      console.warn('Retargeter: Missing source or target chain for key ', k)
      return
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // const cnt = src.length
    const v: Vec3 = new Vec3()
    const q: Quat = new Quat()

    // const p = new Vec3()
    const sPos: Vec3 = new Vec3()
    const sRot: Quat = new Quat()
    const tRot: Quat = new Quat()
    const rot: Quat = new Quat()

    const sSwing: Vec3 = new Vec3() // Source Swing
    const sTwist: Vec3 = new Vec3() // Source Twist
    const nSwing: Vec3 = new Vec3()
    const nTwist: Vec3 = new Vec3()

    const ptran: Transform = new Transform()
    const ctran: Transform = new Transform()

    let b: THREE.Bone
    let j

    for (let i = 0; i < src.length; i++) {
      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      // Get source swing / twist vectors
      // Pose exists in 3JS skeleton, so need to get its
      // Data through 3JS methods
      b = this.srcRig.skel.bones[src[i].idx]
      b.getWorldPosition(new THREE.Vector3(v[0], v[1], v[2]))
      b.getWorldQuaternion(new THREE.Quaternion(q[0], q[1], q[2], q[3]))
      sPos.copyTo(v)
      sRot.copyTo(q)

      sSwing.fromQuat(sRot, src[i].swing)
      sTwist.fromQuat(sRot, src[i].twist)

      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      // Get Target Neutral Transform for the joint
      // ( neutralTwistDir x targetTwistDir ) * ( neutralSwingDir x targetSwingDir ) * neutralRot
      j = this.tarRig.tpose.joints[tar[i].idx]

      // neutral = currentPose.joint.world * tpose.joint.local
      this.pose.getWorld(j.pindex, ptran) // Current transform of parent joint
      ctran.fromMul(ptran, j.local) // Applied to TPose transform

      // ----------------------------
      // SWING
      nSwing.fromQuat(ctran.rot, tar[i].swing) // Get swing direction
      rot.fromSwing(nSwing, sSwing) // Rotation to match swing directions
        .mul(ctran.rot) // Apply to neutral rotation

      nSwing.fromQuat(rot, tar[i].swing) // For Debugging

      // ----------------------------
      // TWIST
      nTwist.fromQuat(rot, tar[i].twist) // Get twist from swing rotation
      tRot.fromSwing(nTwist, sTwist) // Rotation to match twist vectors
      rot.pmul(tRot) // Apply to swing rotation

      nTwist.fromQuat(rot, tar[i].twist) // For Debugging

      // ----------------------------
      rot.pmulInvert(ptran.rot) // To LocalSpace
      this.pose.setRot(tar[i].idx, rot) // Save to working pose

      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      // Visualize computed target vectors from source animation
      // Debug.pnt.add(sPos, 0xffff00, 1)
      // Debug.ln.add(sPos, p.fromScaleThenAdd(0.1, sSwing, sPos), 0xffff00)
      // Debug.ln.add(sPos, p.fromScaleThenAdd(0.1, sTwist, sPos), 0xff00ff)

      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      // Visualize target vectors over mesh
      // Debug.pnt.add(ctran.pos, 0x00ff00, 1)
      // Debug.ln.add(ctran.pos, p.fromScaleThenAdd(0.15, nSwing, ctran.pos), 0xffff00)
      // Debug.ln.add(ctran.pos, p.fromScaleThenAdd(0.1, nSwing, ctran.pos), 0xffffff)
      // Debug.ln.add(ctran.pos, p.fromScaleThenAdd(0.15, nTwist, ctran.pos), 0xff00ff)
      // Debug.ln.add(ctran.pos, p.fromScaleThenAdd(0.1, nTwist, ctran.pos), 0xff0000)
    }
  }

  // Interp start & end SwingTwist vectors over a chain
  // k = chain key like 'spine', etc
  applyEndInterp (k: string): void {
    if (this.srcRig === null || this.tarRig === null || this.pose === null) {
      console.warn('Retargeter: Missing srcRig, tarRig, or pose.')
      return
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const src: RigItem[] = this.srcRig.chains[k]
    const tar: RigItem[] = this.tarRig.chains[k]
    if (src === null || tar === null) return

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const aTran = this.getWorld(this.srcRig.skel, src[0].idx)
    const aSwing = new Vec3().fromQuat(aTran.rot, src[0].swing)
    const aTwist = new Vec3().fromQuat(aTran.rot, src[0].twist)

    const bTran = this.getWorld(this.srcRig.skel, src[src.length - 1].idx)
    const bSwing = new Vec3().fromQuat(bTran.rot, src[src.length - 1].swing)
    const bTwist = new Vec3().fromQuat(bTran.rot, src[src.length - 1].twist)

    // Visualize data over source skeleton
    // Debug.pnt.add(aTran.pos, 0xffff00, 1.2)
    // Debug.pnt.add(bTran.pos, 0xffff00, 1.2)

    // Debug.ln.add(aTran.pos, vv.fromScaleThenAdd(0.1, aSwing, aTran.pos), 0xffff00)
    // Debug.ln.add(aTran.pos, vv.fromScaleThenAdd(0.1, aTwist, aTran.pos), 0xff00ff)
    // Debug.ln.add(bTran.pos, vv.fromScaleThenAdd(0.1, bSwing, bTran.pos), 0xffff00)
    // Debug.ln.add(bTran.pos, vv.fromScaleThenAdd(0.1, bTwist, bTran.pos), 0xff00ff)

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const target_dir: Vec3 = new Vec3()
    const target_twist: Vec3 = new Vec3()
    const rig_items_count: number = tar.length - 1
    let itm: RigItem
    let t: number // 0-1 lerp factor for chain

    for (let i = 0; i <= rig_items_count; i++) {
      t = i / rig_items_count
      itm = tar[i]

      // Lerp Target Vectors
      target_dir.fromLerp(aSwing, bSwing, t).norm()
      target_twist.fromLerp(aTwist, bTwist, t).norm()

      // Make joint vectors match target vectors
      const rot = this.applySwingTwist(itm, target_dir, target_twist, this.tarRig.tpose, this.pose)
      this.pose.setRot(itm.idx, rot)

      // -----------------------
      const debug_transform: Transform = new Transform() // Debug
      this.pose.getWorld(itm.idx, debug_transform)
      // const vv: Vec3 = new Vec3() // Debug
      // Debug.pnt.add(debug_transform.pos, 0x00ff00, 1, 1)
      // Debug.ln.add(debug_transform.pos, vv.fromQuat(debug_transform.rot, itm.swing).scale(0.1).add(debug_transform.pos), 0xffff00)
      // Debug.ln.add(debug_transform.pos, vv.fromQuat(debug_transform.rot, itm.twist).scale(0.1).add(debug_transform.pos), 0xff00ff)
    }
  }

  // Compute offset translation & scale it to fit better on target
  applyScaledTranslation (k: string): void {
    if (this.srcRig === null || this.tarRig === null || this.pose === null) {
      console.warn('Retargeter: applyScaledTranslation(). Missing srcRig, tarRig, or pose.')
      return
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Make sure we have our src & target
    const src: RigItem = this.srcRig.chains[k][0]
    const tar: RigItem = this.tarRig.chains[k][0]
    if (src === null || tar === null) return

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Compute offset position change from animation
    const scl = this.tarRig.scalar / this.srcRig.scalar // Scale from Src to Tar
    const source_t_pose_joint: Joint = this.srcRig.tpose.joints[src.idx] // TPose Src Joint
    const source_ws_transform: Transform = this.getWorld(this.srcRig.skel, src.idx) // WS Tranform of Src Bone

    // ( animated.joint.world.pos - tpose.joint.world.pos ) * ( tarHipHeight / srcHipHeight )
    const offset: Vec3 = new Vec3()
      .fromSub(source_ws_transform.pos, source_t_pose_joint.world.pos)
      .scale(scl)

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Neutral Transform
    const ptran: Transform = this.pose.getWorld(tar.pidx)
    const ctran: Transform = new Transform().fromMul(ptran, this.tarRig.tpose.joints[tar.idx].local)

    // Add scaled offset translation
    const pos: Vec3 = new Vec3().fromAdd(ctran.pos, offset)

    // Save to local space
    this.pose.setPos(tar.idx, ptran.toLocalPos(pos))
  }
  // #endregion

  // #region THREEJS HELPERS
  // Run 3KJS's GetWorld functions & return as a Transform Object
  public getWorld (skel: THREE.Skeleton, bone_idx: number, trans: Transform = new Transform()): Transform {
    const b: THREE.Bone = skel.bones[bone_idx]
    const p: THREE.Vector3 = b.getWorldPosition(new THREE.Vector3())
    const q: THREE.Quaternion = b.getWorldQuaternion(new THREE.Quaternion())

    trans.pos[0] = p.x
    trans.pos[1] = p.y
    trans.pos[2] = p.z

    trans.rot[0] = q.x
    trans.rot[1] = q.y
    trans.rot[2] = q.z
    trans.rot[3] = q.w

    // SCALE - Not Needed for this proto
    return trans
  }

  // Make a rotation's invert directions match the target directions
  // Create neutral transfroms for each joint as a starting point
  // which is the current pose's parent joint worldspace transform applied
  // to the local space tpose transform of the joint.
  // This gives the transform of the joint as if itself has not change
  // but its heirarchy has.
  public applySwingTwist (itm: RigItem, tSwing: Vec3, tTwist: Vec3, tpose: Pose, pose: Pose): Quat {
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Compute Neutral Transform of the joint
    // curentPose.parentJoint.world.rot * tPose.joint.local.rot
    const j: Joint = tpose.joints[itm.idx]
    const ptran: Transform = pose.getWorld(j.pindex) // Get WS of current pose of parent joint
    const ctran: Transform = new Transform().fromMul(ptran, j.local) // Apply to Tpose's locaa for neutral rotation
    const dir: Vec3 = new Vec3()
    const source_rot: Quat = new Quat()
    const target_rot: Quat = new Quat()

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // SWING
    dir.fromQuat(ctran.rot, itm.swing) // Get Worldspace direction
    source_rot.fromSwing(dir, tSwing) // Compute rot current dir to target dir
      .mul(ctran.rot) // PMul result to neutral rotation

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Twist
    dir.fromQuat(source_rot, itm.twist) // Get WS twist direction after swring rotation
    target_rot.fromSwing(dir, tTwist) // Compute rot to make twist vectors match
      .mul(source_rot) // twist * ( swing * neutral )
      .pmulInvert(ptran.rot) // To Localspace

    return target_rot
  }
  // #endregion
}
