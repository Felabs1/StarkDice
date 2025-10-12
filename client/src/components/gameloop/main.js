import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
// import { equirectangularPanoramaPixelShader } from "@babylonjs/core/Shaders/equirectangularPanorama.fragment";
// import { Inspector } from "@babylonjs/inspector";
import { createPawn } from "./FUI.js";
import seedrandom from "seedrandom";
import {
  COORDINATES_MAP,
  PLAYERS,
  STEP_LENGTH,
  BASE_POSITIONS,
  HOME_ENTRANCE,
  HOME_POSITIONS,
  SAFE_POSITIONS,
  START_POSITIONS,
  STATE,
  TURNING_POINTS,
} from "./constants.js";
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas);

// thsi

export const createScene = async function () {
  const scene = new BABYLON.Scene(engine);
  // scene.createDefaultCameraOrLight(true, false, true);

  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    0,
    0.8,
    1.5,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(true);
  camera.lowerBetaLimit = Math.PI / 4;
  camera.upperBetaLimit = Math.PI / 3;
  const ground = new BABYLON.MeshBuilder.CreateGround("", { subdivisions: 15 });
  const board = new BABYLON.MeshBuilder.CreateBox(
    "ground",
    {
      width: 1, // Width of the ground
      height: 0.019, // Very short height (depth), making it effectively a flat surface
      depth: 1, // Depth of the ground
      subdivisions: 15,
    },
    scene
  );
  board.position.y = -0.01;
  const deepBrownMat = new BABYLON.StandardMaterial("deepBrownMat", scene);
  deepBrownMat.diffuseColor = new BABYLON.Color3(0.76, 0.6, 0.42);
  board.material = deepBrownMat;

  // Position the board slightly below the origin if it's not already positioned
  board.position.y = -0.01;
  const groundCatMat = new BABYLON.StandardMaterial();
  const diceBox = new BABYLON.MeshBuilder.CreateBox(
    "myBox",
    { size: 0.07 },
    scene
  );

  let light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.85;

  const diceBoxCatMat = new BABYLON.StandardMaterial();
  diceBoxCatMat.diffuseTexture = new BABYLON.Texture("/dicedesign.png");
  diceBox.material = diceBoxCatMat;
  ground.material = groundCatMat;
  // groundCatMat.emmisiveTexture = new BABYLON.Texture("/ground1.jpeg");
  groundCatMat.diffuseTexture = new BABYLON.Texture("/canvas_image.png");
  // ground.material.wireframe = true;

  // blue pawns (player 1)

  // const blueCatMat = new BABYLON.StandardMaterial();
  const blue1 = createPawn("P1_0", "blue", 500);
  const blue2 = createPawn("P1_1", "blue", 501);
  const blue3 = createPawn("P1_2", "blue", 502);
  const blue4 = createPawn("P1_3", "blue", 503);

  const green1 = createPawn("P2_0", "green", 600);
  const green2 = createPawn("P2_1", "green", 601);
  const green3 = createPawn("P2_2", "green", 602);
  const green4 = createPawn("P2_3", "green", 603);

  const loadModels = async (modelName) => {
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "/models/",
        modelName
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const { meshes: diceMeshes } = await loadModels("dice.glb");
  // let diceArray = [Face1, Face2, Face3, Face4, Face5, Face6];
  diceMeshes.forEach((mesh) => {
    mesh.unfreezeWorldMatrix();
    mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    mesh.computeWorldMatrix(true);

    // if (diceArray.includes(mesh.name)) {
    // }
  });

  let dice = diceMeshes
    .find((mesh) => mesh.name === "__root__")
    ?.unfreezeWorldMatrix();
  dice.position.y = 1.3;
  dice.unfreezeWorldMatrix();
  dice.isPickable = true;
  dice.scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
  dice.position = new BABYLON.Vector3(0.0, 0.1, -0.01);

  dice.actionManager = new BABYLON.ActionManager(scene);
  dice.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPickTrigger,
      function (evt) {
        // Event code here
        console.log("Dice clicked!", evt);
        // Add any additional actions you want to take when the dice is clicked
      }
    )
  );

  // console.log(diceMeshes);

  function snapDiceToFace(dice, face) {
    switch (face) {
      case "Face1":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, 0, 0);
        break;
      case "Face3":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          -Math.PI / 2,
          0,
          0
        );
        break;
      case "Face2":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          Math.PI / 2,
          0,
          0
        );
        break;
      case "Face4":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          Math.PI,
          0,
          0
        );
        break;
      case "Face5":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          0,
          0,
          Math.PI / 2
        );
        break;
      case "Face6":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          0,
          0,
          -Math.PI / 2
        );
        break;
    }
  }

  class CustomMesh {
    constructor(scene, diffuseColor, emmissiveColor, blinkAnimationColor) {
      let material = new BABYLON.StandardMaterial("material", scene);
      material.emissiveColor = emmissiveColor;
      material.diffuseColor = diffuseColor;
      material.specularColor = new BABYLON.Color3(0, 0, 0);
      this.blinkAnimationColor = blinkAnimationColor;

      material.backFaceCulling = false;

      let customMesh = new BABYLON.Mesh("custom", scene);
      customMesh.material = material;

      this.customMesh = customMesh;
      this.positions = [];
      this.indices = [];
      this.idx = 0;
    }

    addVertex(vector) {
      this.positions.push(vector.x, vector.y, vector.z);
      return this.idx++;
    }

    addFace(v1, v2, v3) {
      this.indices.push(v1, v2, v3);
    }

    updateMesh() {
      let vertexData = new BABYLON.VertexData();
      vertexData.positions = this.positions;
      vertexData.indices = this.indices;
      vertexData.applyToMesh(this.customMesh, true);
      this.createGlowAnimation();
    }

    createGlowAnimation() {
      let animation = new BABYLON.Animation(
        "glowAnimation",
        "material.emissiveColor",
        60,
        BABYLON.Animation.ANIMATIONTYPE_COLOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      let keys = [
        { frame: 0, value: new BABYLON.Color3(0, 0, 0) },
        { frame: 25, value: this.blinkAnimationColor }, // Use dynamic color
        { frame: 50, value: new BABYLON.Color3(0, 0, 0) },
      ];

      animation.setKeys(keys);
      this.customMesh.animations = [animation]; // Attach the animation but do not start
    }

    startAnimation() {
      scene.beginDirectAnimation(
        this.customMesh,
        [this.customMesh.animations[0]],
        0,
        50,
        true
      );
    }

    stopAnimation() {
      scene.stopAnimation(this.customMesh);
    }
  }

  let blinkAnimationColor = new BABYLON.Color3(1, 0, 0);
  let emmissiveColor = new BABYLON.Color3(0, 0, 0);
  let meshDiffuseColor = new BABYLON.Color3(0.5, 0.1, 0.1);
  let mesh = new CustomMesh(
    scene,
    meshDiffuseColor,
    emmissiveColor,
    blinkAnimationColor
  );

  // Define vertices for the outer and inner squares
  let p0 = mesh.addVertex(new BABYLON.Vector3(-2, 2, 0)); // Outer top left
  let p1 = mesh.addVertex(new BABYLON.Vector3(2, 2, 0)); // Outer top right
  let p2 = mesh.addVertex(new BABYLON.Vector3(2, -2, 0)); // Outer bottom right
  let p3 = mesh.addVertex(new BABYLON.Vector3(-2, -2, 0)); // Outer bottom left

  // Adjust these for a larger inner square
  let p4 = mesh.addVertex(new BABYLON.Vector3(-1.25, 1.25, 0)); // Inner top left
  let p5 = mesh.addVertex(new BABYLON.Vector3(1.25, 1.25, 0)); // Inner top right
  let p6 = mesh.addVertex(new BABYLON.Vector3(1.25, -1.25, 0)); // Inner bottom right
  let p7 = mesh.addVertex(new BABYLON.Vector3(-1.25, -1.25, 0)); // Inner bottom left

  // Add faces for both the outer boundary and the hole
  mesh.addFace(p0, p1, p4);
  mesh.addFace(p1, p5, p4);
  mesh.addFace(p1, p2, p5);
  mesh.addFace(p2, p6, p5);
  mesh.addFace(p2, p3, p6);
  mesh.addFace(p3, p7, p6);
  mesh.addFace(p3, p0, p7);
  mesh.addFace(p0, p4, p7);

  mesh.customMesh.position.x = -0.3; // Set position
  mesh.customMesh.position.z = 0.3;
  mesh.customMesh.position.y = 0.001;

  mesh.customMesh.rotation.x = Math.PI / 2;
  mesh.customMesh.scaling.set(0.1, 0.1, 0.1); // Set scaling

  mesh.updateMesh();

  // mesh.startAnimation();

  //mesh.stopAnimation();

  let blinkAnimationColorGreen = new BABYLON.Color3(0, 0.5, 0);
  let emmissiveGreenColor = new BABYLON.Color3(0, 0.5, 0);
  let meshGreenDiffuseColor = new BABYLON.Color3(0, 0.7, 0);
  let meshGreen = new CustomMesh(
    scene,
    meshGreenDiffuseColor,
    emmissiveGreenColor,
    blinkAnimationColorGreen
  );

  // Define vertices for the outer and inner squares
  let p0Green = meshGreen.addVertex(new BABYLON.Vector3(-2, 2, 0)); // Outer top left
  let p1Green = meshGreen.addVertex(new BABYLON.Vector3(2, 2, 0)); // Outer top right
  let p2Green = meshGreen.addVertex(new BABYLON.Vector3(2, -2, 0)); // Outer bottom right
  let p3Green = meshGreen.addVertex(new BABYLON.Vector3(-2, -2, 0)); // Outer bottom left

  // Adjust these for a larger inner square
  let p4Green = meshGreen.addVertex(new BABYLON.Vector3(-1.25, 1.25, 0)); // Inner top left
  let p5Green = meshGreen.addVertex(new BABYLON.Vector3(1.25, 1.25, 0)); // Inner top right
  let p6Green = meshGreen.addVertex(new BABYLON.Vector3(1.25, -1.25, 0)); // Inner bottom right
  let p7Green = meshGreen.addVertex(new BABYLON.Vector3(-1.25, -1.25, 0)); // Inner bottom left

  // Add faces for both the outer boundary and the hole
  meshGreen.addFace(p0Green, p1Green, p4Green);
  meshGreen.addFace(p1Green, p5Green, p4Green);
  meshGreen.addFace(p1Green, p2Green, p5Green);
  meshGreen.addFace(p2Green, p6Green, p5Green);
  meshGreen.addFace(p2Green, p3Green, p6Green);
  meshGreen.addFace(p3Green, p7Green, p6Green);
  meshGreen.addFace(p3Green, p0Green, p7Green);
  meshGreen.addFace(p0Green, p4Green, p7Green);

  meshGreen.customMesh.position.x = 0.3; // Set position
  meshGreen.customMesh.position.z = 0.3;
  meshGreen.customMesh.position.y = 0.001;

  meshGreen.customMesh.rotation.x = Math.PI / 2;
  meshGreen.customMesh.scaling.set(0.1, 0.1, 0.1); // Set scaling

  meshGreen.updateMesh();

  // meshGreen.startAnimation();
  //meshGreen.stopAnimation();

  let blinkAnimationColorYellow = new BABYLON.Color3(1, 1, 0); // Yellow for animation blink
  let emissiveYellowColor = new BABYLON.Color3(1, 1, 0); // Emissive yellow color
  let meshYellowDiffuseColor = new BABYLON.Color3(1, 1, 0); // Diffuse color of the mesh as yellow
  let meshYellow = new CustomMesh(
    scene,
    meshYellowDiffuseColor,
    emissiveYellowColor,
    blinkAnimationColorYellow
  );

  // Define vertices for the outer and inner squares
  let p0Yellow = meshYellow.addVertex(new BABYLON.Vector3(-2, 2, 0)); // Outer top left
  let p1Yellow = meshYellow.addVertex(new BABYLON.Vector3(2, 2, 0)); // Outer top right
  let p2Yellow = meshYellow.addVertex(new BABYLON.Vector3(2, -2, 0)); // Outer bottom right
  let p3Yellow = meshYellow.addVertex(new BABYLON.Vector3(-2, -2, 0)); // Outer bottom left

  // Adjust these for a larger inner square
  let p4Yellow = meshYellow.addVertex(new BABYLON.Vector3(-1.25, 1.25, 0)); // Inner top left
  let p5Yellow = meshYellow.addVertex(new BABYLON.Vector3(1.25, 1.25, 0)); // Inner top right
  let p6Yellow = meshYellow.addVertex(new BABYLON.Vector3(1.25, -1.25, 0)); // Inner bottom right
  let p7Yellow = meshYellow.addVertex(new BABYLON.Vector3(-1.25, -1.25, 0)); // Inner bottom left

  // Add faces for both the outer boundary and the hole
  meshYellow.addFace(p0Yellow, p1Yellow, p4Yellow);
  meshYellow.addFace(p1Yellow, p5Yellow, p4Yellow);
  meshYellow.addFace(p1Yellow, p2Yellow, p5Yellow);
  meshYellow.addFace(p2Yellow, p6Yellow, p5Yellow);
  meshYellow.addFace(p2Yellow, p3Yellow, p6Yellow);
  meshYellow.addFace(p3Yellow, p7Yellow, p6Yellow);
  meshYellow.addFace(p3Yellow, p0Yellow, p7Yellow);
  meshYellow.addFace(p0Yellow, p4Yellow, p7Yellow);

  meshYellow.customMesh.position.x = 0.3; // Set position
  meshYellow.customMesh.position.z = -0.3;
  meshYellow.customMesh.position.y = 0.001;

  meshYellow.customMesh.rotation.x = Math.PI / 2;
  meshYellow.customMesh.scaling.set(0.1, 0.1, 0.1); // Set scaling

  meshYellow.updateMesh();

  //meshYellow.startAnimation()
  //meshYellow.stopAnimation();

  let blinkAnimationColorBlue = new BABYLON.Color3(0, 0.5, 1); // Blue for animation blink
  let emissiveBlueColor = new BABYLON.Color3(0, 0, 1); // Emissive blue color
  let meshBlueDiffuseColor = new BABYLON.Color3(0, 0, 1); // Diffuse color of the mesh as blue
  let meshBlue = new CustomMesh(
    scene,
    meshBlueDiffuseColor,
    emissiveBlueColor,
    blinkAnimationColorBlue
  );

  // Define vertices for the outer and inner squares
  let p0Blue = meshBlue.addVertex(new BABYLON.Vector3(-2, 2, 0)); // Outer top left
  let p1Blue = meshBlue.addVertex(new BABYLON.Vector3(2, 2, 0)); // Outer top right
  let p2Blue = meshBlue.addVertex(new BABYLON.Vector3(2, -2, 0)); // Outer bottom right
  let p3Blue = meshBlue.addVertex(new BABYLON.Vector3(-2, -2, 0)); // Outer bottom left

  // Adjust these for a larger inner square
  let p4Blue = meshBlue.addVertex(new BABYLON.Vector3(-1.25, 1.25, 0)); // Inner top left
  let p5Blue = meshBlue.addVertex(new BABYLON.Vector3(1.25, 1.25, 0)); // Inner top right
  let p6Blue = meshBlue.addVertex(new BABYLON.Vector3(1.25, -1.25, 0)); // Inner bottom right
  let p7Blue = meshBlue.addVertex(new BABYLON.Vector3(-1.25, -1.25, 0)); // Inner bottom left

  // Add faces for both the outer boundary and the hole
  meshBlue.addFace(p0Blue, p1Blue, p4Blue);
  meshBlue.addFace(p1Blue, p5Blue, p4Blue);
  meshBlue.addFace(p1Blue, p2Blue, p5Blue);
  meshBlue.addFace(p2Blue, p6Blue, p5Blue);
  meshBlue.addFace(p2Blue, p3Blue, p6Blue);
  meshBlue.addFace(p3Blue, p7Blue, p6Blue);
  meshBlue.addFace(p3Blue, p0Blue, p7Blue);
  meshBlue.addFace(p0Blue, p4Blue, p7Blue);

  meshBlue.customMesh.position.x = -0.3; // Set position
  meshBlue.customMesh.position.z = -0.3;
  meshBlue.customMesh.position.y = 0.001;

  meshBlue.customMesh.rotation.x = Math.PI / 2;
  meshBlue.customMesh.scaling.set(0.1, 0.1, 0.1); // Set scaling

  meshBlue.updateMesh();

  // meshBlue.startAnimation();
  //meshBlue.stopAnimation();

  function createHopAnimation(mesh) {
    const hopAnimation = new BABYLON.Animation(
      "hopAnimation",
      "position.y",
      60, // Frame rate
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT // Changed to play only once
    );

    const baseY = mesh.position.y;
    const peakHeight = 1; // Height of the hop

    const keyFrames = [
      { frame: 0, value: baseY },
      { frame: 10, value: baseY + peakHeight }, // Faster ascent to peak
      { frame: 20, value: baseY }, // Slower descent to ground
    ];

    hopAnimation.setKeys(keyFrames);

    return hopAnimation;
  }

  const pieceHopAnimation = (mesh) => {
    const hopAnimation = createHopAnimation(mesh);
    mesh.animations = [hopAnimation];

    // Apply an easing function to simulate natural motion
    const easingFunction = new BABYLON.CircleEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    hopAnimation.setEasingFunction(easingFunction);

    // Start the animation
    scene.beginAnimation(mesh, 0, 2, false);
  };

  const torusMap = new Map();

  function createHighlightRing(piece) {
    const radius = piece.scaling.x; // Assuming the x scaling represents the radius of the disc
    const torusDiameter = radius * 0.06; // Slightly larger than the disc diameter
    const torusThickness = radius * 0.003; // Thickness proportional to the radius

    const torus = BABYLON.MeshBuilder.CreateTorus(
      "torus",
      {
        diameter: torusDiameter,
        thickness: torusThickness,
        tessellation: 60,
      },
      scene
    );

    torus.position = piece.position.clone();
    torus.position.y = piece.position.y; // Position slightly above the disc
    return torus;
  }

  function applyDottedMaterial(torus, scene, customColor) {
    const material = new BABYLON.StandardMaterial("dotMaterial", scene);

    console.log(customColor);

    material.diffuseColor = customColor; // Set the mixed color as the diffuse color
    material.emissiveColor = customColor; // Set the same mixed color as emissive to make it glow slightly
    material.diffuseTexture = new BABYLON.Texture("textures/dotted.png", scene); // Ensure you have the texture
    material.diffuseTexture.hasAlpha = true;
    material.useAlphaFromDiffuseTexture = true;

    torus.material = material;
  }

  function rotateTorus(torus) {
    scene.onBeforeRenderObservable.add(() => {
      torus.rotation.y += 0.05; // Adjust rotation speed as necessary
    });
  }

  function highlightPieceAnimation(piece) {
    const torus = createHighlightRing(piece, scene);
    torusMap.set(piece, torus);
    const pieceColor = piece.material.diffuseColor;
    // Apply material to the torus with the piece's color
    applyDottedMaterial(torus, scene, pieceColor);
    rotateTorus(torus, scene);
  }

  function unhighlightPiecesAnimation() {
    // Iterate over all torus meshes in the map and dispose of them
    torusMap.forEach((torus, piece) => {
      torus.dispose(); // Remove the torus from the scene
    });

    // Clear the map after disposing of all torus meshes
    torusMap.clear();
  }

  const OFFSET_DISTANCE = -0.02;

  const positionMap = new Map();

  const generateRandomSeed = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  };

  const combineSeeds = (userSeed, additionalEntropy) => {
    const combinedSeed = `${userSeed}-${additionalEntropy}`;
    return combinedSeed;
  };

  const rollDice = async (dice, userSeed = null) => {
    return new Promise((resolve) => {
      // Use the user-provided seed if available, otherwise generate a new one
      const seed = userSeed || generateRandomSeed();

      // Create an animation for rolling the dice
      const frameRate = 60; // Increased frame rate for smoother animation
      const rollDuration = 60; // Longer duration for a more vigorous roll
      const rollAnim = new BABYLON.Animation(
        "rollAnim",
        "rotation",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      // Use the user-provided seed if available, otherwise generate a new one
      const baseSeed = userSeed || generateRandomSeed();
      const additionalEntropy = Date.now(); // Current timestamp as additional entropy
      const combinedSeed = combineSeeds(baseSeed, additionalEntropy);
      const random = seedrandom(combinedSeed); // Use the combined seed for randomness

      const keys = [];
      keys.push({
        frame: 0,
        value: dice.rotation.clone(),
      });
      keys.push({
        frame: rollDuration,
        value: new BABYLON.Vector3(
          dice.rotation.x + (random() * Math.PI * 12 + Math.PI * 6), // More rotations
          dice.rotation.y + (random() * Math.PI * 12 + Math.PI * 6), // More rotations
          dice.rotation.z + (random() * Math.PI * 12 + Math.PI * 6) // More rotations
        ),
      });

      rollAnim.setKeys(keys);

      // Apply the animation to the dice
      dice.animations = [];
      dice.animations.push(rollAnim);

      // Run the animation
      scene.beginAnimation(dice, 0, rollDuration, false, 2, () => {
        // After the animation completes, determine the side facing up
        let highestFace = null;
        let highestY = -Infinity;

        // Iterate through the named faces to find the one facing up
        dice.getChildMeshes().forEach((face) => {
          if (face.name.startsWith("Face")) {
            const position = face.getAbsolutePosition();
            if (position.y > highestY) {
              highestY = position.y;
              highestFace = face;
            }
          }
        });

        console.log(highestFace.name);

        snapDiceToFace(dice, highestFace.name);

        resolve({ face: highestFace.name, seed }); // Resolve with the name of the face representing the top face and the seed
      });
    });
  };

  return {
    scene,
    green1,
    green2,
    green3,
    green4,
    blue1,
    blue2,
    blue3,
    blue4,
    diceBox,
    diceMeshes,
    dice,
    meshBlue,
    meshGreen,
    rollDice,
    pieceHopAnimation,
    highlightPieceAnimation,
    unhighlightPiecesAnimation,
    positionMap,
    OFFSET_DISTANCE,
  };
};

