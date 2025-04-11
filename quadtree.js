const DEFAULT_DEPTH = 10;

/**
 * 점(x, y)이 정사각형 영역(0~1) 밖에 있다면, 해당 점에서 가장 가까운 정사각형 경계까지의 거리를 계산함
 * @param {number} x - 점의 x 좌표
 * @param {number} y - 점의 y 좌표
 * @returns {number} - 거리
 */
function pointToRectDistance(x, y) {
  const xmin = 0.0, ymin = 0.0;
  const xmax = 1.0, ymax = 1.0;

  let dx = 0.0;
  if (x < xmin) {
    dx = xmin - x;
  } else if (x > xmax) {
    dx = x - xmax;
  }

  let dy = 0.0;
  if (y < ymin) {
    dy = ymin - y;
  } else if (y > ymax) {
    dy = y - ymax;
  }

  return Math.hypot(dx, dy);
}

/**
 * 다각형의 AABB (Axis-Aligned Bounding Box)를 계산
 * @param {Array<Array<number>>} points - [x, y] 형식의 꼭짓점 배열
 * @returns {{x1: number, y1: number, x2: number, y2: number}} - 최소/최대 좌표로 이루어진 바운딩 박스
 */
function getPolygonBoundingBox(points) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}

/**
 * 객체의 값을 정규화하여 전체 합이 1이 되도록 함
 * @param {Object} obj - 키-값 쌍으로 구성된 숫자형 객체
 * @returns {Object} - 정규화된 결과 객체
 */
function normalizeProportion(obj) {
  const total = Object.values(obj).reduce((sum, val) => sum + val, 0);
  if (total === 0) return obj; // or handle edge case differently

  const result = {};
  for (const key in obj) {
    result[key] = obj[key] / total;
  }
  return result;
}

/**
 * 모든 점이 정사각형(0~1) 내부에 존재하는지 확인
 * @param {Array<Array<number>>} points - 다각형 꼭짓점 배열
 * @returns {boolean} - 모두 내부에 있으면 true
 */
function isPolygonInsideSquare(points) {
  for (const [x, y] of points) {
    if (x < 0.0 || x > 1.0 || y < 0.0 || y > 1.0) {
      return false; // 한 점이라도 정사각형 밖이면 false
    }
  }
  return true; // 모든 점이 정사각형 내부
}

/**
 * 점이 다각형 내부에 있는지 여부를 판별
 * @param {Array<number>} point - [x, y] 좌표
 * @param {Array<Array<number>>} polygon - 다각형 꼭짓점 배열
 * @returns {boolean} - 내부에 있으면 true
 */
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

/**
 * 세 점의 방향이 반시계 방향인지 확인
 * @param {Array<number>} A - 첫 번째 점 [x, y]
 * @param {Array<number>} B - 두 번째 점 [x, y]
 * @param {Array<number>} C - 세 번째 점 [x, y]
 * @returns {boolean} - 반시계 방향이면 true
 */
function ccw(A, B, C) {
  return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
}

/**
 * 두 선분이 교차하는지 여부 확인
 * @param {Array<number>} A - 선분 1의 시작점
 * @param {Array<number>} B - 선분 1의 끝점
 * @param {Array<number>} C - 선분 2의 시작점
 * @param {Array<number>} D - 선분 2의 끝점
 * @returns {boolean} - 교차하면 true
 */
