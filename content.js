// Project text and captions: DexMimica-ICRA2027/root.tex.
// Shared layout and behavior: ../../project-website-template/.
// Edit content here, then run node build-index.mjs and node build-index.mjs --check.
// Figure numbers follow the paper; original figure PDFs are retained in assets/.
// The manuscript is anonymized. root.pdf is an unrelated IEEE sample document.

window.PAPER_CONTENT = {
  "schemaVersion": 1,
  "sectionOrder": [
    "teaser",
    "abstract",
    "method",
    "results",
    "generalization"
  ],
  "media": {
    "autoplay": false,
    "pauseOthers": true
  },
  "theme": {
    "accent": "#355E3B",
    "text": "#253243",
    "tintBackground": true,
    "backgroundTintPercent": 0
  },
  "paper": {
    "name": "DexMimica",
    "title": "Mixed-Autonomy Data Collection for Dexterous Manipulation",
    "description": "DexMimica learns task-specific priors from human hand demonstrations and blends a learned tracking controller with online retargeting for robust real-world dexterous teleoperation.",
    "authors": [
      {
        "name": "Anonymous Authors"
      }
    ],
    "affiliations": [],
    "authorNotes": "",
    "links": [
      {
        "label": "arXiv",
        "url": ""
      },
      {
        "label": "Code",
        "url": ""
      }
    ],
    "siteUrl": "https://dexmimica.github.io/",
    "socialImage": "assets/dexmimica-teaser-v2.png",
    "favicon": "assets/favicon.svg"
  },
  "teaser": {
    "title": "Mixed-autonomy dexterous teleoperation",
    "figure": {
      "src": "assets/dexmimica-teaser-v2.png",
      "alt": "DexMimica tasks include mouse scrolling, rope sliding, tape spinning, and Rubik’s cube manipulation, alongside a bimanual robot system and VR hand tracking.",
      "width": 2400,
      "height": 718,
      "captionLabel": "Figure 1.",
      "caption": "We introduce DexMimica, a mixed-autonomy teleoperation framework that learns task-specific priors from human hand demonstrations for real-world dexterous manipulation. Left: Representative tasks requiring coordinated finger roles and precise in-hand motion. Right: Our bimanual hardware system with VR-based hand tracking, where learned task priors are combined with online retargeting to enable robust teleoperation beyond direct retargeting alone."
    }
  },
  "abstract": {
    "title": "Abstract",
    "navTitle": "Abstract",
    "paragraphs": [
      "Acquiring high-quality demonstrations remains a key challenge for learning dexterous manipulation. Direct teleoperation is slow and fragile, while simulation requires heavy engineering and suffers from sim-to-real gaps. Human hand motion offers abundant dexterous behavior, but the embodiment gap prevents it from being used directly as robot data. We present DexMimica, a mixed-autonomy framework that learns task-specific priors from human hand demonstrations to assist real-world teleoperation. Trained on offline-retargeted human trajectories, our hand-tracking controller maps noisy human hand input to structured robot actions, which are blended with online kinematic retargeting for direct operator control. On dexterous bimanual hardware, DexMimica improves teleoperation efficiency and robustness, generalizes across various object visuals and dynamics, and unlocks tasks that are difficult or infeasible with direct retargeting alone."
    ]
  },
  "method": {
    "title": "Method overview",
    "navTitle": "Method",
    "blocks": [
      {
        "figure": {
          "src": "assets/dexmimica-method-v2.png",
          "alt": "Offline human-to-robot trajectory retargeting trains a hand-tracking controller; deployment synchronizes VR hand motion and robot state, then blends policy predictions with online retargeting.",
          "width": 2400,
          "height": 614,
          "captionLabel": "Figure 2. Overview of DexMimica.",
          "caption": "Left: We generate paired human-robot trajectories by offline, trajectory-level retargeting, then sample and perturb temporal human context hₜ to train a hand tracking controller π that predicts robot actions conditioned on both human motion and robot state qₜ. Right: At deployment, live VR hand captures and robot state are synchronized and fed to the learned controller. Its prediction is blended with online kinematic retargeting, and the resulting command is passed to the bimanual controller to produce full-dimensional joint targets for the robot. The system explicitly accounts for sensing, inference, and execution delays during asynchronous hardware control."
        }
      },
      {
        "orderedList": [
          {
            "title": "Offline human-to-robot trajectories",
            "paragraphs": [
              "We jointly optimize complete arm-hand trajectories from human demonstrations using trajectory-level kinematic retargeting. Tracking, temporal smoothness, joint-limit, and collision constraints produce paired human-robot training data without task-specific physics simulation. Spatial and temporal augmentations diversify these trajectories."
            ]
          },
          {
            "title": "A human-conditioned tracking controller",
            "paragraphs": [
              "A diffusion policy predicts chunks of robot actions from recent robot states and a context window of human hand observations. Palm-local finger features, relative wrist motion, and training-time perturbations help the controller recover coordinated, task-specific actions from noisy hand tracking."
            ]
          },
          {
            "title": "Blended control on real hardware",
            "paragraphs": [
              "At deployment, learned action updates are blended with online kinematic retargeting. The learned prior supplies structured finger motions while the operator adjusts for contact and object variation. Inference runs asynchronously, and the bimanual controller executes fresh commands while accounting for sensing, inference, and execution delays."
            ]
          }
        ]
      }
    ]
  },
  "results": {
    "title": "Real-world teleoperation results",
    "navTitle": "Results",
    "blocks": [
      {
        "paragraphs": [
          "We evaluate on two Franka Research 3 arms with two SharpaWave dexterous hands, using a Meta Quest headset for wrist and finger tracking. The tasks require different fingers to stabilize an object while others execute precise motions: mouse scrolling, rope sliding, tape spinning, and two Rubik’s cube layer spins.",
          // "Compared with direct retargeting, DexMimica raises success from 1/10 to 7/10 on Mouse, from 3/10 to 8/10 on Tape, and from 0/10 to 7/10 and 6/10 on the two cube skills. Both methods succeed in 10/10 Rope trials, with mean completion time reduced from 44.9 to 34.9 seconds. Completion times are measured only on successful trials."
        ]
      },
      {
        "title": "Index-finger cube manipulation",
        "videos": [
          {
            "title": "Index-finger spin",
            "caption": "The index finger rotates a cube layer while the remaining fingers stabilize the object.",
            "alt": "A dexterous robot hand maintains a stable grasp on a Rubik’s cube while its index finger turns a layer.",
            "src": "assets/2x-3x1cube-index.mp4",
            "poster": "assets/2x-3x1cube-index.jpg",
            "type": "video/mp4",
            "width": 960,
            "height": 540,
            "playbackRate": 1
          },
          {
            "title": "Index-finger spin on another cube",
            "caption": "The same coordinated finger roles support layer rotation on a different cube instance.",
            "alt": "A robot hand performs an index-finger layer spin on a second Rubik’s cube instance.",
            "src": "assets/2x-4x1cube-index.mp4",
            "poster": "assets/2x-4x1cube-index.jpg",
            "type": "video/mp4",
            "width": 960,
            "height": 540,
            "playbackRate": 1
          }
        ]
      }
    ]
  },
  "generalization": {
    "title": "Generalization across object variations",
    "navTitle": "Generalization",
    "blocks": [
      {
        "layout": "figure-wrap",
        "figureAlign": "left",
        "figure": {
          "src": "assets/dexmimica-qualitative-v2.png",
          "alt": "Index-finger and ring/pinky-finger cube spins are performed across Rubik’s cubes with different colors, shapes, and physical properties.",
          "width": 1600,
          "height": 2240,
          "captionLabel": "Figure 4. Qualitative generalization of learned dexterous behaviors.",
          "caption": "DexMimica executes the same learned in-hand manipulation behaviors across Rubik's cubes with substantially different appearance and dynamics. The motions require coordinated finger roles, with some fingers stabilizing the cube while others perform the spin, and are difficult to execute through direct online retargeting. We demonstrate that the learned task prior captures reusable manipulation structure without object-specific simulation modeling or domain randomization."
        }
      },
      {
        "paragraphs": [
          // "The same learned controller performs cube-layer spins across objects with different appearance and dynamics, without retraining or object-specific adaptation. Some fingers preserve a stable grasp while the index finger or ring/pinky fingers rotate a layer. Online corrections let the operator adapt the learned task prior to real contacts and object variation."
        ]
      }
    ]
  }
};