const sceneData = await createScene();
const {
  scene,
  green1,
  green2,
  green3,
  green4,
  blue1,
  blue2,
  blue3,
  blue4,
  diceBox,
  diceMeshes,
  meshBlue,
  meshGreen,
  dice,
  rollDice,
  pieceHopAnimation,
  highlightPieceAnimation,
  unhighlightPiecesAnimation,
  positionMap,
  OFFSET_DISTANCE,
} = sceneData;

// meshBlue.startAnimation();
// meshGreen.startAnimation();

console.log(diceMeshes);
// dice.actionManager = new BABYLON.ActionManager(scene);
// dice.actionManager.registerAction(
//   new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function (
//     evt
//   ) {
//     console.log("I have been clicked");
//   })
// );

console.log(dice);

const playerPiecesElements = {
  P1: [blue1, blue2, blue3, blue4],
  P2: [green1, green2, green3, green4],
};

// blue1.isPickable = false;

// blue1.actionManager = new BABYLON.ActionManager(scene);
// blue1.actionManager.registerAction(
//   new BABYLON.ExecuteCodeAction(
//     BABYLON.ActionManager.OnPickTrigger,
//     function () {
//       sayhello();
//     }
//   )
// );

function sayhello() {
  console.log("hello");
}

class UI {
  static listenDiceClick(callback) {
    scene.onPointerDown = async function (evt, pickResult) {
      // let diceMeshes = meshes;
      if (pickResult.hit && diceMeshes.includes(pickResult.pickedMesh)) {
        const userSeed = Math.floor(Math.random() * 1000);
        const result = await rollDice(dice, userSeed);
        console.log("Top face:", result);
        console.log(pickResult.pickedMesh);
        console.log(dice);
        callback(result);
      }
    };
    // diceBox.actionManager = new BABYLON.ActionManager(scene);
    // diceBox.actionManager.registerAction(
    //   new BABYLON.ExecuteCodeAction(
    //     BABYLON.ActionManager.OnPickTrigger,
    //     function () {
    //       callback();
    //     }
    //   )
    // );
  }

