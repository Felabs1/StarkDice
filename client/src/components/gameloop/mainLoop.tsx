import React, { useRef, useEffect, useState, useCallback } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import seedrandom from "seedrandom";
// Assuming these are external TypeScript files:
import { createPawn } from "./FUI";
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
} from "./constants";

// --- Type Definitions for Better Type Safety ---

/**
 * Type for the BABYLON.js mesh representing a single Ludo piece.
 * It extends the base Mesh with a required 'id' for piece identification.
 */
type LudoPieceMesh = BABYLON.Mesh & {
  id: string;
};

/**
 * Type for the object mapping player IDs to their pieces (array of meshes).
 */
type PlayerPiecesElements = {
  [key in (typeof PLAYERS)[number]]: LudoPieceMesh[];
};

/**
 * Type for the object returned by createScene, containing all scene elements.
 */
interface SceneData {
  scene: BABYLON.Scene;
  green1: LudoPieceMesh;
  green2: LudoPieceMesh;
  green3: LudoPieceMesh;
  green4: LudoPieceMesh;
  blue1: LudoPieceMesh;
  blue2: LudoPieceMesh;
  blue3: LudoPieceMesh;
  blue4: LudoPieceMesh;
  diceBox: BABYLON.Mesh;
  diceMeshes: BABYLON.AbstractMesh[];
  dice: BABYLON.AbstractMesh | undefined;
  meshBlue: CustomMesh;
  meshGreen: CustomMesh;
  meshYellow: CustomMesh;
  rollDice: (
    dice: BABYLON.AbstractMesh | undefined,
    userSeed?: number | null
  ) => Promise<{ face: string; seed: number | null }>;
  pieceHopAnimation: (mesh: LudoPieceMesh) => void;
  highlightPieceAnimation: (piece: LudoPieceMesh) => void;
  unhighlightPiecesAnimation: () => void;
  positionMap: Map<string, LudoPieceMesh[]>;
  OFFSET_DISTANCE: number;
}

/**
 * Interface for the Ludo game state managed by the Ludo class.
 */
interface LudoState {
  currentPositions: {
    [key in (typeof PLAYERS)[number]]: number[];
  };
  diceValue: number;
  turn: 0 | 1;
  state: (typeof STATE)[keyof typeof STATE];
}

// --- CustomMesh Class (unchanged logic, added types) ---

class CustomMesh {
  customMesh: BABYLON.Mesh;
  positions: number[];
  indices: number[];
  idx: number;
  blinkAnimationColor: BABYLON.Color3;

  constructor(
    scene: BABYLON.Scene,
    diffuseColor: BABYLON.Color3,
    emmissiveColor: BABYLON.Color3,
    blinkAnimationColor: BABYLON.Color3
  ) {
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

  addVertex(vector: BABYLON.Vector3): number {
    this.positions.push(vector.x, vector.y, vector.z);
    return this.idx++;
  }

  addFace(v1: number, v2: number, v3: number) {
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
      { frame: 25, value: this.blinkAnimationColor },
      { frame: 50, value: new BABYLON.Color3(0, 0, 0) },
    ];

    animation.setKeys(keys);
    this.customMesh.animations = [animation];
  }

  startAnimation(scene: BABYLON.Scene) {
    scene.beginDirectAnimation(
      this.customMesh,
      [this.customMesh.animations[0]],
      0,
      50,
      true
    );
  }

  stopAnimation(scene: BABYLON.Scene) {
    scene.stopAnimation(this.customMesh);
  }
}

// --- createScene function (converted to return SceneData) ---

