import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import seedrandom from "seedrandom";
import { createPawn } from "./FUI";
import {
  COORDINATES_MAP,
  PLAYERS,
  BASE_POSITIONS,
  HOME_ENTRANCE,
  HOME_POSITIONS,
  SAFE_POSITIONS,
  START_POSITIONS,
  STATE,
  TURNING_POINTS,
  type Player,
  type GameState,
} from "./constants";
import { useGame } from "../../dojo/hooks/useGame";
import { usePlayers } from "../../dojo/hooks/usePlayers";
import { usePieces } from "../../dojo/hooks/usePiece";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useParams } from "react-router-dom";
import { Piece } from "../../dojo/models.gen";
import { useRollDiceAction } from "../../dojo/hooks/useRollDice";
import { useMovePieceAction } from "../../dojo/hooks/useMovePiece";

const OFFSET_DISTANCE = -0.02;

type DiceResult = {
  face: string;
  seed: number;
};

// CustomMesh Class
class CustomMesh {
  customMesh: BABYLON.Mesh;
  blinkAnimationColor: BABYLON.Color3;
  positions: number[] = [];
  indices: number[] = [];
  idx: number = 0;
  scene: BABYLON.Scene;

  constructor(
    scene: BABYLON.Scene,
    diffuseColor: BABYLON.Color3,
    emissiveColor: BABYLON.Color3,
    blinkAnimationColor: BABYLON.Color3
  ) {
    this.scene = scene;
    const material = new BABYLON.StandardMaterial("material", scene);
    material.emissiveColor = emissiveColor;
    material.diffuseColor = diffuseColor;
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.backFaceCulling = false;

    this.blinkAnimationColor = blinkAnimationColor;
    this.customMesh = new BABYLON.Mesh("custom", scene);
    this.customMesh.material = material;
  }

  addVertex(vector: BABYLON.Vector3): number {
    this.positions.push(vector.x, vector.y, vector.z);
    return this.idx++;
  }

  addFace(v1: number, v2: number, v3: number): void {
    this.indices.push(v1, v2, v3);
  }

  updateMesh(): void {
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = this.positions;
    vertexData.indices = this.indices;
    vertexData.applyToMesh(this.customMesh, true);
    this.createGlowAnimation();
  }

  createGlowAnimation(): void {
    const animation = new BABYLON.Animation(
      "glowAnimation",
      "material.emissiveColor",
      60,
      BABYLON.Animation.ANIMATIONTYPE_COLOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [
      { frame: 0, value: new BABYLON.Color3(0, 0, 0) },
      { frame: 25, value: this.blinkAnimationColor },
      { frame: 50, value: new BABYLON.Color3(0, 0, 0) },
    ];

    animation.setKeys(keys);
    this.customMesh.animations = [animation];
  }

  startAnimation(): void {
    this.scene.beginDirectAnimation(
      this.customMesh,
      [this.customMesh.animations[0]],
      0,
      50,
      true
    );
  }

  stopAnimation(): void {
    this.scene.stopAnimation(this.customMesh);
  }
}

// Helper functions
const snapDiceToFace = (dice: BABYLON.Mesh, face: string): void => {
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

const generateRandomSeed = (): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0];
};

const combineSeeds = (userSeed: number, additionalEntropy: number): string => {
  return `${userSeed}-${additionalEntropy}`;
};