  static generateRandomSeed() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  }

  static combineSeeds(userSeed, additionalEntropy) {
    const combinedSeed = `${userSeed}-${additionalEntropy}`;
    return combinedSeed;
  }

  static snapDiceToFace(dice, face) {
    switch (face) {
      case "Face1":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, 0, 0);
        break;
      case "Face3":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          -Math.PI / 2,
          0,
          0
        );
        break;
      case "Face2":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          Math.PI / 2,
          0,
          0
        );
        break;
      case "Face4":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          Math.PI,
          0,
          0
        );
        break;
      case "Face5":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          0,
          0,
          Math.PI / 2
        );
        break;
      case "Face6":
        dice.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          0,
          0,
          -Math.PI / 2
        );
        break;
    }
  }

  static async rollDice(dice, userSeed = null) {
    return new Promise((resolve) => {
      // Use the user-provided seed if available, otherwise generate a new one
      const seed = 128; //userSeed || generateRandomSeed();

      // Create an animation for rolling the dice
      const frameRate = 60; // Increased frame rate for smoother animation
      const rollDuration = 4 * frameRate; // Longer duration for a more vigorous roll
      const rollAnim = new BABYLON.Animation(
        "rollAnim",
        "rotation",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      // Use the user-provided seed if available, otherwise generate a new one
      const baseSeed = userSeed || generateRandomSeed();
      const additionalEntropy = Date.now(); // Current timestamp as additional entropy
      const combinedSeed = combineSeeds(baseSeed, additionalEntropy);
      const random = seedrandom(combinedSeed); // Use the combined seed for randomness

      const keys = [];
      keys.push({
        frame: 0,
        value: dice.rotation.clone(),
      });
      keys.push({
        frame: rollDuration,
        value: new BABYLON.Vector3(
          dice.rotation.x + (random() * Math.PI * 12 + Math.PI * 6), // More rotations
          dice.rotation.y + (random() * Math.PI * 12 + Math.PI * 6), // More rotations
          dice.rotation.z + (random() * Math.PI * 12 + Math.PI * 6) // More rotations
        ),
      });

      rollAnim.setKeys(keys);

      // Apply the animation to the dice
      dice.animations = [];
      dice.animations.push(rollAnim);

      // Run the animation
      scene.beginAnimation(dice, 0, rollDuration, false, 2, () => {
        // After the animation completes, determine the side facing up
        let highestFace = null;
        let highestY = -Infinity;

        // Iterate through the named faces to find the one facing up
        dice.getChildMeshes().forEach((face) => {
          if (face.name.startsWith("Face")) {
            const position = face.getAbsolutePosition();
            if (position.y > highestY) {
              highestY = position.y;
              highestFace = face;
            }
          }
        });

        console.log(highestFace.name);

        snapDiceToFace(dice, highestFace.name);

        resolve({ face: highestFace.name, seed }); // Resolve with the name of the face representing the top face and the seed
      });
    });
  }

  static listenResetClick(callback) {}

  static listenPieceClick(callback) {
    const allPieces = Object.values(playerPiecesElements).reduce(
      (acc, curr) => acc.concat(curr),
      []
    );
    allPieces.forEach((object) => {
      object.actionManager = new BABYLON.ActionManager(scene);
      object.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          function () {
            callback(object);
          }
        )
      );
    });
  }

  static setPiecePosition(player, piece, newPosition) {
    if (!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
      console.error(
        `Player element of given player: ${player} and piece: ${piece} not found`
      );
      return;
    }

    const [x, z] = COORDINATES_MAP[newPosition];
    const pieceElement = playerPiecesElements[player][piece];

    const rememberY = pieceElement.position.y;

    pieceHopAnimation(pieceElement);

    // Generate a key for the new position
    const newPosKey = `${x}_${z}`;

    // Remove the piece from the previous position in the map
    for (let [posKey, pieces] of positionMap.entries()) {
      const index = pieces.indexOf(pieceElement);
      if (index > -1) {
        pieces.splice(index, 1);
        if (pieces.length === 0) {
          positionMap.delete(posKey);
        }
        break;
      }
    }

    // Add the piece to the new position in the map
    if (!positionMap.has(newPosKey)) {
      positionMap.set(newPosKey, []);
    }
    positionMap.get(newPosKey).push(pieceElement);

    // Check for overlapping pieces and apply offsets
    const overlapCount = positionMap.get(newPosKey).length - 1;
    const offsetX =
      overlapCount *
      OFFSET_DISTANCE *
      Math.cos((overlapCount * 2 * Math.PI) / 4);
    const offsetZ =
      overlapCount *
      OFFSET_DISTANCE *
      Math.sin((overlapCount * 2 * Math.PI) / 4);

    // Update the piece's position with the offset
    pieceElement.position.x = x + offsetX;
    pieceElement.position.z = z + offsetZ;
    pieceElement.position.y = rememberY;
  }

  static setTurn(index) {
    if (index < 0 || index >= PLAYERS.length) {
      console.error("index out of bound!");
      return;
    }
    const player = PLAYERS[index];

    // display player id
    console.log("player turn: " + player);

    if (player === "P1") {
      meshBlue.startAnimation();
      meshGreen.stopAnimation();
    } else {
      meshGreen.startAnimation();
      meshBlue.stopAnimation();
    }

    // animation of the active player base to be done here

    // highlight of the active player base to be done here
  }

  static enableDice() {
    dice.state = "";
    // dice.isPickable = true;
    // console.log(dice);

    diceMeshes.forEach((dice) => {
      dice.isPickable = true;
    });
  }

  static disableDice() {
    dice.state = "disabled";
    // dice.isPickable = false;

    diceMeshes.forEach((dice) => {
      dice.isPickable = false;
    });
  }

  static highlightPieces(player, pieces) {
    // Check if there are pieces to highlight
    if (!pieces.length) {
      return;
    }
    console.log(pieces);
    console.log(player);

    pieces.forEach((piece) => {
      const pieceElement = playerPiecesElements[player][piece];

      highlightPieceAnimation(pieceElement);

      // Set the material for highlighting
      const material = new BABYLON.StandardMaterial("highlightMat", scene);
      material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Grey color
      pieceElement.material = material;
      pieceElement.isPickable = true;
    });
  }

  static unhighlightPieces() {
    // we are going to make an animation to unhighlight the pieces not playing
    const allPieces = Object.values(playerPiecesElements).reduce(
      (acc, curr) => acc.concat(curr),
      []
    );
    unhighlightPiecesAnimation();
    allPieces.forEach((object) => {
      const str = object.id;
      const material = new BABYLON.StandardMaterial();
      object.material = material;
      object.isPickable = false;
      if (str.includes("P1")) {
        material.diffuseColor = new BABYLON.Color3(0.35, 0.35, 1);
      } else {
        material.diffuseColor = new BABYLON.Color3(0.35, 1, 0.35);
      }
    });
  }

  static setDiceValue(value) {
    // we are going to set dice value and update it to the screen
    console.log("diceValue: " + value);
  }
}