const createScene = async (
  canvas: HTMLCanvasElement,
  engine: BABYLON.Engine
): Promise<SceneData> => {
  const scene = new BABYLON.Scene(engine);

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
      width: 1,
      height: 0.019,
      depth: 1,
      subdivisions: 15,
    },
    scene
  );
  board.position.y = -0.01;
  const deepBrownMat = new BABYLON.StandardMaterial("deepBrownMat", scene);
  deepBrownMat.diffuseColor = new BABYLON.Color3(0.76, 0.6, 0.42);
  board.material = deepBrownMat;

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
  groundCatMat.diffuseTexture = new BABYLON.Texture("/canvas_image.png");

  // Pawns
  const blue1 = createPawn("P1_0", "blue", 500) as LudoPieceMesh;
  const blue2 = createPawn("P1_1", "blue", 501) as LudoPieceMesh;
  const blue3 = createPawn("P1_2", "blue", 502) as LudoPieceMesh;
  const blue4 = createPawn("P1_3", "blue", 503) as LudoPieceMesh;

  const green1 = createPawn("P2_0", "green", 600) as LudoPieceMesh;
  const green2 = createPawn("P2_1", "green", 601) as LudoPieceMesh;
  const green3 = createPawn("P2_2", "green", 602) as LudoPieceMesh;
  const green4 = createPawn("P2_3", "green", 603) as LudoPieceMesh;

  const loadModels = async (modelName: string) => {
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "/models/",
        modelName,
        scene
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const { meshes: diceMeshes } = await loadModels("dice.glb");
  diceMeshes.forEach((mesh) => {
    mesh.unfreezeWorldMatrix();
    mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    mesh.computeWorldMatrix(true);
  });

  let dice = diceMeshes.find((mesh) => mesh.name === "__root__");

  if (dice) {
    dice.unfreezeWorldMatrix();
    dice.position.y = 1.3;
    dice.isPickable = true;
    dice.scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
    dice.position = new BABYLON.Vector3(0.0, 0.1, -0.01);

    dice.actionManager = new BABYLON.ActionManager(scene);
    dice.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        function (evt) {
          console.log("Dice clicked!", evt);
        }
      )
    );
  }

  const snapDiceToFace = (
    dice: BABYLON.AbstractMesh | undefined,
    face: string
  ) => {
    if (!dice) return;

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
  };

  // --- Base/Home Meshes (Red, Green, Yellow, Blue) ---

  const createBaseMesh = (
    color: {
      blink: BABYLON.Color3;
      emissive: BABYLON.Color3;
      diffuse: BABYLON.Color3;
    },
    position: BABYLON.Vector3
  ) => {
    let mesh = new CustomMesh(
      scene,
      color.diffuse,
      color.emissive,
      color.blink
    );

    let p0 = mesh.addVertex(new BABYLON.Vector3(-2, 2, 0));
    let p1 = mesh.addVertex(new BABYLON.Vector3(2, 2, 0));
    let p2 = mesh.addVertex(new BABYLON.Vector3(2, -2, 0));
    let p3 = mesh.addVertex(new BABYLON.Vector3(-2, -2, 0));

    let p4 = mesh.addVertex(new BABYLON.Vector3(-1.25, 1.25, 0));
    let p5 = mesh.addVertex(new BABYLON.Vector3(1.25, 1.25, 0));
    let p6 = mesh.addVertex(new BABYLON.Vector3(1.25, -1.25, 0));
    let p7 = mesh.addVertex(new BABYLON.Vector3(-1.25, -1.25, 0));

    mesh.addFace(p0, p1, p4);
    mesh.addFace(p1, p5, p4);
    mesh.addFace(p1, p2, p5);
    mesh.addFace(p2, p6, p5);
    mesh.addFace(p2, p3, p6);
    mesh.addFace(p3, p7, p6);
    mesh.addFace(p3, p0, p7);
    mesh.addFace(p0, p4, p7);

    mesh.customMesh.position = position;
    mesh.customMesh.position.y = 0.001;
    mesh.customMesh.rotation.x = Math.PI / 2;
    mesh.customMesh.scaling.set(0.1, 0.1, 0.1);

    mesh.updateMesh();
    return mesh;
  };

  const colors = {
    red: {
      blink: new BABYLON.Color3(1, 0, 0),
      emissive: new BABYLON.Color3(0, 0, 0),
      diffuse: new BABYLON.Color3(0.5, 0.1, 0.1),
    },
    green: {
      blink: new BABYLON.Color3(0, 0.5, 0),
      emissive: new BABYLON.Color3(0, 0.5, 0),
      diffuse: new BABYLON.Color3(0, 0.7, 0),
    },
    yellow: {
      blink: new BABYLON.Color3(1, 1, 0),
      emissive: new BABYLON.Color3(1, 1, 0),
      diffuse: new BABYLON.Color3(1, 1, 0),
    },
    blue: {
      blink: new BABYLON.Color3(0, 0.5, 1),
      emissive: new BABYLON.Color3(0, 0, 1),
      diffuse: new BABYLON.Color3(0, 0, 1),
    },
  };

  const meshRed = createBaseMesh(colors.red, new BABYLON.Vector3(-0.3, 0, 0.3));
  const meshGreen = createBaseMesh(
    colors.green,
    new BABYLON.Vector3(0.3, 0, 0.3)
  );
  const meshYellow = createBaseMesh(
    colors.yellow,
    new BABYLON.Vector3(0.3, 0, -0.3)
  );
  const meshBlue = createBaseMesh(
    colors.blue,
    new BABYLON.Vector3(-0.3, 0, -0.3)
  );

  // --- Piece Animations ---

  const createHopAnimation = (mesh: LudoPieceMesh) => {
    const hopAnimation = new BABYLON.Animation(
      "hopAnimation",
      "position.y",
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const baseY = mesh.position.y;
    const peakHeight = 0.05; // Reduced height for realism

    const keyFrames = [
      { frame: 0, value: baseY },
      { frame: 10, value: baseY + peakHeight },
      { frame: 20, value: baseY },
    ];

    hopAnimation.setKeys(keyFrames);
    return hopAnimation;
  };

  const pieceHopAnimation = (mesh: LudoPieceMesh) => {
    const hopAnimation = createHopAnimation(mesh);
    mesh.animations = [hopAnimation];

    const easingFunction = new BABYLON.CircleEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    hopAnimation.setEasingFunction(easingFunction);

    scene.beginAnimation(mesh, 0, 20, false);
  };

  // --- Highlighting Animations ---

  const torusMap = new Map<LudoPieceMesh, BABYLON.Mesh>();

  const createHighlightRing = (piece: LudoPieceMesh) => {
    const radius = piece.scaling.x;
    const torusDiameter = radius * 0.06;
    const torusThickness = radius * 0.003;

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
    torus.position.y = piece.position.y;
    return torus;
  };

  const applyDottedMaterial = (
    torus: BABYLON.Mesh,
    scene: BABYLON.Scene,
    customColor: BABYLON.Color3
  ) => {
    const material = new BABYLON.StandardMaterial("dotMaterial", scene);

    material.diffuseColor = customColor;
    material.emissiveColor = customColor;
    material.diffuseTexture = new BABYLON.Texture("textures/dotted.png", scene);
    material.diffuseTexture.hasAlpha = true;
    material.useAlphaFromDiffuseTexture = true;

    torus.material = material;
  };

  const rotateTorus = (torus: BABYLON.Mesh) => {
    scene.onBeforeRenderObservable.add(() => {
      torus.rotation.y += 0.05;
    });
  };

  const highlightPieceAnimation = (piece: LudoPieceMesh) => {
    if (torusMap.has(piece)) return; // Prevent multiple highlights

    const torus = createHighlightRing(piece);
    torusMap.set(piece, torus);

    const pieceColor = (piece.material as BABYLON.StandardMaterial)
      .diffuseColor;
    applyDottedMaterial(torus, scene, pieceColor);
    rotateTorus(torus);
  };

  const unhighlightPiecesAnimation = () => {
    torusMap.forEach((torus) => {
      torus.dispose();
    });
    torusMap.clear();
  };

  // --- Dice Roll Logic ---

  const generateRandomSeed = (): number => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  };

  const combineSeeds = (userSeed: number, additionalEntropy: number) => {
    return `${userSeed}-${additionalEntropy}`;
  };

  const rollDice = (
    dice: BABYLON.AbstractMesh | undefined,
    userSeed: number | null = null
  ): Promise<{ face: string; seed: number | null }> => {
    return new Promise((resolve) => {
      if (!dice) {
        resolve({ face: "Face1", seed: null });
        return;
      }

      const seed = userSeed || generateRandomSeed();

      const frameRate = 60;
      const rollDuration = 60;
      const rollAnim = new BABYLON.Animation(
        "rollAnim",
        "rotation",
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const baseSeed = userSeed || generateRandomSeed();
      const additionalEntropy = Date.now();
      const combinedSeed = combineSeeds(baseSeed, additionalEntropy);
      const random = seedrandom(combinedSeed);

      const keys = [];
      keys.push({
        frame: 0,
        value: dice.rotation.clone(),
      });
      keys.push({
        frame: rollDuration,
        value: new BABYLON.Vector3(
          dice.rotation.x + (random() * Math.PI * 12 + Math.PI * 6),
          dice.rotation.y + (random() * Math.PI * 12 + Math.PI * 6),
          dice.rotation.z + (random() * Math.PI * 12 + Math.PI * 6)
        ),
      });

      rollAnim.setKeys(keys);

      dice.animations = [];
      dice.animations.push(rollAnim);

      scene.beginAnimation(dice, 0, rollDuration, false, 2, () => {
        let highestFace: BABYLON.AbstractMesh | null = null;
        let highestY = -Infinity;

        dice.getChildMeshes().forEach((face) => {
          if (face.name.startsWith("Face")) {
            const position = face.getAbsolutePosition();
            if (position.y > highestY) {
              highestY = position.y;
              highestFace = face;
            }
          }
        });

        const faceName = highestFace?.name || "Face1";
        snapDiceToFace(dice, faceName);

        resolve({ face: faceName, seed });
      });
    });
  };

  const positionMap = new Map<string, LudoPieceMesh[]>();
  const OFFSET_DISTANCE = -0.02;

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
    meshGreen: meshGreen, // Renamed to meshGreen to avoid collision
    meshYellow,
    rollDice,
    pieceHopAnimation,
    highlightPieceAnimation,
    unhighlightPiecesAnimation,
    positionMap,
    OFFSET_DISTANCE,
  };
};