const createHopAnimation = (mesh: BABYLON.Mesh): BABYLON.Animation => {
  const hopAnimation = new BABYLON.Animation(
    "hopAnimation",
    "position.y",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const baseY = mesh.position.y;
  const peakHeight = 1;
  const keyFrames = [
    { frame: 0, value: baseY },
    { frame: 10, value: baseY + peakHeight },
    { frame: 20, value: baseY },
  ];

  hopAnimation.setKeys(keyFrames);
  return hopAnimation;
};

const pieceHopAnimation = (mesh: BABYLON.Mesh, scene: BABYLON.Scene): void => {
  const hopAnimation = createHopAnimation(mesh);
  mesh.animations = [hopAnimation];

  const easingFunction = new BABYLON.CircleEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  hopAnimation.setEasingFunction(easingFunction);

  scene.beginAnimation(mesh, 0, 2, false);
};

const createHighlightRing = (
  piece: BABYLON.Mesh,
  scene: BABYLON.Scene
): BABYLON.Mesh => {
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
): void => {
  const material = new BABYLON.StandardMaterial("dotMaterial", scene);
  material.diffuseColor = customColor;
  material.emissiveColor = customColor;
  material.diffuseTexture = new BABYLON.Texture("textures/dotted.png", scene);
  if (material.diffuseTexture) {
    material.diffuseTexture.hasAlpha = true;
    material.useAlphaFromDiffuseTexture = true;
  }
  torus.material = material;
};

const rotateTorus = (torus: BABYLON.Mesh, scene: BABYLON.Scene): void => {
  scene.onBeforeRenderObservable.add(() => {
    torus.rotation.y += 0.05;
  });
};

const rollDice = async (
  dice: BABYLON.Mesh,
  scene: BABYLON.Scene,
  userSeed: number | null = null
): Promise<DiceResult> => {
  return new Promise((resolve) => {
    const baseSeed = userSeed || generateRandomSeed();
    const additionalEntropy = Date.now();
    const combinedSeed = combineSeeds(baseSeed, additionalEntropy);
    const random = seedrandom(combinedSeed);

    const frameRate = 60;
    const rollDuration = 60;
    const rollAnim = new BABYLON.Animation(
      "rollAnim",
      "rotation",
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [
      { frame: 0, value: dice.rotation.clone() },
      {
        frame: rollDuration,
        value: new BABYLON.Vector3(
          dice.rotation.x + (random() * Math.PI * 12 + Math.PI * 6),
          dice.rotation.y + (random() * Math.PI * 12 + Math.PI * 6),
          dice.rotation.z + (random() * Math.PI * 12 + Math.PI * 6)
        ),
      },
    ];

    rollAnim.setKeys(keys);
    dice.animations = [rollAnim];

    scene.beginAnimation(dice, 0, rollDuration, false, 2, () => {
      let highestFace = null;
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

      if (highestFace) {
        snapDiceToFace(dice, highestFace.name);
        resolve({ face: highestFace.name, seed: baseSeed });
      }
    });
  });
};

// UI Class
class UI {
  static scene: BABYLON.Scene | null = null;
  static dice: BABYLON.Mesh | null = null;
  static diceMeshes: BABYLON.AbstractMesh[] = [];
  static meshBlue: CustomMesh | null = null;
  static meshGreen: CustomMesh | null = null;
  static playerPiecesElements: Record<Player, BABYLON.Mesh[]> = {
    P1: [],
    P2: [],
  };
  static positionMap: Map<string, BABYLON.Mesh[]> = new Map();
  static torusMap: Map<BABYLON.Mesh, BABYLON.Mesh> = new Map();
  static onGameStateChange:
    | ((state: {
        turn: number;
        diceValue: number;
        gameState: GameState;
      }) => void)
    | null = null;

  static listenDiceClick(
    callback: (result: DiceResult) => void,
    canRollDice: () => boolean
  ): void {
    this.scene!.onPointerDown = async (evt, pickResult) => {
      // if (pickResult.hit && this.diceMeshes.includes(pickResult.pickedMesh!)) {
      //   // Check if rolling is allowed at this moment

      //   const userSeed = Math.floor(Math.random() * 1000);
      //   const result = await rollDice(this.dice!, this.scene!, userSeed);
      //   callback(result);
      // }

      if (!pickResult.hit) return;
      if (!this.diceMeshes.includes(pickResult.pickedMesh!)) return;

      // Check if rolling is allowed at this moment
      if (!canRollDice()) {
        console.warn("Cannot roll dice now");
        return;
      }

      const userSeed = Math.floor(Math.random() * 1000);
      const result = await rollDice(this.dice!, this.scene!, userSeed);
      callback(result);
    };
  }

  // Add inside UI class
  static updatePiecesFromServer(piecesData: Piece[]): void {
    // if (!this.scene) return;

    console.log("piece positions ", piecesData);

    // Group by player address or ID
    const grouped = piecesData.reduce(
      (acc, piece) => {
        const player = piece.player_index === 0 ? "P1" : "P2"; // depends on your schema
        acc[player].push(piece);
        return acc;
      },
      { P1: [], P2: [] }
    );

    // Sync each player's pieces
    for (const player of Object.keys(grouped) as Player[]) {
      grouped[player].forEach((pieceData, index) => {
        const mesh = this.playerPiecesElements[player][index];
        if (!mesh) return;

        // Map piece.position to coordinates
        const newPosition = pieceData.position;
        if (typeof newPosition === "number") {
          const [x, z] = COORDINATES_MAP[newPosition];
          mesh.position.x = x;
          mesh.position.z = z;
        }
      });
    }

    console.log("✅ Updated piece positions from on-chain data", grouped);
  }

  static listenPieceClick(callback: (piece: BABYLON.Mesh) => void): void {
    const allPieces = Object.values(this.playerPiecesElements).flat();
    allPieces.forEach((object) => {
      console.log(object);
      object.actionManager = new BABYLON.ActionManager(this.scene!);
      object.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () =>
          callback(object)
        )
      );
    });
  }

  static setPiecePosition(
    player: Player,
    piece: number,
    newPosition: number
  ): void {
    if (
      !this.playerPiecesElements[player] ||
      !this.playerPiecesElements[player][piece]
    ) {
      console.error(`Player element not found: ${player}, piece: ${piece}`);
      return;
    }

    const [x, z] = COORDINATES_MAP[newPosition];
    const pieceElement = this.playerPiecesElements[player][piece];
    const rememberY = pieceElement.position.y;

    pieceHopAnimation(pieceElement, this.scene!);

    const newPosKey = `${x}_${z}`;

    // Remove from previous position
    for (let [posKey, pieces] of this.positionMap.entries()) {
      const index = pieces.indexOf(pieceElement);
      if (index > -1) {
        pieces.splice(index, 1);
        if (pieces.length === 0) {
          this.positionMap.delete(posKey);
        }
        break;
      }
    }

    // Add to new position
    if (!this.positionMap.has(newPosKey)) {
      this.positionMap.set(newPosKey, []);
    }
    this.positionMap.get(newPosKey)!.push(pieceElement);

    // Apply offset
    const OFFSET_DISTANCE = -0.02;
    const overlapCount = this.positionMap.get(newPosKey)!.length - 1;
    const offsetX =
      overlapCount *
      OFFSET_DISTANCE *
      Math.cos((overlapCount * 2 * Math.PI) / 4);
    const offsetZ =
      overlapCount *
      OFFSET_DISTANCE *
      Math.sin((overlapCount * 2 * Math.PI) / 4);

    pieceElement.position.x = x + offsetX;
    pieceElement.position.z = z + offsetZ;
    pieceElement.position.y = rememberY;
  }

  static setTurn(index: number): void {
    if (index < 0 || index >= PLAYERS.length) {
      console.error("index out of bound!");
      return;
    }

    const player = PLAYERS[index];
    console.log("player turn: " + player);

    if (player === "P1") {
      this.meshBlue!.startAnimation();
      this.meshGreen!.stopAnimation();
    } else {
      this.meshGreen!.startAnimation();
      this.meshBlue!.stopAnimation();
    }
  }

  static enableDice(): void {
    this.diceMeshes.forEach((dice) => {
      dice.isPickable = true;
    });
  }

  static disableDice(): void {
    this.diceMeshes.forEach((dice) => {
      dice.isPickable = false;
    });
  }

  static highlightPieces(player: Player, pieces: number[]): void {
    if (!pieces.length) return;

    pieces.forEach((piece) => {
      const pieceElement = this.playerPiecesElements[player][piece];

      const torus = createHighlightRing(pieceElement, this.scene!);
      this.torusMap.set(pieceElement, torus);

      const pieceColor = (pieceElement.material as BABYLON.StandardMaterial)
        .diffuseColor;
      applyDottedMaterial(torus, this.scene!, pieceColor);
      rotateTorus(torus, this.scene!);

      const material = new BABYLON.StandardMaterial(
        "highlightMat",
        this.scene!
      );
      material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      pieceElement.material = material;
      pieceElement.isPickable = true;
    });
  }

  static unhighlightPieces(): void {
    this.torusMap.forEach((torus) => {
      torus.dispose();
    });
    this.torusMap.clear();

    const allPieces = Object.values(this.playerPiecesElements).flat();
    allPieces.forEach((object) => {
      const str = object.id;
      const material = new BABYLON.StandardMaterial("mat", this.scene!);
      object.material = material;
      object.isPickable = false;

      if (str.includes("P1")) {
        material.diffuseColor = new BABYLON.Color3(0.35, 0.35, 1);
      } else {
        material.diffuseColor = new BABYLON.Color3(0.35, 1, 0.35);
      }
    });
  }

  static setDiceValue(value: number): void {
    console.log("diceValue: " + value);
    if (this.onGameStateChange) {
      // Trigger state update for React
    }
  }

  static listenResetClick(callback: () => void): void {
    // This can be implemented if needed for a button in the scene
  }
}

