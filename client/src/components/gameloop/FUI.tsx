import * as BABYLON from "@babylonjs/core";
import { COORDINATES_MAP } from "./constants";

export const createPawn = (
  name: string,
  color: string,
  position: number
): BABYLON.Mesh => {
  const bluePawn1 = BABYLON.MeshBuilder.CreateDisc(name, {
    radius: 0.03,
  });

  bluePawn1.rotation.x = Math.PI / 2;
  bluePawn1.position.y = 0.01;

  const [x, z] = COORDINATES_MAP[position];
  bluePawn1.position.x = x;
  bluePawn1.position.z = z;

  const blueCatMat = new BABYLON.StandardMaterial("blueMatMaterial");
  bluePawn1.material = blueCatMat;
  blueCatMat.diffuseColor =
    color === "green"
      ? new BABYLON.Color3(0.35, 1, 0.35)
      : new BABYLON.Color3(0.35, 0.35, 1);

  return bluePawn1;
};
