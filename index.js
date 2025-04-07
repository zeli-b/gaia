import { Quadtree } from "./quadtree.js";
import { Area, Layer, Structure, Project } from "./project.js";
import { Camera } from "./camera.js";

window.Quadtree = Quadtree;
window.Area = Area;
window.Layer = Layer;
window.Structure = Structure;

let canvas;
let ctx;
window.project = new Project("Untitled", new Layer("Layer 1"));
window.camera = new Camera(0.0, 0.0, 1.0);

document.addEventListener("DOMContentLoaded", () => {
  // canvas 불러오기 및 이벤트 추가
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext('2d');

  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  window.addEventListener("resize", e => {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    processFrame();
  });

  // 한프레임 처리
  processFrame();
});

/**
 * 계산 등 화면 렌더링에 필요한 부수적인 것들을
 * 계산하는 함수. 프레임마다 혹은 이벤트 발생 시마다 실행됨
 */
function tick() {
}

/**
 * 화면에 보이는 것들을 렌더링하는 함수
 * 프레임마다 혹은 이벤트 발생 시마다 실행됨
 */
function render() {
  // 배경 색 칠
  ctx.fillStyle = "lightgrey";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "grey";
  for (let x = 0; x < canvas.width; x += 20)
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.fillRect(x, y, 10, 10);
      ctx.fillRect(x + 10, y + 10, 10, 10);
    }

  window.project.render(canvas, ctx, window.camera);
}

/**
 * tick과 render 함수를 한번에 실행하는 함수
 *
 * 이벤트 처리 시에는 이 함수를 콜해서 화면을 업데이트해주어야 한다.
 */
function processFrame() {
  tick();
  render();
}