interface LudoActions {
  executeRollDice: (args?: any) => Promise<any>;
  canRollDice: boolean;
  resetRollDiceState: () => void;
  executeMovePiece: (args?: any) => Promise<any>;
  canMovePiece: boolean;
  resetMovePieceState: () => void;
}
// Ludo Class
class Ludo {
  public actions: LudoActions;
  currentPositions: Record<Player, number[]> = {
    P1: [],
    P2: [],
  };
  _diceValue: number = 0;
  _turn: number = 0;
  _state: GameState = STATE.DICE_NOT_ROLLED;
  onStateChange:
    | ((state: {
        turn: number;
        diceValue: number;
        gameState: GameState;
      }) => void)
    | null = null;

  get diceValue(): number {
    return this._diceValue;
  }

  set diceValue(value: number) {
    this._diceValue = value;
    UI.setDiceValue(value);
    this.notifyStateChange();
  }

  get turn(): number {
    return this._turn;
  }

  set turn(value: number) {
    this._turn = value;
    UI.setTurn(value);
    this.notifyStateChange();
  }

  get state(): GameState {
    return this._state;
  }

  set state(value: GameState) {
    this._state = value;
    if (value === STATE.DICE_NOT_ROLLED) {
      UI.enableDice();
      UI.unhighlightPieces();
    } else {
      UI.disableDice();
    }
    this.notifyStateChange();
  }