// --- UI Class (now a utility class with injected dependencies) ---

class UI {
  private sceneData: SceneData | null = null;
  private playerPiecesElements: PlayerPiecesElements | null = null;

  initialize(sceneData: SceneData, playerPiecesElements: PlayerPiecesElements) {
    this.sceneData = sceneData;
    this.playerPiecesElements = playerPiecesElements;
  }

  listenDiceClick(
    callback: (result: { face: string; seed: number | null }) => void
  ) {
    if (!this.sceneData || !this.playerPiecesElements) return;
    const { scene, diceMeshes, dice, rollDice } = this.sceneData;

    scene.onPointerDown = async (evt, pickResult) => {
      if (
        pickResult.hit &&
        diceMeshes.includes(pickResult.pickedMesh as BABYLON.AbstractMesh)
      ) {
        const userSeed = Math.floor(Math.random() * 1000);
        const result = await rollDice(dice, userSeed);
        callback(result);
      }
    };
  }

  listenResetClick(callback: () => void) {
    // This is currently a placeholder as in the original code.
    // In a React app, this would typically be a button click handler.
  }

  listenPieceClick(callback: (pieceMesh: LudoPieceMesh) => void) {
    if (!this.sceneData || !this.playerPiecesElements) return;
    const { scene } = this.sceneData;

    const allPieces: LudoPieceMesh[] = Object.values(
      this.playerPiecesElements
    ).flat();

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

  setPiecePosition(
    player: (typeof PLAYERS)[number],
    piece: number,
    newPosition: number
  ) {
    if (!this.sceneData || !this.playerPiecesElements) return;

    const { positionMap, pieceHopAnimation, OFFSET_DISTANCE } = this.sceneData;
    const pieceElement = this.playerPiecesElements[player]?.[piece];

    if (!pieceElement) {
      console.error(
        `Player element of given player: ${player} and piece: ${piece} not found`
      );
      return;
    }

    const [x, z] = COORDINATES_MAP[newPosition] as [number, number];
    const rememberY = pieceElement.position.y;

    pieceHopAnimation(pieceElement);

    const newPosKey = `${x}_${z}`;

    // Remove from old position
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

    // Add to new position
    if (!positionMap.has(newPosKey)) {
      positionMap.set(newPosKey, []);
    }
    positionMap.get(newPosKey)!.push(pieceElement);

    // Check for overlapping pieces and apply offsets
    const overlapCount = positionMap.get(newPosKey)!.length - 1;
    // Simplified offset logic (original was complex, this is standard circular)
    const angle = (overlapCount * 2 * Math.PI) / 4;
    const offsetX = overlapCount > 0 ? OFFSET_DISTANCE * Math.cos(angle) : 0;
    const offsetZ = overlapCount > 0 ? OFFSET_DISTANCE * Math.sin(angle) : 0;

    // Update the piece's position with the offset
    pieceElement.position.x = x + offsetX;
    pieceElement.position.z = z + offsetZ;
    pieceElement.position.y = rememberY;
  }

  setTurn(index: 0 | 1) {
    if (!this.sceneData) return;
    const { scene, meshBlue, meshGreen, meshYellow } = this.sceneData;

    const player = PLAYERS[index];
    console.log("player turn: " + player);

    // Stop all animations
    [meshBlue, meshGreen, meshYellow].forEach((m) => m.stopAnimation(scene));

    // Start the active player's animation
    if (player === "P1") {
      meshBlue.startAnimation(scene);
    } else if (player === "P2") {
      meshGreen.startAnimation(scene);
    }
    // You'd add P3 (Yellow) and P4 (Red) logic here if they were active
  }

  enableDice() {
    if (!this.sceneData || !this.sceneData.dice) return;

    this.sceneData.dice.state = "";
    this.sceneData.diceMeshes.forEach((dice) => {
      dice.isPickable = true;
    });
  }

  disableDice() {
    if (!this.sceneData || !this.sceneData.dice) return;

    this.sceneData.dice.state = "disabled";
    this.sceneData.diceMeshes.forEach((dice) => {
      dice.isPickable = false;
    });
  }

  highlightPieces(player: (typeof PLAYERS)[number], pieces: number[]) {
    if (!this.sceneData || !this.playerPiecesElements) return;

    if (!pieces.length) return;

    pieces.forEach((piece) => {
      const pieceElement = this.playerPiecesElements![player][piece];
      this.sceneData!.highlightPieceAnimation(pieceElement);

      // Simple highlight material
      const material = new BABYLON.StandardMaterial(
        "highlightMat",
        this.sceneData!.scene
      );
      material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Grey color
      pieceElement.material = material;
      pieceElement.isPickable = true;
    });
  }

  unhighlightPieces() {
    if (!this.sceneData || !this.playerPiecesElements) return;
    const { unhighlightPiecesAnimation, scene } = this.sceneData;

    unhighlightPiecesAnimation();
    const allPieces: LudoPieceMesh[] = Object.values(
      this.playerPiecesElements
    ).flat();

    allPieces.forEach((object) => {
      const material = new BABYLON.StandardMaterial("defaultMat", scene);
      object.material = material;
      object.isPickable = false;
      if (object.id.includes("P1")) {
        material.diffuseColor = new BABYLON.Color3(0.35, 0.35, 1);
      } else {
        material.diffuseColor = new BABYLON.Color3(0.35, 1, 0.35);
      }
    });
  }

  setDiceValue(value: number) {
    console.log("diceValue: " + value);
    // In a real app, you'd update a React state or display text here.
  }
}

const ui = new UI();

// --- Ludo Game Logic Class ---

class Ludo {
  private ui: UI;
  private stateRef: React.MutableRefObject<LudoState>;
  private setLudoState: React.Dispatch<React.SetStateAction<LudoState>>;