// UI.setPiecePosition("P1", 0, 24);
// UI.setTurn(0);
// UI.setTurn(1);

// OTHER FUNCTOINS THAT ADD MORE INTERACTIVITY TO THE APP HAVE NOT YET BEEN IMPLEMENTED WE SHALL LOOK AT THEM FULLY

// UI.disableDice();
// UI.enableDice();
// UI.highlightPieces('P1', [0]);
// UI.unhighlightPieces();
// UI.setDiceValue(5);

class Ludo {
  currentPositions = {
    P1: [],
    P2: [],
  };

  _diceValue;
  get diceValue() {
    return this._diceValue;
  }
  set diceValue(value) {
    this._diceValue = value;

    UI.setDiceValue(value);
  }

  _turn;
  get turn() {
    return this._turn;
  }
  set turn(value) {
    this._turn = value;
    UI.setTurn(value);
  }

  _state;
  get state() {
    return this._state;
  }

  set state(value) {
    this._state = value;

    if (value === STATE.DICE_NOT_ROLLED) {
      UI.enableDice();
      UI.unhighlightPieces();
    } else {
      UI.disableDice();
    }
  }

  constructor() {
    console.log("Hello World! Lets play Ludo!");

    // this.diceValue = 5;
    // this.turn = 0;
    // this.state = STATE.DICE_NOT_ROLLED;
    this.listenDiceClick();
    this.listenResetClick();
    this.listenPieceClick();

    this.resetGame();
    // this.setPiecePosition("P1", 0, 0);
    // this.setPiecePosition("P2", 0, 1);

    // this.setPiecePosition('P2', 0, 1);
    // this.diceValue = 6;
    // console.log(this.diceValue);
    // this.checkForEligiblePieces();
    // console.log(this.getEligiblePieces("P1"));
  }

