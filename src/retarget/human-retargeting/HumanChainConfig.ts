export class HumanChainConfig {
  // Master list of human bone/joint names that we can use and part of the Mesh2Motion rig
  // this will always be the source config we start with for retargeting
  public static readonly mesh2motion_config: Record<string, string[]> = {
    pelvis: ['DEF-hips'],
    spine: ['DEF-spine001', 'DEF-spine002', 'DEF-spine003'],
    head: ['DEF-neck', 'DEF-head'],
    armL: ['DEF-upper_armL', 'DEF-forearmL', 'DEF-handL'],
    armR: ['DEF-upper_armR', 'DEF-forearmR', 'DEF-handR'],
    legL: ['DEF-thighL', 'DEF-shinL', 'DEF-footL'],
    legR: ['DEF-thighR', 'DEF-shinR', 'DEF-footR'],
    fingersThumbL: ['DEF-thumb01L', 'DEF-thumb02L', 'DEF-thumb03L', 'DEF-thumb04_tipL'],
    fingersThumbR: ['DEF-thumb01R', 'DEF-thumb02R', 'DEF-thumb03R', 'DEF-thumb04_tipR'],
    fingersIndexL: ['DEF-f_index01L', 'DEF-f_index02L', 'DEF-f_index03L', 'DEF-f_index04_tipL'],
    fingersIndexR: ['DEF-f_index01R', 'DEF-f_index02R', 'DEF-f_index03R', 'DEF-f_index04_tipR'],
    fingersMiddleL: ['DEF-f_middle01L', 'DEF-f_middle02L', 'DEF-f_middle03L', 'DEF-f_middle04_tipL'],
    fingersMiddleR: ['DEF-f_middle01R', 'DEF-f_middle02R', 'DEF-f_middle03R', 'DEF-f_middle04_tipR'],
    fingersRingL: ['DEF-f_ring01L', 'DEF-f_ring02L', 'DEF-f_ring03L', 'DEF-f_ring04_tipL'],
    fingersRingR: ['DEF-f_ring01R', 'DEF-f_ring02R', 'DEF-f_ring03R', 'DEF-f_ring04_tipR'],
    fingersPinkyL: ['DEF-f_pinky01L', 'DEF-f_pinky02L', 'DEF-f_pinky03L', 'DEF-f_pinky04_tipL'],
    fingersPinkyR: ['DEF-f_pinky01R', 'DEF-f_pinky02R', 'DEF-f_pinky03R', 'DEF-f_pinky04_tipR']
  }

  public static readonly mixamo_config: Record<string, string[]> = {
    pelvis: ['mixamorigHips'],
    spine: ['mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2'],
    head: ['mixamorigNeck', 'mixamorigHead'],
    armL: ['mixamorigLeftArm', 'mixamorigLeftForeArm', 'mixamorigLeftHand'],
    armR: ['mixamorigRightArm', 'mixamorigRightForeArm', 'mixamorigRightHand'],
    legL: ['mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigLeftFoot'],
    legR: ['mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigRightFoot'],
    fingersThumbL: ['mixamorigLeftHandThumb1', 'mixamorigLeftHandThumb2', 'mixamorigLeftHandThumb3', 'mixamorigLeftHandThumb4'],
    fingersThumbR: ['mixamorigRightHandThumb1', 'mixamorigRightHandThumb2', 'mixamorigRightHandThumb3', 'mixamorigRightHandThumb4'],
    fingersIndexL: ['mixamorigLeftHandIndex1', 'mixamorigLeftHandIndex2', 'mixamorigLeftHandIndex3', 'mixamorigLeftHandIndex4'],
    fingersIndexR: ['mixamorigRightHandIndex1', 'mixamorigRightHandIndex2', 'mixamorigRightHandIndex3', 'mixamorigRightHandIndex4'],
    fingersMiddleL: ['mixamorigLeftHandMiddle1', 'mixamorigLeftHandMiddle2', 'mixamorigLeftHandMiddle3', 'mixamorigLeftHandMiddle4'],
    fingersMiddleR: ['mixamorigRightHandMiddle1', 'mixamorigRightHandMiddle2', 'mixamorigRightHandMiddle3', 'mixamorigRightHandMiddle4'],
    fingersRingL: ['mixamorigLeftHandRing1', 'mixamorigLeftHandRing2', 'mixamorigLeftHandRing3', 'mixamorigLeftHandRing4'],
    fingersRingR: ['mixamorigRightHandRing1', 'mixamorigRightHandRing2', 'mixamorigRightHandRing3', 'mixamorigRightHandRing4'],
    fingersPinkyL: ['mixamorigLeftHandPinky1', 'mixamorigLeftHandPinky2', 'mixamorigLeftHandPinky3', 'mixamorigLeftHandPinky4'],
    fingersPinkyR: ['mixamorigRightHandPinky1', 'mixamorigRightHandPinky2', 'mixamorigRightHandPinky3', 'mixamorigRightHandPinky4']
  }

  // TODO: Have this algorithm work for ALL humanoid rigs, not just Mixamo
  // right now they just use the simple bone mapping...which will have issues with bone roll
  // the retargeting algorithm needs a source config and a target config for it to work
  // this configuration will store the "chains" of joints for both source and target rigs
  // we have all the source joints since that is the Mesh2Motion rigs, but we might not
  // have all the target joints. We will need to effectively clone this "master" config and 
  // modify it to only includes bones that are part of the mapping

  // then we can duplicate that source config to a target config. We can go through the bone
  // mapping and swap out all the source bone names for the target bone names
}
