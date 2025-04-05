function isPolygonInsideSquare(points) {
  for (const [x, y] of points) {
    if (x < 0.0 || x > 1.0 || y < 0.0 || y > 1.0) {
      return false; // 한 점이라도 정사각형 밖이면 false
    }
  }
  return true; // 모든 점이 정사각형 내부
}

function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00000001) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function ccw(A, B, C) {
  return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
}

function segmentsIntersect(A, B, C, D) {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

function polygonIntersectsSquareBoundary(points) {
  const square = [
    [0.0, 0.0],
    [1.0, 0.0],
    [1.0, 1.0],
    [0.0, 1.0]
  ];

  const squareEdges = [];
  for (let i = 0; i < 4; i++) {
    squareEdges.push([square[i], square[(i + 1) % 4]]);
  }

  const polyEdges = [];
  for (let i = 0; i < points.length; i++) {
    polyEdges.push([points[i], points[(i + 1) % points.length]]);
  }

  for (const [p1, p2] of polyEdges) {
    for (const [q1, q2] of squareEdges) {
      if (segmentsIntersect(p1, p2, q1, q2)) {
        return true;
      }
    }
  }

  return false;
}

function getMostFrequent(arr) {
  const hashmap = arr.reduce( (acc, val) => {
    acc[val] = (acc[val] || 0 ) + 1
    return acc
  },{});

  return Object.keys(hashmap)
    .reduce((a, b) => hashmap[a] > hashmap[b] ? a : b);
}

class Quadtree {
  constructor(value) {
    this.value = value;
    this.children = null;
  }

  isDivided() {
    return this.children !== null;
  }

  divide() {
    if (this.isDivided())
      throw new Error("Quadtree already divided");

    this.children = [
      new Quadtree(this.value),
      new Quadtree(this.value),
      new Quadtree(this.value),
      new Quadtree(this.value),
    ];

    return this;
  }

  reduce() {
    if (!this.isDivided()) {
      return;
    }

    this.children.forEach(c => c.reduce());

    if (this.children.some(c => c.isDivided())) {
      return;
    }

    const value = this.children
      .reduce((a, b) => a !== null && a.value === b.value ? a : null);
    
    if (value === null) {
      return;
    }

    this.children = null;
    this.value = value.value;

    return this;
  }

  drawCircle(x, y, radius, value, recurseLevel) {
    if (recurseLevel <= 0)
      return

    if (recurseLevel === undefined)
      recurseLevel = 10;

    const luc = Math.hypot(x - 0, y - 0) < radius;
    const ruc = Math.hypot(x - 1, y - 0) < radius;
    const ldc = Math.hypot(x - 0, y - 1) < radius;
    const rdc = Math.hypot(x - 1, y - 1) < radius;

    if (![luc, ruc, ldc, rdc].some(i => i) && !this.hasPoint(x, y)) {
      return this;
    }

    if ([luc, ruc, ldc, rdc].every(i => i)) {
      this.value = value;
      this.children = null;
      return this;
    }

    if (!this.isDivided())
      this.divide();

    const nr = radius * 2;
    const nlx = 2 * x;
    const nrx = 2 * x - 1;
    const nuy = 2 * y;
    const ndy = 2 * y - 1;
    this.children[0].drawCircle(nlx, nuy, nr, value, --recurseLevel);
    this.children[1].drawCircle(nrx, nuy, nr, value, recurseLevel);
    this.children[2].drawCircle(nlx, ndy, nr, value, recurseLevel);
    this.children[3].drawCircle(nrx, ndy, nr, value, recurseLevel);

    return this.reduce();
  }

  drawRect(x1, y1, x2, y2, value, recurseLevel) {
    if (recurseLevel <= 0)
      return

    if (recurseLevel === undefined) {
      recurseLevel = 10;
    }

    const luc = x1 <= 0 && 0 < x2 && y1 <= 0 && 0 < y2;
    const ruc = x1 <= 1 && 1 < x2 && y1 <= 0 && 0 < y2;
    const ldc = x1 <= 0 && 0 < x2 && y1 <= 1 && 1 < y2;
    const rdc = x1 <= 1 && 1 < x2 && y1 <= 1 && 1 < y2;

    if ([luc, ruc, ldc, rdc].every(i => i)) {
      this.value = value;
      this.children = null;
      return this;
    }

    const ol = Math.max(x1, x2) < 0;
    const or = Math.min(x1, x2) >= 1;
    const ou = Math.max(y1, y2) < 0;
    const od = Math.min(y1, y2) >= 1;
    if ([ol, or, ou, od].every(i => i))
      return this;

    if (!this.isDivided())
      this.divide();

    const nlx1 = 2 * x1;
    const nlx2 = 2 * x2;
    const nrx1 = 2 * x1 - 1;
    const nrx2 = 2 * x2 - 1;
    const nuy1 = 2 * y1;
    const nuy2 = 2 * y2;
    const ndy1 = 2 * y1 - 1;
    const ndy2 = 2 * y2 - 1;
    this.children[0].drawRect(nlx1, nuy1, nlx2, nuy2, value, --recurseLevel);
    this.children[1].drawRect(nrx1, nuy1, nrx2, nuy2, value, recurseLevel);
    this.children[2].drawRect(nlx1, ndy1, nlx2, ndy2, value, recurseLevel);
    this.children[3].drawRect(nrx1, ndy1, nrx2, ndy2, value, recurseLevel);

    return this.reduce();
  }

  drawPoly(points, value, recurseLevel) {
    if (recurseLevel <= 0)
      return;

    if (recurseLevel === undefined) {
      recurseLevel = 10;
    }

    // check if polygon border passes quadtree border
    if (
      !polygonIntersectsSquareBoundary(points)
      && !isPolygonInsideSquare(points)
    ) {
      if (isPointInPolygon([0.5, 0.5], points)) {
        this.value = value;
        this.children = null;
      }

      return this;
    }

    if (!this.isDivided())
      this.divide();

    const lupoints = points.map(([x, y]) => [2 * x, 2 * y]);
    const rupoints = points.map(([x, y]) => [2 * x - 1, 2 * y]);
    const ldpoints = points.map(([x, y]) => [2 * x, 2 * y - 1]);
    const rdpoints = points.map(([x, y]) => [2 * x - 1, 2 * y - 1]);
    this.children[0].drawPoly(lupoints, value, --recurseLevel);
    this.children[1].drawPoly(rupoints, value, recurseLevel);
    this.children[2].drawPoly(ldpoints, value, recurseLevel);
    this.children[3].drawPoly(rdpoints, value, recurseLevel);

    return this.reduce();
  }

  isHadInCircle(x, y, radius) {
    return Math.hypot(x - 0.5, y - 0.5) < radius;
  }

  hasPoint(x, y) {
    return 0 <= x && x < 1 && 0 <= y && y < 1;
  }

  setChild(index, value) {
    if (!(value instanceof Quadtree))
      throw new Error("child of quadtree must instanceof quadtree");

    this.children[index] = value;
    return this;
  }

  getValue() {
    if (!this.isDivided()) {
      return this.value;
    }

    const children = this.children.map(c => c.getValue());
    return getMostFrequent(children);
  }

  jsonify() {
    if (!this.isDivided()) {
      return this.value;
    }

    return [
      this.children[0].jsonify(),
      this.children[1].jsonify(),
      this.children[2].jsonify(),
      this.children[3].jsonify(),
    ];
  }
}

function getQuadtreeFromJson(json) {
  if (json instanceof Number || typeof json === "number") {
    return new Quadtree(json);
  }

  const result = new Quadtree(null).divide();
  result.setChild(0, getQuadtreeFromJson(json[0]));
  result.setChild(1, getQuadtreeFromJson(json[1]));
  result.setChild(2, getQuadtreeFromJson(json[2]));
  result.setChild(3, getQuadtreeFromJson(json[3]));
  return result;
}

if (require.main === module) {
  qt = new Quadtree(0);
 qt.drawPoly([
    [0.5, 0.1],
    [0.6175, 0.3412],
    [0.875, 0.3412],
    [0.675, 0.5412],
    [0.7587, 0.825],
    [0.5, 0.66],
    [0.2412, 0.825],
    [0.325, 0.5412],
    [0.125, 0.3412],
    [0.3825, 0.3412]
  ], 1);
  console.log(JSON.stringify(qt.jsonify(), null, 1));
}