  listenDiceClick() {
    UI.listenDiceClick(this.onDiceClick.bind(this));
  }

  onDiceClick(value) {
    console.log("dice clicked!");

    console.log(value.face[4]);
    this.diceValue = Number(value.face[4]); //1 + Math.floor(Math.random() * 6);
    this.state = STATE.DICE_ROLLED;

    this.checkForEligiblePieces();
  }

  checkForEligiblePieces() {
    const player = PLAYERS[this.turn];
    // eligible pieces of given player
    const eligiblePieces = this.getEligiblePieces(player);

    if (eligiblePieces.length) {
      // highlight the pieces
      UI.highlightPieces(player, eligiblePieces);
      console.log(eligiblePieces);
    } else {
      this.incrementTurn();
    }
  }

  incrementTurn() {
    this.turn = this.turn === 0 ? 1 : 0;
    this.state = STATE.DICE_NOT_ROLLED;
  }

  getEligiblePieces(player) {
    return [0, 1, 2, 3].filter((piece) => {
      const currentPosition = this.currentPositions[player][piece];

      if (currentPosition === HOME_POSITIONS[player]) {
        return false;
      }

      if (
        BASE_POSITIONS[player].includes(currentPosition) &&
        this.diceValue !== 6
      ) {
        return false;
      }

      if (
        HOME_ENTRANCE[player].includes(currentPosition) &&
        this.diceValue > HOME_POSITIONS[player] - currentPosition
      ) {
        return false;
      }

      return true;
    });
  }

