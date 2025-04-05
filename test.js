import { Quadtree } from "./quadtree.js";

function quadtreeTest1() {
  const qt = new Quadtree(0);

  // 7. 전체 배경 텍스처 느낌의 큰 원 (value: 2)
  qt.drawCircle(0.5, 0.5, 0.5, 1);

  // 1. 별 모양 중앙 (value: 1)
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
  ], 2);

  qt.drawCircle(0.2, 0.2, 0.15, 3);

  qt.drawRect(0.75, 0.75, 0.95, 0.95, 4);

  // 4. 중심에 겹쳐지는 작은 원 (value: 2)
  qt.drawCircle(0.5, 0.5, 0.15, 5);

  // 5. 좌하단 장식용 직사각형 (value: 1)
  qt.drawRect(0.05, 0.8, 0.2, 0.95, 6);

  // 6. 우상단 큰 원 (value: 3)
  qt.drawCircle(0.8, 0.2, 0.18, 7);

  console.log(JSON.stringify(qt.jsonify()));
}

quadtreeTest1();