function segmentsIntersect(A, B, C, D) {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

/**
 * 다각형의 변이 정사각형(0~1)의 경계와 교차하는지 확인
 * @param {Array<Array<number>>} points - 다각형 꼭짓점 배열
 * @returns {boolean} - 경계와 교차하면 true
 */
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

/**
 * 배열에서 가장 자주 등장한 값을 반환
 * @param {Array<any>} arr - 검색 대상 배열
 * @returns {any} - 가장 빈도 높은 값
 */
function getMostFrequent(arr) {
  const hashmap = arr.reduce( (acc, val) => {
    acc[val] = (acc[val] || 0 ) + 1
    return acc
  },{});

  return Object.keys(hashmap)
    .reduce((a, b) => hashmap[a] > hashmap[b] ? a : b);
}

export class Quadtree {
  /**
   * Quadtree를 생성
   * @param {any} value - 초기 값
   */
  constructor(value) {
    this.value = value;
    this.children = null;
    this.isReduced = true;
  }

  /**
   * 자식 노드가 있는지 여부 확인
   * @returns {boolean} - 자식이 존재하면 true
   */
  isDivided() {
    return this.children !== null;
  }

  /**
   * 현재 셀을 4개의 자식 셀로 분할
   * @returns {Quadtree} - 분할된 현재 인스턴스
   */
  divide() {
    if (this.isDivided())
      throw new Error("Quadtree already divided");

    this.children = [
      new Quadtree(this.value),
      new Quadtree(this.value),
      new Quadtree(this.value),
      new Quadtree(this.value),
    ];

    this.isReduced = false;

    return this;
  }

  /**
   * 자식 셀들의 값이 동일하다면 병합하여 단일 셀로 축소
   * @returns {Quadtree} - 병합 결과
   */
  reduce() {
    if (this.isReduced)
      return this;

    if (!this.isDivided())
      return this;

    this.children.forEach(c => c.reduce());

    if (this.children.some(c => c.isDivided())) {
      return this;
    }

    const value = this.children
      .reduce((a, b) => a !== null && a.value === b.value ? a : null);
    
    if (value === null) {
      return this;
    }

    this.children = null;
    this.value = value.value;
    this.isReduced = true;

    return this;
  }

  /**
   * 원을 재귀적으로 그리는 함수
   * @param {number} x - 원 중심의 x 좌표
   * @param {number} y - 원 중심의 y 좌표
   * @param {number} radius - 반지름 (0~1)
   * @param {any} value - 채울 값
   * @param {any} [ellipseRate] - 가로:세로 비율
   * @param {number} [recurseLevel=DEFAULT_DEPTH] - 최대 재귀 깊이
   * @returns {Quadtree}
   */
  drawCircle(x, y, radius, value, ellipseRate = 1, recurseLevel = DEFAULT_DEPTH) {
    if (recurseLevel <= 0)
      return this;

    const distance = pointToRectDistance((x - 0.5) * ellipseRate + 0.5, y);
    if (distance > radius)
      return this;

    const luc = Math.hypot((x - 0) / ellipseRate, y - 0) < radius;
    const ruc = Math.hypot((x - 1) / ellipseRate, y - 0) < radius;
    const ldc = Math.hypot((x - 0) / ellipseRate, y - 1) < radius;
    const rdc = Math.hypot((x - 1) / ellipseRate, y - 1) < radius;

    if (luc && ruc && ldc && rdc) {
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
    recurseLevel--;
    this.children[0].drawCircle(nlx, nuy, nr, value, ellipseRate, recurseLevel);
    this.children[1].drawCircle(nrx, nuy, nr, value, ellipseRate, recurseLevel);
    this.children[2].drawCircle(nlx, ndy, nr, value, ellipseRate, recurseLevel);
    this.children[3].drawCircle(nrx, ndy, nr, value, ellipseRate, recurseLevel);

    return this.reduce();
  }

  /**
   * 사각형을 재귀적으로 그리는 함수
   * @param {number} x1 - 좌상단 x 좌표
   * @param {number} y1 - 좌상단 y 좌표
   * @param {number} x2 - 우하단 x 좌표
   * @param {number} y2 - 우하단 y 좌표
   * @param {any} value - 채울 값
   * @param {number} [recurseLevel=DEFAULT_DEPTH] - 최대 재귀 깊이
   * @returns {Quadtree}
   */
  drawRect(x1, y1, x2, y2, value, recurseLevel = DEFAULT_DEPTH) {
    if (recurseLevel <= 0)
      return

    if (x1 > x2) [x1, x2] = [x2, x1];
    if (y1 > y2) [y1, y2] = [y2, y1];

    // 사각형이 셀을 완전히 포함하면 즉시 채움
    if (x1 <= 0 && x2 >= 1 && y1 <= 0 && y2 >= 1) {
      this.value = value;
      this.children = null;
      return this;
    }

    // 사각형과 셀 겹침이 없으면 탈출
    if (x2 < 0 || x1 > 1 || y2 < 0 || y1 > 1) {
      return this;
    }

    if (!this.isDivided())
      this.divide();

    recurseLevel--;
    const nlx1 = 2 * x1;
    const nlx2 = 2 * x2;
    const nrx1 = 2 * x1 - 1;
    const nrx2 = 2 * x2 - 1;
    const nuy1 = 2 * y1;
    const nuy2 = 2 * y2;
    const ndy1 = 2 * y1 - 1;
    const ndy2 = 2 * y2 - 1;
    this.children[0].drawRect(nlx1, nuy1, nlx2, nuy2, value, recurseLevel);
    this.children[1].drawRect(nrx1, nuy1, nrx2, nuy2, value, recurseLevel);
    this.children[2].drawRect(nlx1, ndy1, nlx2, ndy2, value, recurseLevel);
    this.children[3].drawRect(nrx1, ndy1, nrx2, ndy2, value, recurseLevel);

    return this.reduce();
  }

  /**
   * 다각형을 재귀적으로 그리는 함수
   * @param {Array<Array<number>>} points - 꼭짓점 배열
   * @param {any} value - 채울 값
   * @param {number} [recurseLevel=DEFAULT_DEPTH] - 최대 재귀 깊이
   * @param {Object} [boundingBox] - AABB 바운딩 박스 (없으면 자동 계산)
   * @returns {Quadtree}
   */
  drawPoly(points, value, recurseLevel = DEFAULT_DEPTH, boundingBox = undefined) {
    if (recurseLevel <= 0)
      return;

    // AABB 계산 및 교차 여부 판단
    if (boundingBox === undefined) {
      boundingBox = getPolygonBoundingBox(points);
    }

    const cellBox = { x1: 0, y1: 0, x2: 1, y2: 1 };

    // AABB 충돌 없으면 바로 탈출
    if (
      boundingBox.x2 < cellBox.x1 || boundingBox.x1 > cellBox.x2 ||
      boundingBox.y2 < cellBox.y1 || boundingBox.y1 > cellBox.y2
    ) {
      return this;
    }

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

    const lupoints = [], rupoints = [], ldpoints = [], rdpoints = [];
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      lupoints.push([2 * x, 2 * y]);
      rupoints.push([2 * x - 1, 2 * y]);
      ldpoints.push([2 * x, 2 * y - 1]);
      rdpoints.push([2 * x - 1, 2 * y - 1]);
    }

    const luBox = {
      x1: 2 * boundingBox.x1,
      y1: 2 * boundingBox.y1,
      x2: 2 * boundingBox.x2,
      y2: 2 * boundingBox.y2
    };

    const ruBox = {
      x1: 2 * boundingBox.x1 - 1,
      y1: 2 * boundingBox.y1,
      x2: 2 * boundingBox.x2 - 1,
      y2: 2 * boundingBox.y2
    };

    const ldBox = {
      x1: 2 * boundingBox.x1,
      y1: 2 * boundingBox.y1 - 1,
      x2: 2 * boundingBox.x2,
      y2: 2 * boundingBox.y2 - 1
    };

    const rdBox = {
      x1: 2 * boundingBox.x1 - 1,
      y1: 2 * boundingBox.y1 - 1,
      x2: 2 * boundingBox.x2 - 1,
      y2: 2 * boundingBox.y2 - 1
    };

    this.children[0].drawPoly(lupoints, value, recurseLevel - 1, luBox);
    this.children[1].drawPoly(rupoints, value, recurseLevel - 1, ruBox);
    this.children[2].drawPoly(ldpoints, value, recurseLevel - 1, ldBox);
    this.children[3].drawPoly(rdpoints, value, recurseLevel - 1, rdBox);

    return this.reduce();
  }

  /**
   * 마스크 쿼드트리를 기준으로 현재 셀의 값을 수정
   * @param {Quadtree} binaryQuadtree - 마스크 역할의 쿼드트리
   * @param {any} fallbackValue - 마스킹 시 대체할 값
   * @param {function(any): boolean} [isZero] - 마스킹 조건 판별 함수
   * @returns {Quadtree}
   */
  mask(binaryQuadtree, fallbackValue, isZero = v => v === 0) {
    if (!binaryQuadtree.isDivided()) {
      if (isZero(binaryQuadtree.value)) {
        this.value = fallbackValue;
        this.children = null;
        return this;
      }

      return this;
    }

    if (!this.isDivided())
      this.divide();

    for (let i = 0; i < 4; i++) {
      this.children[i].mask(binaryQuadtree.children[i], fallbackValue, isZero);
    }

    return this.reduce();
  }

  /**
   * 다른 쿼드트리와 겹치는 영역을 현재 셀에 덮어쓰기
   * @param {Quadtree} qt - 덮어쓸 기준 쿼드트리
   * @param {function(any): boolean} [isZero] - 무시할 값 조건
   * @returns {Quadtree}
   */
  overlap(qt, isZero = v => v === 0) {
    if (!qt.isDivided()) {
      if (isZero(qt.value)) {
        return;
      }

      this.value = qt.value;
      this.children = null;
      return this;
    }

    if (!this.isDivided())
      this.divide();

    for (let i = 0; i < 4; i++) {
      this.children[i].overlap(qt.children[i], isZero);
    }

    return this.reduce();
  }

  /**
   * 겹치는 부분을 제외하고 현재 셀에 덮어쓰기
   * @param {Quadtree} qt - 비교 대상 쿼드트리
   * @param {any} [fallbackValue=0] - 겹칠 경우 쓸 값
   * @param {function(any): boolean} [isZero] - 비교 조건
   * @returns {Quadtree}
   */
  excludeOverlap(qt, fallbackValue = 0, isZero = v => v === 0) {
    if (!qt.isDivided()) {
      if (isZero(qt.value)) {
        return this;
      }

      if (!this.isDivided()) {
        if (isZero(this.value)) {
          this.value = qt.value;
        } else {
          this.value = fallbackValue;
        }

        return this;
      }

      for (let i = 0; i < 4; i++) {
        this.children[i].excludeOverlap(qt, fallbackValue, isZero);
      }

      return this.reduce();
    }

    if (!this.isDivided())
      this.divide();

    for (let i = 0; i < 4; i++) {
      this.children[i].excludeOverlap(qt.children[i], fallbackValue, isZero);
    }

    return this.reduce();
  }

  /**
   * 두 쿼드트리 사이의 차이를 계산.
   * 일반적으로 overlap의 역연산을 정의.
   * this를 변경하지 않고 새로운 개체를 생성함
   */
  difference(qt, fallbackValue = 0) {
    if (!qt.isDivided()) {
      if (!this.isDivided()) {
        if (qt.getValue() === this.getValue()) {
          return new Quadtree(fallbackValue);
        }
        return new Quadtree(qt.getValue());
      }

      const result = new Quadtree(fallbackValue).divide();
      for (let i = 0; i < 4; i++) {
        result.setChild(i, this.children[i].difference(qt));
      }
      return result.reduce();
    }

    const result = new Quadtree(fallbackValue).divide();
    if (!this.isDivided()) {
      for (let i = 0; i < 4; i++) {
        result.setChild(i, this.difference(qt.children[i]));
      }
      return result.reduce();
    }

    for (let i = 0; i < 4; i++) {
      result.setChild(i, this.children[i].difference(qt.children[i]));
    }
    return result.reduce();
  }

  /**
   * 대상과 겹치는 부분을 제거
   */
  exclude(qt, fallbackValue = 0, isZero = v => v === 0) {
    if (!qt.isDivided()) {
      if (isZero(qt.getValue()))
        return this;

      this.value = fallbackValue;
      this.children = null;
      return this;
    }

    if (!this.isDivided())
      this.divide();

    for (let i = 0; i < 4; i++) {
      this.children[i].exclude(qt.children[i], fallbackValue, isZero);
    }

    return this;
  }

  floodFillAt(x, y, newValue) {
    const { node: startNode, x0, y0, size } = this.findLeafAt(x, y);
    const originalValue = startNode.value;
    if (originalValue === newValue) return this;

    const queue = [{ node: startNode, x0, y0, size }];
    const visited = new Set();

    while (queue.length > 0) {
      const { node, x0, y0, size } = queue.shift();
      const key = `${x0},${y0},${size}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (node.value !== originalValue) continue;

      node.value = newValue;

      const neighbors = this.findAdjacentLeaves(node, x0, y0, size);
      for (const neighbor of neighbors) {
        const nk = `${neighbor.x0},${neighbor.y0},${neighbor.size}`;
        if (!visited.has(nk) && neighbor.node.value === originalValue) {
          queue.push(neighbor);
        }
      }
    }

    return this;
  }

  findLeafAt(x, y, x0 = 0, y0 = 0, size = 1) {
    if (!this.isDivided()) {
      return { node: this, x0, y0, size };
    }

    const half = size / 2;
    const midX = x0 + half;
    const midY = y0 + half;

    if (x < midX && y < midY) {
      return this.children[0].findLeafAt(x, y, x0, y0, half);
    } else if (x >= midX && y < midY) {
      return this.children[1].findLeafAt(x, y, midX, y0, half);
    } else if (x < midX && y >= midY) {
      return this.children[2].findLeafAt(x, y, x0, midY, half);
    } else {
      return this.children[3].findLeafAt(x, y, midX, midY, half);
    }
  }

  collectLeafNodes(x0 = 0, y0 = 0, size = 1, result = []) {
    if (!this.isDivided()) {
      result.push({ node: this, x0, y0, size });
      return result;
    }

    const half = size / 2;
    this.children[0].collectLeafNodes(x0, y0, half, result);
    this.children[1].collectLeafNodes(x0 + half, y0, half, result);
    this.children[2].collectLeafNodes(x0, y0 + half, half, result);
    this.children[3].collectLeafNodes(x0 + half, y0 + half, half, result);

    return result;
  }

  findAdjacentLeaves(targetNode, x0, y0, size) {
    const neighbors = [];
    const allLeaves = this.collectLeafNodes();

    for (const { node, x0: nx, y0: ny, size: nsize } of allLeaves) {
      if (node === targetNode) continue;

      const touches =
        (Math.abs(x0 - (nx + nsize)) < 1e-10 || Math.abs((x0 + size) - nx) < 1e-10) &&
        !(y0 + size <= ny || y0 >= ny + nsize) ||
        (Math.abs(y0 - (ny + nsize)) < 1e-10 || Math.abs((y0 + size) - ny) < 1e-10) &&
        !(x0 + size <= nx || x0 >= nx + nsize);

      if (touches) {
        neighbors.push({ node, x0: nx, y0: ny, size: nsize });
      }
    }

    return neighbors;
  }

  /**
   * 좌표에 해당하는 리프 노드의 값을 반환
   * @param {number} x
   * @param {number} y
   * @returns {any}
   */
  getValueAt(x, y) {
    if (!this.isDivided()) {
      return this.value;
    }

    const half = 0.5;
    if (x < half && y < half) return this.children[0].getValueAt(x * 2, y * 2);       // LU
    if (x >= half && y < half) return this.children[1].getValueAt((x - half) * 2, y * 2); // RU
    if (x < half && y >= half) return this.children[2].getValueAt(x * 2, (y - half) * 2); // LD
    return this.children[3].getValueAt((x - half) * 2, (y - half) * 2);              // RD
  }

  /**
   * 쿼드트리를 화면에 보일 수 있게 렌더링한다
   * @param {object} areas - 각 색상에 대한 정보
   * @param {canvas} canvas - 지도 렌더링될 레이어
   * @param {CanvasRenderingContext2D} context - 지도 2차원 렌더링 맥락
   * @param {Camera} camera - 현재 지도를 비추고 있는 카메라 객체
   * @param {number} depth - 함수 실행 깊이
   * @param {number} dx - 배치 위치 오프셋
   * @param {number} dy - 배치 위치 오프셋
   * @returns {Quadtree}
   */
  render(areas, canvas, context, dx = 0, dy = 0, depth = 0) {
    const size = canvas.width / Math.pow(2, depth);

    if (!this.isDivided()) {
      if (this.getValue() === null)
        return;

      const color = areas[this.getValue()].color;

      context.fillStyle = color;
      context.fillRect(dx, dy, size, size);
      return this;
    }

    depth++;
    const half = size / 2;
    this.children[0].render(
      areas, canvas, context, dx, dy, depth
    );
    this.children[1].render(
      areas, canvas, context, dx+half, dy, depth
    );
    this.children[2].render(
      areas, canvas, context, dx, dy+half, depth
    );
    this.children[3].render(
      areas, canvas, context, dx+half, dy+half, depth
    );

    return this;
  }

  drawMergedOutline(canvas, ctx, depth = DEFAULT_DEPTH) {
    const cells = [];
    const edges = new Set();

    // 리프 노드 수집
    this.collectLeafNodes(0, 0, 1, cells);

    // 빨간색 경계선 (값이 다른 리프 노드 사이)
    const hmap = new Map();
    const vmap = new Map();

    for (const { x0, y0, size, node } of cells) {
      const v = node.value;

      function addEdge(map, key, start, len, value) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ start, len, value });
      }

      addEdge(hmap, y0, x0, size, v);
      addEdge(hmap, y0 + size, x0, size, v);
      addEdge(vmap, x0, y0, size, v);
      addEdge(vmap, x0 + size, y0, size, v);
    }

    function findEdges(map, isVertical) {
      const redEdges = [];
      for (const [key, entries] of map.entries()) {
        entries.sort((a, b) => a.start - b.start);
        for (let i = 0; i < entries.length; i++) {
          const e1 = entries[i];
          for (let j = i + 1; j < entries.length; j++) {
            const e2 = entries[j];
            if (e2.start >= e1.start + e1.len) break;
            if (e1.value !== e2.value) {
              const from = Math.max(e1.start, e2.start);
              const to = Math.min(e1.start + e1.len, e2.start + e2.len);
              const fx = isVertical ? key : from;
              const fy = isVertical ? from : key;
              const tx = isVertical ? key : to;
              const ty = isVertical ? to : key;
              redEdges.push({ fx, fy, tx, ty });
            }
          }
        }
      }
      return redEdges;
    }

    const redLines = [
      ...findEdges(hmap, false),
      ...findEdges(vmap, true)
    ];

    for (const { fx, fy, tx, ty } of redLines) {
      ctx.beginPath();
      ctx.moveTo(fx * canvas.width, fy * canvas.height);
      ctx.lineTo(tx * canvas.width, ty * canvas.height);
      ctx.stroke();
    }
  }

  /**
   * 쿼드트리가 비어있는지 확인
   * @param {number} [withValue] - 이것으로 쿼드트리가 가득차있는지 확인
   */
  isEmpty(withValue = 0) {
    return !this.isDivided() && this.getValue() === withValue;
  }

  /**
   * 현재 셀의 중심이 주어진 원 내에 포함되는지 확인
   * @param {number} x - 원 중심 x
   * @param {number} y - 원 중심 y
   * @param {number} radius - 반지름
   * @returns {boolean}
   */
  isHadInCircle(x, y, radius) {
    return Math.hypot(x - 0.5, y - 0.5) < radius;
  }

  /**
   * 좌표가 현재 셀의 범위 내에 있는지 확인
   * @param {number} x - x 좌표
   * @param {number} y - y 좌표
   * @returns {boolean}
   */
  hasPoint(x, y) {
    return 0 <= x && x < 1 && 0 <= y && y < 1;
  }

  /**
   * 쿼드트리의 최대 깊이를 출력.
   * 만약 쿼드트리가 나누어져있지 않다면 0을 출력함.
   */
  getDepth() {
    if (!this.isDivided()) {
      return 0;
    }

    return this.children.reduce((a, b) => Math.max(a, b.getDepth()), 0) + 1;
  }

  /**
   * 셀 내 값의 비율을 계산 (재귀적으로 하위 셀 포함)
   * @param {number} recurseLevel - 재귀 깊이
   * @returns {Object} - {값: 비율}
   */
  getValueProportion(recurseLevel = DEFAULT_DEPTH) {
    if (recurseLevel <= 0) {
      const proportionMap = {};
      proportionMap[this.getValue()] = 1.0;
      return proportionMap;
    }

    if (!this.isDivided()) {
      const proportionMap = {};
      proportionMap[this.value] = 1.0;
      return proportionMap;
    }

    const proportionMap = {};

    recurseLevel--;
    this.children.forEach(child => {
      const childProportions = child.getValueProportion(recurseLevel);
      for (const key in childProportions) {
        if (proportionMap[key]) {
          proportionMap[key] += childProportions[key] * 0.25;
        } else {
          proportionMap[key] = childProportions[key] * 0.25;
        }
      }
    });

    return normalizeProportion(proportionMap);
  }

  /**
   * 특정 자식 인덱스에 값을 수동 설정
   * @param {number} index - 0~3 (LU, RU, LD, RD)
   * @param {Quadtree} value - 할당할 자식 쿼드트리
   * @returns {Quadtree}
   */
  setChild(index, value) {
    if (!(value instanceof Quadtree))
      throw new Error("child of quadtree must instanceof quadtree");

    this.children[index] = value;
    return this;
  }

  /**
   * 현재 셀의 대표 값을 반환 (자식이 있으면 가장 빈도 높은 값)
   * @returns {any}
   */
  getValue() {
    if (!this.isDivided()) {
      return this.value;
    }

    const children = this.children.map(c => c.getValue());
    return getMostFrequent(children);
  }

  /**
   * 쿼드트리를 JSON 형태로 직렬화
   * @returns {any}
   */
  toJSON() {
    if (!this.isDivided()) {
      return this.value;
    }

    return [
      this.children[0].toJSON(),
      this.children[1].toJSON(),
      this.children[2].toJSON(),
      this.children[3].toJSON(),
    ];
  }

  /**
   * 복제품을 만든다
   */
  clone() {
    return parseQuadtree(this.toJSON());
  }
}

/**
 * JSON 데이터를 Quadtree 객체로 파싱
 * @param {any} json - JSON 또는 숫자 값
 * @returns {Quadtree}
 */
export function parseQuadtree(json) {
  if (json instanceof Number || typeof json === "number") {
    return new Quadtree(json);
  }

  const result = new Quadtree(null).divide();
  result.setChild(0, parseQuadtree(json[0]));
  result.setChild(1, parseQuadtree(json[1]));
  result.setChild(2, parseQuadtree(json[2]));
  result.setChild(3, parseQuadtree(json[3]));
  return result;
}
