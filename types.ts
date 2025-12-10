export interface Point4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Edge {
  source: number; // Index of the start vertex
  target: number; // Index of the end vertex
}

export interface Shape4D {
  id: string;
  name: string;
  vertices: Point4D[];
  edges: Edge[];
  description: string;
}

export interface RotationState {
  xy: number;
  xz: number;
  xw: number;
  yz: number;
  yw: number;
  zw: number;
}

export interface RotationSpeeds {
  xy: number;
  xz: number;
  xw: number;
  yz: number;
  yw: number;
  zw: number;
}