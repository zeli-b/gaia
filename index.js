import { Quadtree } from "./quadtree.js";
import { Area, Layer, Structure, Project, parseProject } from "./project.js";
import { Camera } from "./camera.js";

window.Quadtree = Quadtree;
window.Area = Area;
window.Layer = Layer;
window.Structure = Structure;

/**
 * 화면 크기 변경에 대응하여 캔버스의 크기를 재조정
 */
function resizeCanvas() {
    canvas.width = 0;
    canvas.height = 0;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    processFrame();
}

let canvas;
let ctx;
window.project = new Project("Untitled", new Layer("Layer 1"));
window.camera = new Camera(0.5, 0.5, 1000.0, 500.0);

let projectStructureDiv;

// 페이지 DOM이 로드되었을 때 실행할 동작을 정의
document.addEventListener("DOMContentLoaded", () => {
  // 파츠 불러오기
  const propertiesDiv = document.querySelector("#properties");
  const toolbarDiv = document.querySelector("#toolbar");
  const topbarDiv = document.querySelector("#topbar");
  const bottombarDiv = document.querySelector("#bottombar");

  // canvas 불러오기 및 이벤트 추가
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext('2d');

  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  window.addEventListener("resize", resizeCanvas);

  // projectStructureDiv
  projectStructureDiv = document.querySelector("#project-structure");

  // Open Project 반응
  const openProjectDiv = document.querySelector("#open-project");
  openProjectDiv.onclick = () => {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => {
      // you can use this method to get file and perform respective operations
      const file = input.files[0];
      const read = new FileReader();
      read.readAsBinaryString(file);
      read.onloadend = () => {
        const project = parseProject(read.result);
        loadProject(project);
        processFrame();
      }
    };
    input.click();
  };

  // Fullscreen 반응
  const fullscreenDiv = document.querySelector("#fullscreen");
  fullscreenDiv.onclick = () => {
    propertiesDiv.style.display = "none";
    toolbarDiv.style.display = "none";
    topbarDiv.style.display = "none";
    bottombarDiv.style.display = "none";
    resizeCanvas();
  };

  const processFrameDiv = document.querySelector("#process-frame");
  processFrameDiv.onclick = () => {
    processFrame();
  };

  // 한프레임 처리
  processFrame();
});

/**
 * 프로젝트 구조 패널을 업데이트
 */
function renderProjectStructureDiv() {
  projectStructureDiv.innerHTML = "";
  projectStructureDiv.appendChild(project.renderDiv());
}

/**
 * 프로젝트를 적용
 * @param {Project} project - 불러올 프로젝트
 */
function loadProject(project) {
  window.project = project;

  renderProjectStructureDiv();
}

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

  // render project
  window.project.render(canvas, ctx, window.camera);
}

/**
 * tick과 render 함수를 한번에 실행하는 함수
 *
 * 이벤트 처리 시에는 이 함수를 콜해서 화면을 업데이트해주어야 한다.
 */
export function processFrame() {
  tick();
  render();
}
window.processFrame = processFrame;
document.addEventListener("processframe", processFrame);

// 휴대폰 핀치 스크롤 대응
let scaling = 0;
let pinchCenter = null;

/**
 * 터치 관련 이벤트를 받아서 두 손가락 사이의 거리를 측정
 */
function getPinchDistance(e) {
  return Math.hypot(
    e.touches[0].pageX - e.touches[1].pageX,
    e.touches[0].pageY - e.touches[1].pageY
  );
}

/**
 * 터치 관련 이벤트를 받아서 두 손가락 사이의 평균 위치를 측정
 */
function getPinchPosition(e) {
  const x = (e.touches[0].pageX + e.touches[1].pageX) / 2;
  const y = (e.touches[0].pageY + e.touches[1].pageY) / 2;
  return [x, y];
}

window.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    scaling = getPinchDistance(e);
    pinchCenter = getPinchPosition(e);
  }
});

window.addEventListener("touchmove", e => {
  if (event.scale !== 1) { event.preventDefault(); }

  if (scaling > 0) {
    const newScale = getPinchDistance(e);
    // window.camera.zoom *= newScale / scaling;
    window.camera.setXZoom(window.camera.xZoom * (newScale / scaling));
    window.camera.setYZoom(window.camera.yZoom * (newScale / scaling));
    scaling = newScale;

    const newPosition = getPinchPosition(e);
    const dx = newPosition[0] - pinchCenter[0];
    const dy = newPosition[1] - pinchCenter[1];
    window.camera.setX(window.camera.x - dx / window.camera.xZoom);
    window.camera.setY(window.camera.y - dy / window.camera.yZoom);
    pinchCenter = newPosition;
    
    processFrame();
  }
}, { passive: false });

window.addEventListener("touchend", e => {
  if (scaling) {
    scaling = 0;
    pinchCenter = null;
  }
});