  listenResetClick() {
    UI.listenResetClick(this.resetGame.bind(this));
  }

  resetGame() {
    console.log("reset game");
    this.currentPositions = structuredClone(BASE_POSITIONS);
    PLAYERS.forEach((player) => {
      [0, 1, 2, 3].forEach((piece) => {
        this.setPiecePosition(
          player,
          piece,
          this.currentPositions[player][piece]
        );
      });
    });
    this.turn = 0;
    this.state = STATE.DICE_NOT_ROLLED;
  }

  listenPieceClick() {
    UI.listenPieceClick(this.onPieceClick.bind(this));
  }

  onPieceClick(event) {
    console.log("piece clicked and i found it");
    // console.log(event.id.subString(0, 2));
    const string = event.id;
    const player = string.substring(0, 2);
    const piece = string[3];

    this.handlePieceClick(player, piece);
  }

  handlePieceClick(player, piece) {
    console.log(player, piece);
    const currentPosition = this.currentPositions[player][piece];

    if (BASE_POSITIONS[player].includes(currentPosition)) {
      this.setPiecePosition(player, piece, START_POSITIONS[player]);
      this.state = STATE.DICE_NOT_ROLLED;
      return;
    }
    UI.unhighlightPieces();
    this.movePiece(player, piece, this.diceValue);
  }

