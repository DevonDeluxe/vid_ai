export interface StoryboardScene {
  id: string;
  index: number;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  timeRangeLabel: string;
  onScreenText: string;
  subText?: string;
  voiceOver: string;
  cameraAngle: string;
  coachAction: string;
  learnerAction: string;
  safetyFocus: string;
  flowPrompt: string;
}

export const TOTAL_DURATION = 25;

export const STORYBOARD_SCENES: StoryboardScene[] = [
  {
    id: "welcome-safety",
    index: 1,
    title: "Welcome & Safety",
    startTime: 0,
    endTime: 5,
    duration: 5,
    timeRangeLabel: "0:00 – 0:05",
    onScreenText: "1. Swim with a grown-up!",
    voiceOver: "Ready, swimming heroes? Always practice with a grown-up!",
    cameraAngle: "Underwater reference framing rising smoothly to water level at the pool steps",
    coachAction: "Stands attentively beside the learner at the shallow pool steps and enters calmly together within arm's reach.",
    learnerAction: "Wears bright yellow swim cap and goggles; transitions from reference underwater angle to stepping calmly into shallow water beside the coach.",
    safetyFocus: "Adult supervision before entering the water; calm entry via shallow pool steps.",
    flowPrompt:
      "3D pixel-art voxel animation in a cheerful indoor swimming school pool with colorful tiled walls, hanging pixel flags, and smiling sea-creature mosaics. Begin underwater with bright turquoise water, dark-blue pool-floor lane markings, a child learner in a bright yellow swim cap and goggles surrounded by sparkling square-shaped voxel bubbles. Smoothly rise to water level at the shallow pool steps where a friendly adult swimming coach stands right beside the child and they enter calmly together.",
  },
  {
    id: "blow-bubbles",
    index: 2,
    title: "Blow Bubbles",
    startTime: 5,
    endTime: 11,
    duration: 6,
    timeRangeLabel: "0:05 – 0:11",
    onScreenText: "2. Blow bubbles",
    voiceOver: "Hold the wall. Breathe in above water. Blow bubbles gently!",
    cameraAngle: "Split water-level close-up showing above-water breathing and underwater square bubbles",
    coachAction: "Stands right beside the learner within arm's reach, watching and encouraging gentle breathing rhythm.",
    learnerAction: "Holds the tiled pool wall with both hands, takes a normal breath above water, gently lowers mouth into the water to blow small square bubbles, then lifts mouth clear of the water.",
    safetyFocus: "Both hands visibly connected to the pool wall; gentle exhalation without breath-holding contests.",
    flowPrompt:
      "Split water-level close-up in colorful 3D pixel-art voxel style. Bright turquoise clear water. The child learner in a bright yellow swim cap and goggles holds the tiled pool wall securely with both hands while the friendly adult swim coach stands beside them within arm's reach. The child takes a normal breath above water, gently lowers their mouth into the water, blows small sparkling square-shaped bubbles, and lifts their mouth clear of the water before taking another breath.",
  },
  {
    id: "little-kicks",
    index: 3,
    title: "Little Kicks",
    startTime: 11,
    endTime: 18,
    duration: 7,
    timeRangeLabel: "0:11 – 0:18",
    onScreenText: "3. Small, gentle kicks",
    voiceOver: "Keep holding on. Make little kicks from your hips. Relax your feet!",
    cameraAngle: "Underwater side view with directional up/down arrows beside the learner's legs",
    coachAction: "Stands beside the learner in the shallow area, gently supporting their torso at water level.",
    learnerAction: "Holds the pool wall with both hands and arms extended comfortably; demonstrates slow, alternating flutter kicks from the hips with relaxed knees and feet.",
    safetyFocus: "Hands remain visibly connected to the wall; adult coach supports torso within arm's reach.",
    flowPrompt:
      "Underwater side view in colorful 3D pixel-art voxel style, bright turquoise swimming pool with lane markings on the floor. The child learner in bright yellow swim cap and goggles holds the pool wall with both hands, arms extended comfortably. The friendly adult swimming coach stands beside them supporting their torso. The child demonstrates slow, small alternating flutter kicks moving from the hips with relaxed knees and feet, accompanied by simple up-and-down arrows beside the legs and sparkling square bubbles.",
  },
  {
    id: "repeat-celebrate",
    index: 4,
    title: "Repeat & Celebrate",
    startTime: 18,
    endTime: 22,
    duration: 4,
    timeRangeLabel: "0:18 – 0:22",
    onScreenText: "Bubbles + little kicks!",
    voiceOver: "Great job! Bubbles and little kicks. You’re learning!",
    cameraAngle: "Medium water-level tracking shot tilting slightly up as pixel stars appear",
    coachAction: "Supports the short combined practice at the wall, then smiles and claps encouragingly as the learner stands.",
    learnerAction: "Practices gentle bubbles with small kicks while holding the wall, then stops, places both feet securely on the shallow pool floor, and smiles at the coach.",
    safetyFocus: "Controlled transition from wall exercise back to standing securely on the shallow pool floor.",
    flowPrompt:
      "3D pixel-art voxel swimming pool in bright turquoise water. The child learner in a yellow swim cap and goggles does one short supported practice of gentle square bubbles and small kicks while holding the pool wall with the adult coach right beside them. The child stops, places their feet flat on the shallow pool floor, and smiles brightly at the coach as decorative golden pixel stars sparkle above the water.",
  },
  {
    id: "safety-end-card",
    index: 5,
    title: "Safety End Card",
    startTime: 22,
    endTime: 25,
    duration: 3,
    timeRangeLabel: "0:22 – 0:25",
    onScreenText: "Practice with a grown-up",
    subText: "A fun reminder—not a substitute for swim lessons.",
    voiceOver: "Keep practicing with your grown-up!",
    cameraAngle: "Eye-level front shot framing the shallow teaching steps",
    coachAction: "Stands beside the learner on the shallow pool steps and waves warmly.",
    learnerAction: "Stands safely on the shallow pool steps beside the coach and waves cheerfully.",
    safetyFocus: "Clear reminder that practice requires adult supervision and formal swim lessons.",
    flowPrompt:
      "Cheerful 3D pixel-art voxel indoor swimming school pool with colorful tiled walls, pixel flags, and smiling sea-creature mosaics. The child learner in a bright yellow swim cap and goggles and the friendly adult swimming coach stand together on the shallow pool steps and wave warmly at the camera.",
  },
];

export const SAFETY_CONSTRAINTS = [
  {
    title: "Adult Coach Within Arm’s Reach",
    detail: "The coach remains directly beside the learner during every step, wall breath, and supported kick.",
  },
  {
    title: "Hands Connected to Pool Wall",
    detail: "During both bubble blowing (5–11s) and flutter kicks (11–20s), both hands stay visibly gripping the pool wall.",
  },
  {
    title: "Readable Biomechanics",
    detail: "Block-shaped voxel limbs articulate clearly at the shoulders, hips, knees, and ankles so children can mirror the slow pace.",
  },
  {
    title: "Strict Water-Safety Boundaries",
    detail: "Zero diving, zero racing, zero breath-holding contests, zero unsupervised swimming, and zero inflatable toys presented as safety gear.",
  },
];