  constructor(
    ui: UI,
    stateRef: React.MutableRefObject<LudoState>,
    setLudoState: React.Dispatch<React.SetStateAction<LudoState>>
  ) {
    this.ui = ui;
    this.stateRef = stateRef;
    this.setLudoState = setLudoState;

    this.listenDiceClick();
    this.listenResetClick();
    this.listenPieceClick();

    this.resetGame();
  }

  // State Management Helpers (mirroring the original getter/setter logic)
  private updateState(changes: Partial<LudoState>) {
    this.setLudoState((prevState) => {
      const newState = { ...prevState, ...changes };
      this.stateRef.current = newState;
      return newState;
    });
  }

  get diceValue() {
    return this.stateRef.current.diceValue;
  }
  set diceValue(value: number) {
    this.updateState({ diceValue: value });
    this.ui.setDiceValue(value);
  }

  get turn() {
    return this.stateRef.current.turn;
  }
  set turn(value: 0 | 1) {
    this.updateState({ turn: value });
    this.ui.setTurn(value);
  }

  get state() {
    return this.stateRef.current.state;
  }
  set state(value: (typeof STATE)[keyof typeof STATE]) {
    this.updateState({ state: value });

    if (value === STATE.DICE_NOT_ROLLED) {
      this.ui.enableDice();
      this.ui.unhighlightPieces();
    } else {
      this.ui.disableDice();
    }
  }