  setPiecePosition(player, piece, newPosition) {
    this.currentPositions[player][piece] = newPosition;
    UI.setPiecePosition(player, piece, newPosition);
  }

  movePiece(player, piece, moveBy) {
    // this.setPiecePosition(
    //   player,
    //   piece,
    //   this.currentPositions[player][piece] + moveBy
    // );
    const interval = setInterval(() => {
      this.incrementPiecePosition(player, piece);
      moveBy--;
      if (moveBy === 0) {
        clearInterval(interval);

        // check if player has won
        if (this.hasPlayerWon(player)) {
          alert(`Player ${player} has won`);
          this.resetGame();
          return;
        }

        // check for kill
        const isKill = this.checkForKill(player, piece);
        if (isKill || this.diceValue === 6) {
          this.state = STATE.DICE_NOT_ROLLED;
          return;
        }

        this.incrementTurn();
      }
    }, 200);
  }

  checkForKill(player, piece) {
    const currentPosition = this.currentPositions[player][piece];
    const opponent = player === "P1" ? "P2" : "P1";
    let kill = false;
    [0, 1, 2, 3].forEach((piece) => {
      const opponentPosition = this.currentPositions[opponent][piece];
      if (
        currentPosition === opponentPosition &&
        !SAFE_POSITIONS.includes(currentPosition)
      ) {
        this.setPiecePosition(opponent, piece, BASE_POSITIONS[opponent][piece]);
        kill = true;
      }
    });
    return kill;
  }

  hasPlayerWon(player) {
    return [0, 1, 2, 3].every(
      (piece) => this.currentPositions[player][piece] === HOME_POSITIONS[player]
    );
  }

  incrementPiecePosition(player, piece) {
    this.setPiecePosition(
      player,
      piece,
      this.getIncrementedPosition(player, piece)
    );
  }

  getIncrementedPosition(player, piece) {
    const currentPosition = this.currentPositions[player][piece];
    if (currentPosition === TURNING_POINTS[player]) {
      return HOME_ENTRANCE[player][0];
    } else if (currentPosition === 51) {
      return 0;
    }

    return currentPosition + 1;
  }
}

const ludo = new Ludo();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});
// Inspector.Show(scene, {});
