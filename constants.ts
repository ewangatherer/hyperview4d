import { Shape4D, Point4D, Edge, RotationSpeeds } from './types';

// Helper to create edges for a hypercube
const createHypercube = (): Shape4D => {
  const vertices: Point4D[] = [];
  // Generate 16 vertices for +/- 1
  for (let i = 0; i < 16; i++) {
    vertices.push({
      x: (i & 1) ? 1 : -1,
      y: (i & 2) ? 1 : -1,
      z: (i & 4) ? 1 : -1,
      w: (i & 8) ? 1 : -1,
    });
  }

  const edges: Edge[] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      let diff = 0;
      if (vertices[i].x !== vertices[j].x) diff++;
      if (vertices[i].y !== vertices[j].y) diff++;
      if (vertices[i].z !== vertices[j].z) diff++;
      if (vertices[i].w !== vertices[j].w) diff++;
      if (diff === 1) {
        edges.push({ source: i, target: j });
      }
    }
  }

  return {
    id: 'tesseract',
    name: 'Tesseract (Hypercube)',
    description: 'The four-dimensional analogue of the cube. It has 16 vertices, 32 edges, 24 square faces, and 8 cubic cells.',
    vertices,
    edges,
  };
};

const createPentachoron = (): Shape4D => {
  const r = 1; 
  const vertices: Point4D[] = [
    { x: r, y: r, z: r, w: -1 / Math.sqrt(5) },
    { x: r, y: -r, z: -r, w: -1 / Math.sqrt(5) },
    { x: -r, y: r, z: -r, w: -1 / Math.sqrt(5) },
    { x: -r, y: -r, z: r, w: -1 / Math.sqrt(5) },
    { x: 0, y: 0, z: 0, w: 4 / Math.sqrt(5) }, // Apex
  ];

  const edges: Edge[] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      edges.push({ source: i, target: j });
    }
  }

  return {
    id: 'pentachoron',
    name: 'Pentachoron (5-Cell)',
    description: 'The simplest regular 4-polytope, analogous to a tetrahedron. It has 5 vertices and 10 edges.',
    vertices,
    edges,
  };
};

const create16Cell = (): Shape4D => {
  const vertices: Point4D[] = [
    { x: 1, y: 0, z: 0, w: 0 }, { x: -1, y: 0, z: 0, w: 0 },
    { x: 0, y: 1, z: 0, w: 0 }, { x: 0, y: -1, z: 0, w: 0 },
    { x: 0, y: 0, z: 1, w: 0 }, { x: 0, y: 0, z: -1, w: 0 },
    { x: 0, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: -1 },
  ];

  const edges: Edge[] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const dot = vertices[i].x * vertices[j].x + 
                  vertices[i].y * vertices[j].y + 
                  vertices[i].z * vertices[j].z + 
                  vertices[i].w * vertices[j].w;
      if (Math.abs(dot) < 0.1) {
        edges.push({ source: i, target: j });
      }
    }
  }

  return {
    id: '16-cell',
    name: '16-Cell (Orthoplex)',
    description: 'The dual of the tesseract. It is the 4D analogue of the octahedron. It has 8 vertices and 24 edges.',
    vertices,
    edges,
  };
};

// New Shapes

const create24Cell = (): Shape4D => {
  const vertices: Point4D[] = [];
  const coords = [0, 1, 2, 3];
  
  // 24 vertices: Permutations of (+-1, +-1, 0, 0)
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(signs => {
        const v = [0, 0, 0, 0];
        v[i] = signs[0];
        v[j] = signs[1];
        vertices.push({ x: v[0], y: v[1], z: v[2], w: v[3] });
      });
    }
  }

  const edges: Edge[] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      // Connect if distance is sqrt(2) (normalized coordinate space)
      const distSq = 
        Math.pow(vertices[i].x - vertices[j].x, 2) +
        Math.pow(vertices[i].y - vertices[j].y, 2) +
        Math.pow(vertices[i].z - vertices[j].z, 2) +
        Math.pow(vertices[i].w - vertices[j].w, 2);
      
      if (Math.abs(distSq - 2) < 0.01) {
        edges.push({ source: i, target: j });
      }
    }
  }

  return {
    id: '24-cell',
    name: '24-Cell',
    description: 'A unique regular 4-polytope with no 3D analogue. It is self-dual and composed of 24 octahedral cells.',
    vertices,
    edges
  };
};

const createTetrahedralPrism = (): Shape4D => {
  const vertices: Point4D[] = [];
  const baseVerts = [
    {x: 1, y: 1, z: 1},
    {x: 1, y: -1, z: -1},
    {x: -1, y: 1, z: -1},
    {x: -1, y: -1, z: 1}
  ];

  // Layer 1 (w = -1)
  baseVerts.forEach(v => vertices.push({ ...v, w: -1 }));
  // Layer 2 (w = 1)
  baseVerts.forEach(v => vertices.push({ ...v, w: 1 }));

  const edges: Edge[] = [];
  const connectTet = (offset: number) => {
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        edges.push({ source: offset + i, target: offset + j });
      }
    }
  };
  connectTet(0); // Base
  connectTet(4); // Top

  // Connecting edges (prismatic)
  for (let i = 0; i < 4; i++) {
    edges.push({ source: i, target: i + 4 });
  }

  return {
    id: 'tetra-prism',
    name: 'Tetrahedral Prism',
    description: 'A prism constructed by extruding a tetrahedron into the fourth dimension.',
    vertices,
    edges
  };
};

const createCubicPyramid = (): Shape4D => {
  const vertices: Point4D[] = [];
  // Cube at w = -0.5
  for (let i = 0; i < 8; i++) {
    vertices.push({
      x: (i & 1) ? 1 : -1,
      y: (i & 2) ? 1 : -1,
      z: (i & 4) ? 1 : -1,
      w: -0.5
    });
  }
  // Apex at w = 1.2
  vertices.push({ x: 0, y: 0, z: 0, w: 1.2 });

  const edges: Edge[] = [];
  // Cube edges
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      let diff = 0;
      if (vertices[i].x !== vertices[j].x) diff++;
      if (vertices[i].y !== vertices[j].y) diff++;
      if (vertices[i].z !== vertices[j].z) diff++;
      if (diff === 1) edges.push({ source: i, target: j });
    }
  }
  // Apex edges
  const apexIdx = 8;
  for (let i = 0; i < 8; i++) {
    edges.push({ source: i, target: apexIdx });
  }

  return {
    id: 'cubic-pyramid',
    name: 'Cubic Pyramid',
    description: 'A 4D pyramid bounded by one cube and 6 square pyramids, converging to an apex.',
    vertices,
    edges
  };
};

export const SHAPES: Record<string, Shape4D> = {
  tesseract: createHypercube(),
  pentachoron: createPentachoron(),
  hexadecachoron: create16Cell(),
  icositetrachoron: create24Cell(),
  tetraPrism: createTetrahedralPrism(),
  cubicPyramid: createCubicPyramid(),
};

export const DEFAULT_SPEEDS: RotationSpeeds = {
  xy: 0.005,
  xz: 0.005,
  xw: 0.005,
  yz: 0.005,
  yw: 0.005,
  zw: 0.005,
};