  // --- Core Game Methods ---

  listenDiceClick() {
    this.ui.listenDiceClick(this.onDiceClick.bind(this));
  }

  onDiceClick(value: { face: string; seed: number | null }) {
    console.log("dice clicked!");

    const diceRoll = Number(value.face.substring(4)); // "FaceX" -> X
    this.diceValue = diceRoll;
    this.state = STATE.DICE_ROLLED;

    this.checkForEligiblePieces();
  }

  checkForEligiblePieces() {
    const player = PLAYERS[this.turn];
    const eligiblePieces = this.getEligiblePieces(player);

    if (eligiblePieces.length) {
      this.ui.highlightPieces(player, eligiblePieces);
    } else {
      this.incrementTurn();
    }
  }

  incrementTurn() {
    this.turn = this.turn === 0 ? 1 : 0;
    this.state = STATE.DICE_NOT_ROLLED;
  }

  getEligiblePieces(player: (typeof PLAYERS)[number]): number[] {
    return [0, 1, 2, 3].filter((piece) => {
      const currentPosition =
        this.stateRef.current.currentPositions[player][piece];

      if (currentPosition === HOME_POSITIONS[player]) return false;

      if (
        BASE_POSITIONS[player].includes(currentPosition) &&
        this.diceValue !== 6
      )
        return false;

      if (
        HOME_ENTRANCE[player].includes(currentPosition) &&
        this.diceValue > HOME_POSITIONS[player] - currentPosition
      )
        return false;

      return true;
    });
  }

