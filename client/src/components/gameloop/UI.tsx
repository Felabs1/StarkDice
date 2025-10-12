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