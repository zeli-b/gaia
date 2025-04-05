import { Quadtree } from "./quadtree.js";
import { Project, Layer, Area, Structure } from "./project.js";

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

function quadtreeTest2() {
  const qt = new Quadtree(0);
  qt.drawCircle(0.5, 0.5, 0.5, 1);

  const qf = new Quadtree(1);
  // qf.drawCircle(1.0, 0.5, 0.5, 0);

  qt.mask(qf, 0);

  console.log(JSON.stringify(qt.toJSON()));
}

quadtreeTest2();

function projectTest1() {
  // terrain
  const bl = new Layer("Terrain");

  const blaroc = new Area("Ocean", "blue");
  bl.addArea(blaroc);
  const blarla = new Area("Land", "green");
  bl.addArea(blarla);

  const blst1fig = new Quadtree(blaroc.id);
  blst1fig.drawRect(0.5, 0.0, 1.0, 1.0, blarla.id);
  const blst1 = new Structure(0, blst1fig);

  bl.addStructure(blst1);

  // weather
  const we = new Layer("Weather");

  const wearno = new Area("Good", "lightgrey");
  we.addArea(wearno);
  const wearza = new Area("Snow", "white");
  we.addArea(wearza);

  const west1fig = new Quadtree(wearno.id);
  west1fig.drawRect(0.0, 0.0, 1.0, 0.5, wearza.id);
  const west1 = new Structure(0, west1fig);
  we.addStructure(west1);

  const west2fig = new Quadtree(wearno.id);
  west2fig.drawRect(0.25, 0.0, 0.75, 0.5, wearza.id);
  const west2 = new Structure(1, west2fig);
  we.addStructure(west2);

  bl.addChildLayer(we);

  // country
  const co = new Layer("Country");

  const coarno = new Area("No Country", "grey");
  co.addArea(coarno);
  const coarza = new Area("Zasoque", "yellow");
  co.addArea(coarza);

  const cost1fig = new Quadtree(coarno.id);
  cost1fig.drawRect(0.5, 0.0, 1.0, 0.5, coarza.id);
  const cost1 = new Structure(0, cost1fig);
  co.addStructure(cost1);

  bl.addChildLayer(co);

  // project
  const pr = new Project("Sat Worldmap", bl);

  console.log(pr.stringify());
}