  listenResetClick() {
    this.ui.listenResetClick(this.resetGame.bind(this));
  }

  resetGame() {
    const initialPositions = structuredClone(BASE_POSITIONS);

    PLAYERS.forEach((player: (typeof PLAYERS)[number]) => {
      [0, 1, 2, 3].forEach((piece) => {
        this.ui.setPiecePosition(
          player,
          piece,
          initialPositions[player][piece]
        );
      });
    });

    this.updateState({
      currentPositions: initialPositions,
      turn: 0,
      state: STATE.DICE_NOT_ROLLED,
      diceValue: 0,
    });
  }

  listenPieceClick() {
    this.ui.listenPieceClick(this.onPieceClick.bind(this));
  }

  onPieceClick(pieceMesh: LudoPieceMesh) {
    const [player, pieceIndexStr] = pieceMesh.id.split("_");
    const piece = Number(pieceIndexStr);
    this.handlePieceClick(player as (typeof PLAYERS)[number], piece);
  }

  handlePieceClick(player: (typeof PLAYERS)[number], piece: number) {
    const eligiblePieces = this.getEligiblePieces(PLAYERS[this.turn]);
    // Safety check: Only handle clicks for the current player's highlighted pieces
    if (player !== PLAYERS[this.turn] || !eligiblePieces.includes(piece)) {
      console.warn("Invalid piece click.");
      return;
    }

    const currentPosition =
      this.stateRef.current.currentPositions[player][piece];

    if (BASE_POSITIONS[player].includes(currentPosition)) {
      this.setPiecePosition(player, piece, START_POSITIONS[player]);
      this.state = STATE.DICE_NOT_ROLLED;
      return;
    }

    this.ui.unhighlightPieces();
    this.movePiece(player, piece, this.diceValue);
  }

  setPiecePosition(
    player: (typeof PLAYERS)[number],
    piece: number,
    newPosition: number
  ) {
    this.setLudoState((prevState) => {
      const newCurrentPositions = structuredClone(prevState.currentPositions);
      newCurrentPositions[player][piece] = newPosition;
      return { ...prevState, currentPositions: newCurrentPositions };
    });
    this.ui.setPiecePosition(player, piece, newPosition);
  }

  movePiece(player: (typeof PLAYERS)[number], piece: number, moveBy: number) {
    const interval = setInterval(() => {
      this.incrementPiecePosition(player, piece);
      moveBy--;

      if (moveBy === 0) {
        clearInterval(interval);
        // Need to use the current state from the ref here for checks
        const currentPositions = this.stateRef.current.currentPositions;
        const finalPosition = currentPositions[player][piece];

        if (this.hasPlayerWon(player)) {
          alert(`Player ${player} has won`);
          this.resetGame();
          return;
        }

        const isKill = this.checkForKill(player, piece, finalPosition);
        if (isKill || this.diceValue === 6) {
          this.state = STATE.DICE_NOT_ROLLED;
          return;
        }

        this.incrementTurn();
      }
    }, 200);
  }