  syncPositionsFromServer(piecesData: Piece[]) {
    const grouped = piecesData.reduce(
      (acc, piece) => {
        const player = piece.player_index === 0 ? "P1" : "P2";
        acc[player].push(piece);
        return acc;
      },
      { P1: [], P2: [] }
    );

    // Update Ludo’s internal state
    for (const player of Object.keys(grouped) as Player[]) {
      grouped[player].forEach((pieceData, index) => {
        this.currentPositions[player][index] = pieceData.position;
      });
    }

    console.log("♻️ Synced Ludo state from blockchain data", grouped);
  }

  notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({
        turn: this._turn,
        diceValue: this._diceValue,
        gameState: this._state,
      });
    }
  }

  constructor(actions: LudoActions) {
    this.actions = actions;
    console.log("Hello World! Lets play Ludo!");
    this.listenDiceClick();
    this.listenPieceClick();
    this.resetGame();
  }

  listenDiceClick(): void {
    // if (!this.actions.canRollDice) {
    //   console.warn("Cannot roll dice now");
    //   return;
    // }
    console.log(this.actions.canRollDice);
    UI.listenDiceClick(
      this.onDiceClick.bind(this),
      () => this.actions.canRollDice
    );
  }

  onDiceClick(value: DiceResult): void {
    console.log("dice clicked!");
    console.log(value.face[4]);
    this.diceValue = Number(value.face[4]);
    this.state = STATE.DICE_ROLLED;
    this.checkForEligiblePieces();
  }

  checkForEligiblePieces(): void {
    const player = PLAYERS[this.turn];
    const eligiblePieces = this.getEligiblePieces(player);

    if (eligiblePieces.length) {
      UI.highlightPieces(player, eligiblePieces);
      console.log(eligiblePieces);
    } else {
      this.incrementTurn();
    }
  }

  incrementTurn(): void {
    this.turn = this.turn === 0 ? 1 : 0;
    this.state = STATE.DICE_NOT_ROLLED;
  }

  getEligiblePieces(player: Player): number[] {
    return [0, 1, 2, 3].filter((piece) => {
      const currentPosition = this.currentPositions[player][piece];

      // Already home - can't move
      if (currentPosition === HOME_POSITIONS[player]) {
        return false;
      }

      // In base - can only move with a 6
      if (
        BASE_POSITIONS[player].includes(currentPosition) &&
        this.diceValue !== 6
      ) {
        return false;
      }

      // In home entrance - check if we can reach home exactly
      if (HOME_ENTRANCE[player].includes(currentPosition)) {
        const homeEntranceIndex =
          HOME_ENTRANCE[player].indexOf(currentPosition);
        const stepsToHome = HOME_ENTRANCE[player].length - homeEntranceIndex;

        // Can only move if dice value exactly reaches home or moves within entrance
        if (this.diceValue > stepsToHome) {
          return false; // Would overshoot
        }
      }

      return true;
    });
  }

  resetGame(): void {
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

  listenPieceClick(): void {
    UI.listenPieceClick(this.onPieceClick.bind(this));
  }

  onPieceClick(event: BABYLON.Mesh): void {
    console.log("piece clicked");
    const string = event.id;
    const player = string.substring(0, 2);
    const piece = Number(string[3]);
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

  setPiecePosition(player: Player, piece: number, newPosition: number): void {
    this.currentPositions[player][piece] = newPosition;
    UI.setPiecePosition(player, piece, newPosition);
  }

  movePiece(player: Player, piece: number, moveBy: number): void {
    const interval = setInterval(() => {
      this.incrementPiecePosition(player, piece);
      moveBy--;

      if (moveBy === 0) {
        clearInterval(interval);

        if (this.hasPlayerWon(player)) {
          alert(`Player ${player} has won`);
          this.resetGame();
          return;
        }

        const isKill = this.checkForKill(player, piece);

        if (isKill || this.diceValue === 6) {
          this.state = STATE.DICE_NOT_ROLLED;
          return;
        }

        this.incrementTurn();
      }
    }, 200);
  }

  checkForKill(player: Player, piece: number): boolean {
    const currentPosition = this.currentPositions[player][piece];
    const opponent = player === "P1" ? "P2" : "P1";
    let kill = false;

    [0, 1, 2, 3].forEach((opponentPiece) => {
      const opponentPosition = this.currentPositions[opponent][opponentPiece];

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

  hasPlayerWon(player: Player): boolean {
    return [0, 1, 2, 3].every(
      (piece) => this.currentPositions[player][piece] === HOME_POSITIONS[player]
    );
  }

  incrementPiecePosition(player: Player, piece: number): void {
    this.setPiecePosition(
      player,
      piece,
      this.getIncrementedPosition(player, piece)
    );
  }

  getIncrementedPosition(player: Player, piece: number): number {
    const currentPosition = this.currentPositions[player][piece];

    // Check if at turning point to enter home stretch
    if (currentPosition === TURNING_POINTS[player]) {
      return HOME_ENTRANCE[player][0];
    }

    // Check if in home entrance - need to continue to home position
    if (HOME_ENTRANCE[player].includes(currentPosition)) {
      // If at last position in home entrance, go to home
      const homeEntranceIndex = HOME_ENTRANCE[player].indexOf(currentPosition);
      if (homeEntranceIndex === HOME_ENTRANCE[player].length - 1) {
        return HOME_POSITIONS[player];
      }
      // Otherwise continue in home entrance
      return HOME_ENTRANCE[player][homeEntranceIndex + 1];
    }

    // Wrap around the board
    if (currentPosition === 51) {
      return 0;
    }

    return currentPosition + 1;
  }
}

// React Component
const LudoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ludoRef = useRef<Ludo | null>(null);
  const [gameInfo, setGameInfo] = useState({
    turn: 0,
    diceValue: 0,
    gameState: STATE.DICE_NOT_ROLLED as GameState,
  });
  const { status } = useStarknetConnect();
  const isConnected = status === "connected";
  const { gameId } = useParams();
  console.log(gameId);

  const { pieces, isLoading, error, refetch } = usePieces(gameId!);
  const { rollDiceState, executeRollDice, canRollDice, resetRollDiceState } =
    useRollDiceAction();
  const {
    movePieceState,
    executeMovePiece,
    canMovePiece,
    resetMovePieceState,
  } = useMovePieceAction();
  // console.log("Player pieces ", pieces);

  useEffect(() => {
    if (!canvasRef.current) return;
    console.log("🎨 Canvas ref at mount:", canvasRef.current);
    // console.log("pieces in game", isLoading, pieces);
    const engine = new BABYLON.Engine(canvasRef.current);

    const createScene = async () => {
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

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
      camera.lowerRadiusLimit = 1.3; // minimum zoom distance
      camera.upperRadiusLimit = 2;

      const ground = BABYLON.MeshBuilder.CreateGround(
        "",
        { subdivisions: 15 },
        scene
      );
      const board = BABYLON.MeshBuilder.CreateBox(
        "ground",
        {
          width: 1,
          height: 0.019,
          depth: 1,
        },
        scene
      );
      board.position.y = -0.01;

      const deepBrownMat = new BABYLON.StandardMaterial("deepBrownMat", scene);
      deepBrownMat.diffuseColor = new BABYLON.Color3(0.76, 0.6, 0.42);
      board.material = deepBrownMat;

      const groundCatMat = new BABYLON.StandardMaterial("groundMat", scene);
      groundCatMat.diffuseTexture = new BABYLON.Texture(
        "/canvas_image.png",
        scene
      );
      ground.material = groundCatMat;

      const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      light.intensity = 0.85;

      // Create pawns
      const blue1 = createPawn("P1_0", "blue", 500);
      const blue2 = createPawn("P1_1", "blue", 501);
      const blue3 = createPawn("P1_2", "blue", 502);
      const blue4 = createPawn("P1_3", "blue", 503);

      const green1 = createPawn("P2_0", "green", 600);
      const green2 = createPawn("P2_1", "green", 601);
      const green3 = createPawn("P2_2", "green", 602);
      const green4 = createPawn("P2_3", "green", 603);

      // Load dice
      const { meshes: diceMeshes } = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "/models/",
        "dice.glb",
        scene
      );

      diceMeshes.forEach((mesh) => {
        mesh.unfreezeWorldMatrix();
        mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        mesh.computeWorldMatrix(true);
      });

      const dice = diceMeshes.find((mesh) => mesh.name === "__root__");
      dice.position.y = 1.3;
      dice.unfreezeWorldMatrix();
      dice.isPickable = true;
      dice.scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
      dice.position = new BABYLON.Vector3(0.0, 0.1, -0.01);

      // Create base meshes
      const createBaseMesh = (
        diffuseColor,
        emissiveColor,
        blinkColor,
        x,
        z
      ) => {
        const mesh = new CustomMesh(
          scene,
          diffuseColor,
          emissiveColor,
          blinkColor
        );

        const p0 = mesh.addVertex(new BABYLON.Vector3(-2, 2, 0));
        const p1 = mesh.addVertex(new BABYLON.Vector3(2, 2, 0));
        const p2 = mesh.addVertex(new BABYLON.Vector3(2, -2, 0));
        const p3 = mesh.addVertex(new BABYLON.Vector3(-2, -2, 0));
        const p4 = mesh.addVertex(new BABYLON.Vector3(-1.25, 1.25, 0));
        const p5 = mesh.addVertex(new BABYLON.Vector3(1.25, 1.25, 0));
        const p6 = mesh.addVertex(new BABYLON.Vector3(1.25, -1.25, 0));
        const p7 = mesh.addVertex(new BABYLON.Vector3(-1.25, -1.25, 0));

        mesh.addFace(p0, p1, p4);
        mesh.addFace(p1, p5, p4);
        mesh.addFace(p1, p2, p5);
        mesh.addFace(p2, p6, p5);
        mesh.addFace(p2, p3, p6);
        mesh.addFace(p3, p7, p6);
        mesh.addFace(p3, p0, p7);
        mesh.addFace(p0, p4, p7);

        mesh.customMesh.position.x = x;
        mesh.customMesh.position.z = z;
        mesh.customMesh.position.y = 0.001;
        mesh.customMesh.rotation.x = Math.PI / 2;
        mesh.customMesh.scaling.set(0.1, 0.1, 0.1);
        mesh.updateMesh();

        return mesh;
      };

      const meshBlue = createBaseMesh(
        new BABYLON.Color3(0, 0, 1),
        new BABYLON.Color3(0, 0, 1),
        new BABYLON.Color3(0, 0.5, 1),
        -0.3,
        -0.3
      );

      const meshGreen = createBaseMesh(
        new BABYLON.Color3(0, 0.7, 0),
        new BABYLON.Color3(0, 0.5, 0),
        new BABYLON.Color3(0, 0.5, 0),
        0.3,
        0.3
      );

      // Set up UI static properties
      UI.scene = scene;
      UI.dice = dice;
      UI.diceMeshes = diceMeshes;
      UI.meshBlue = meshBlue;
      UI.meshGreen = meshGreen;
      UI.playerPiecesElements = {
        P1: [blue1, blue2, blue3, blue4],
        P2: [green1, green2, green3, green4],
      };
      UI.updatePiecesFromServer(pieces);

      // Initialize Ludo game
      ludoRef.current = new Ludo({
        executeRollDice,
        canRollDice,
        resetRollDiceState,
        executeMovePiece,
        canMovePiece,
        resetMovePieceState,
      });
      ludoRef.current.onStateChange = (state) => {
        setGameInfo(state);
      };
      ludoRef.current.syncPositionsFromServer(pieces);
      ludoRef.current.actions.canRollDice = canRollDice;

      // Start render loop
      engine.runRenderLoop(() => {
        scene.render();
      });
    };

    createScene();

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, [pieces]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "auto",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          background: "rgba(0, 0, 0, 0.7)",
          padding: "15px 25px",
          borderRadius: 10,
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ marginBottom: 8, fontSize: "18px", fontWeight: "bold" }}>
          🎲 Ludo Game
        </div>
        <div style={{ marginBottom: 5 }}>
          <strong>Current Turn:</strong> Player {gameInfo.turn + 1}{" "}
          {gameInfo.turn === 0 ? "🔵" : "🟢"}
        </div>
        <div style={{ marginBottom: 5 }}>
          <strong>Dice Value:</strong> {gameInfo.diceValue || "-"}
        </div>
        <div style={{ marginBottom: 15 }}>
          <strong>Status:</strong>{" "}
          {gameInfo.gameState === STATE.DICE_NOT_ROLLED
            ? "🎲 Roll Dice"
            : "🎯 Select Piece"}
        </div>
        <button
          onClick={() => ludoRef.current?.resetGame()}
          style={{
            width: "100%",
            padding: "10px 20px",
            cursor: "pointer",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "transform 0.1s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🔄 Reset Game
        </button>
      </div>
    </div>
  );
};

export default LudoGame;