  checkForKill(
    player: (typeof PLAYERS)[number],
    piece: number,
    currentPosition: number
  ): boolean {
    const opponent = player === "P1" ? "P2" : "P1";
    let kill = false;

    [0, 1, 2, 3].forEach((opponentPiece) => {
      const opponentPosition =
        this.stateRef.current.currentPositions[opponent][opponentPiece];
      if (
        currentPosition === opponentPosition &&
        !SAFE_POSITIONS.includes(currentPosition)
      ) {
        this.setPiecePosition(
          opponent,
          opponentPiece,
          BASE_POSITIONS[opponent][opponentPiece]
        );
        kill = true;
      }
    });
    return kill;
  }

  hasPlayerWon(player: (typeof PLAYERS)[number]): boolean {
    return [0, 1, 2, 3].every(
      (piece) =>
        this.stateRef.current.currentPositions[player][piece] ===
        HOME_POSITIONS[player]
    );
  }

  incrementPiecePosition(player: (typeof PLAYERS)[number], piece: number) {
    this.setPiecePosition(
      player,
      piece,
      this.getIncrementedPosition(player, piece)
    );
  }

  getIncrementedPosition(
    player: (typeof PLAYERS)[number],
    piece: number
  ): number {
    const currentPosition =
      this.stateRef.current.currentPositions[player][piece];

    if (currentPosition === TURNING_POINTS[player]) {
      return HOME_ENTRANCE[player][0];
    } else if (currentPosition === 51) {
      return 0;
    }

    return currentPosition + 1;
  }
}

// --- React Component ---

const initialLudoState: LudoState = {
  currentPositions: structuredClone(BASE_POSITIONS),
  diceValue: 0,
  turn: 0,
  state: STATE.DICE_NOT_ROLLED,
};

const LudoBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ludoState, setLudoState] = useState<LudoState>(initialLudoState);
  const ludoStateRef = useRef<LudoState>(ludoState);
  const ludoGameRef = useRef<Ludo | null>(null);

  // Update ref on state change
  useEffect(() => {
    ludoStateRef.current = ludoState;
  }, [ludoState]);

  // Main BABYLON.js initialization effect
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    let sceneData: SceneData | null = null;
    let renderLoopRunning = false;

    const initScene = async () => {
      try {
        sceneData = await createScene(canvas, engine);

        const playerPiecesElements: PlayerPiecesElements = {
          P1: [
            sceneData.blue1,
            sceneData.blue2,
            sceneData.blue3,
            sceneData.blue4,
          ],
          P2: [
            sceneData.green1,
            sceneData.green2,
            sceneData.green3,
            sceneData.green4,
          ],
          // Add P3, P4 if they exist
        };

        ui.initialize(sceneData, playerPiecesElements);

        // Start the render loop only once
        if (!renderLoopRunning) {
          engine.runRenderLoop(() => {
            sceneData?.scene.render();
          });
          renderLoopRunning = true;
        }

        // Initialize Ludo game logic
        if (!ludoGameRef.current) {
          ludoGameRef.current = new Ludo(ui, ludoStateRef, setLudoState);
        }
      } catch (error) {
        console.error("Failed to initialize Babylon scene:", error);
      }
    };

    initScene();

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (renderLoopRunning) {
        engine.stopRenderLoop();
      }
      engine.dispose();
      renderLoopRunning = false;
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Simple UI overlay for state display
  const currentPlayer = PLAYERS[ludoState.turn];

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <canvas
        ref={canvasRef}
        id="renderCanvas"
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 10,
          borderRadius: 5,
        }}
      >
        <h2>Ludo Game State</h2>
        <p>
          Turn: <strong>{currentPlayer}</strong>
        </p>
        <p>
          Dice Value: <strong>{ludoState.diceValue || "Roll Dice!"}</strong>
        </p>
        <p>
          Game State: <strong>{ludoState.state}</strong>
        </p>
      </div>
    </div>
  );
};

export default LudoBoard;
