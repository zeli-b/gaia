import { Quadtree } from "./quadtree.js";
import { Area, Layer, Structure, Project, parseProject } from "./project.js";
import { Camera } from "./camera.js";

window.Quadtree = Quadtree;
window.Area = Area;
window.Layer = Layer;
window.Structure = Structure;

// 도구 관련 기능들
const toolVar = {};
window.toolVar = toolVar;
const tools = {
  span: {
    id: "span",
    label: "Span",
    adds: {
      touchstart: e => {
        const touch = e.touches[0];
        toolVar.px = touch.screenX;
        toolVar.py = touch.screenY;
      },
      touchmove: e => {
        const touch = e.touches[0];

        if (toolVar.px && toolVar.py && !scaling) {
          const dx = (touch.screenX - toolVar.px) * window.devicePixelRatio;
          const dy = (touch.screenY - toolVar.py) * window.devicePixelRatio;

          window.camera.setX(window.camera.x - dx / window.camera.xZoom);
          window.camera.setY(window.camera.y - dy / window.camera.yZoom);
          processFrame();
        }

        toolVar.px = touch.screenX;
        toolVar.py = touch.screenY;
      },
      mousedown: e => {
        toolVar.px = e.screenX;
        toolVar.py = e.screenY;
        toolVar.isSpanning = true;
      },
      mouseup: e => {
        toolVar.px = undefined;
        toolVar.py = undefined;
        toolVar.isSpanning = false;
      },
      mousemove: e => {
        if (toolVar.isSpanning) {
          const dx = (e.screenX - toolVar.px) * window.devicePixelRatio;
          const dy = (e.screenY - toolVar.py) * window.devicePixelRatio;

          window.camera.setX(window.camera.x - dx / window.camera.xZoom);
          window.camera.setY(window.camera.y - dy / window.camera.yZoom);
          processFrame();
        }

        toolVar.px = e.screenX;
        toolVar.py = e.screenY;
      }
    }
  },
  zoom: {
    id: "zoom",
    label: "Zoom",
    adds: {
      mousedown: e => {
        toolVar.px = e.screenX;
        toolVar.py = e.screenY;
        toolVar.isSpanning = true;
      },
      mouseup: e => {
        toolVar.px = undefined;
        toolVar.py = undefined;
        toolVar.isSpanning = false;
      },
      mousemove: e => {
        if (toolVar.isSpanning) {
          const dx = (e.screenX - toolVar.px) * window.devicePixelRatio;
          const dy = (e.screenY - toolVar.py) * window.devicePixelRatio;
          const d = dx - dy;

          window.camera.setXZoom(window.camera.xZoom * Math.exp(d * 0.002));
          window.camera.setYZoom(window.camera.yZoom * Math.exp(d * 0.002));
          processFrame();
        }

        toolVar.px = e.screenX;
        toolVar.py = e.screenY;
      }
    }
  },
  brush: {
    id: "brush",
    label: "brush",
    adds: {
      touchmove: e => {
        const touch = e.touches[0];
        const cx = (touch.clientX - canvas.offsetLeft) * window.devicePixelRatio;
        const cy = (touch.clientY - canvas.offsetTop) * window.devicePixelRatio;
        const x = window.camera.convertScreenToMapX(canvas, cx);
        const y = window.camera.convertScreenToMapY(canvas, cy);
        const mx = (x % 1 + 1) % 1;
        const radius = 0.05;
        const area = toolVar.area;

        toolVar.areas = area._parentLayer.areas;

        toolVar.structure.figure.drawCircle(mx - 1, y, radius, area.id, 0.5);
        toolVar.structure.figure.drawCircle(mx + 0, y, radius, area.id, 0.5);
        toolVar.structure.figure.drawCircle(mx + 1, y, radius, area.id, 0.5);
        processFrame(true);
      }
    },
    init: () => {
      toolVar.structure = new Structure(0, new Quadtree(0));

      const applyButton = document.createElement("button");
      applyButton.innerText = "Apply";
      applyButton.onclick = () => {
        const year = parseFloat(presentInput.value);
        const change = toolVar.structure;
        const layer = toolVar.area._parentLayer;

        layer.createStructureByYear(year);
        layer.forEachStructureAfter(year, s => s.figure.overlap(change.figure));
        toolVar.structure = new Structure(0, new Quadtree(0));
        processFrame(true);
      };
      toolPropertiesDiv.appendChild(applyButton);
    }
  }
};
window.tools = tools;
let nowTool;

function setTool(toolId) {
  if (nowTool) {
    // remove previous tools
    const prvTool = tools[nowTool];
    Object.keys(prvTool.adds).forEach(k => {
      const v = prvTool.adds[k];
      window.removeEventListener(k, v);
    });
  }

  toolPropertiesDiv.innerHTML = "";

  // apply mew tools
  const tool = tools[toolId];

  if (!tool)
    throw new Error("Tool not found");

  if (tool.init) tool.init();

  Object.keys(tool.adds).forEach(k => {
    const v = tool.adds[k];
    window.addEventListener(k, v);
  });

  nowTool = tool.id;
}

/**
 * 화면 크기 변경에 대응하여 캔버스의 크기를 재조정
 */
function resizeCanvas() {
  canvas.width = 0;
  canvas.height = 0;
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;

  const propertiesDiv = document.querySelector("#properties");
  propertiesDiv.style.height = `${canvas.clientHeight - 8}px`;
}

const topbar = [
  {
    id: "open-project",
    label: "Open",
    onclick: () => {
      let input = document.createElement('input');
      input.type = 'file';
      input.onchange = () => {
        // you can use this method to get file and perform respective operations
        const file = input.files[0];
        const read = new FileReader();
        read.readAsText(file, 'UTf-8');
        read.onloadend = () => {
          const project = parseProject(read.result);
          loadProject(project);
          processFrame(true);
        }
      };
      input.click();
    }
  },
  {
    id: "save-project",
    label: "Save",
    onclick: () => {
      const text = window.project.stringify();
      const filename = window.project.name + ".json";

      const a = document.createElement('a');
      a.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
      );
      a.setAttribute('download', filename);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  },
  {
    id: "fullscreen",
    label: "Fullscreen",
    onclick: () => {
      // 파츠 불러오기
      const propertiesDiv = document.querySelector("#properties");
      const toolbarDiv = document.querySelector("#toolbar");
      const topbarDiv = document.querySelector("#topbar");
      const bottombarDiv = document.querySelector("#bottombar");
      const exitFullscreenDiv = document.querySelector("#exit-fullscreen");

      propertiesDiv.style.display = "none";
      toolbarDiv.style.display = "none";
      topbarDiv.style.display = "none";
      bottombarDiv.style.display = "none";
      exitFullscreenDiv.style.display = "block";
      processFrame();
    }
  },
  {
    id: "process-frame",
    label: "Process Frame",
    onclick: () => {
      processFrame(true);
    }
  },
];

let canvas;
let ctx;
window.project = new Project("Untitled", new Layer("Layer 1"));
window.camera = new Camera(0.5, 0.5, 1000.0, 500.0);

let presentInput;
let projectStructureDiv;
let toolPropertiesDiv;

// 페이지 DOM이 로드되었을 때 실행할 동작을 정의
document.addEventListener("DOMContentLoaded", () => {
  // canvas 불러오기 및 이벤트 추가
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext('2d');

  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  window.addEventListener("resize", processFrame);

  // present
  presentInput = document.querySelector("#present");
  presentInput.onchange = e => {
    processFrame(true);
  };

  // toolPropertiesDiv
  toolPropertiesDiv = document.querySelector("#tool-properties");

  // topbar items
  const topbarDiv = document.querySelector("#topbar");
  topbar.forEach(({ id, label, onclick }) => {
    const span = document.createElement("span");
    span.innerText = label;
    span.id = id;
    span.onclick = onclick;
    topbarDiv.appendChild(span);
  });

  // toolbar items
  const toolbarDiv = document.querySelector("#toolbar");
  Object.values(tools).forEach(t => {
    const div = document.createElement("div");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "tool";
    radio.onclick = () => {
      setTool(t.id);
    };
    div.appendChild(radio);
    const span = document.createElement("span");
    span.innerText = t.label;
    div.appendChild(span);
    toolbarDiv.appendChild(div);
  });

  // exit fullscreen process
  const exitFullscreenDiv = document.querySelector("#exit-fullscreen");
  exitFullscreenDiv.onclick = () => {
      // 파츠 불러오기
      const propertiesDiv = document.querySelector("#properties");
      const bottombarDiv = document.querySelector("#bottombar");
      const exitFullscreenDiv = document.querySelector("#exit-fullscreen");

      propertiesDiv.style.display = "block";
      toolbarDiv.style.display = "block";
      topbarDiv.style.display = "block";
      bottombarDiv.style.display = "block";
      exitFullscreenDiv.style.display = "none";
      processFrame();
  };

  // projectStructureDiv
  projectStructureDiv = document.querySelector("#project-structure");

  // 한프레임 처리
  processFrame(true);
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

  presentInput.value = project.getLastYear();
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
 * @param {boolean} [force] - 강제로 화면를 렌더할지 결정
 */
function render(force = false) {
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
  const year = presentInput.value;
  window.project.render(year, canvas, ctx, window.camera, force);

  // render 경도선, 위도선
  
  // 적도선
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, window.camera.convertMapToScreenY(canvas, 0.5));
  ctx.lineTo(canvas.width, window.camera.convertMapToScreenY(canvas, 0.5));
  ctx.stroke();
  
  // 북위 30도선
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, window.camera.convertMapToScreenY(canvas, 1 / 3));
  ctx.lineTo(canvas.width, window.camera.convertMapToScreenY(canvas, 1 / 3));
  ctx.stroke();

  // 북위 60도선
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, window.camera.convertMapToScreenY(canvas, 1 / 6));
  ctx.lineTo(canvas.width, window.camera.convertMapToScreenY(canvas, 1 / 6));
  ctx.stroke();

  // 남위 30도선
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, window.camera.convertMapToScreenY(canvas, 2 / 3));
  ctx.lineTo(canvas.width, window.camera.convertMapToScreenY(canvas, 2 / 3));
  ctx.stroke();

  // 남위 60도선
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, window.camera.convertMapToScreenY(canvas, 5 / 6));
  ctx.lineTo(canvas.width, window.camera.convertMapToScreenY(canvas, 5 / 6));
  ctx.stroke();

  // 경도선
  const start = Math.floor(window.camera.convertScreenToMapX(canvas, 0)) * 12;
  const end = Math.ceil(window.camera.convertScreenToMapX(canvas, canvas.width)) * 12;
  const yStart = window.camera.convertMapToScreenY(canvas, 0);
  const yEnd = window.camera.convertMapToScreenY(canvas, 1);
  for (let x = start; x < end; x++) {
    if (x % 12 === 6) {
      ctx.strokeStyle = "red";
    } else
      ctx.strokeStyle = "black";
    const sx = window.camera.convertMapToScreenX(canvas, x / 12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, yStart);
    ctx.lineTo(sx, yEnd);
    ctx.stroke();
  }
}

/**
 * tick과 render 함수를 한번에 실행하는 함수
 * 이벤트 처리 시에는 이 함수를 콜해서 화면을 업데이트해주어야 한다.
 * @param {boolean} [force] - 강제로 화면을 렌더할지 결정
 */
export function processFrame(force = false) {
  renderProjectStructureDiv();
  resizeCanvas();
  tick();
  render(force);

  if (nowTool === tools.brush.id) {
    toolVar.structure.render(toolVar.areas, canvas, ctx, window.camera, force);
  }
}
window.processFrame = processFrame;
document.addEventListener("processframe", e => processFrame(e.detail?.force));

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
    scaling = getPinchDistance(e) * window.devicePixelRatio;
    pinchCenter = getPinchPosition(e);
  }
});

window.addEventListener("touchmove", e => {
  if (event.scale !== 1) { event.preventDefault(); }

  if (scaling > 0) {
    const newScale = getPinchDistance(e) * window.devicePixelRatio;
    // window.camera.zoom *= newScale / scaling;
    window.camera.setXZoom(window.camera.xZoom * (newScale / scaling));
    window.camera.setYZoom(window.camera.yZoom * (newScale / scaling));
    scaling = newScale;

    const newPosition = getPinchPosition(e);
    const dx = (newPosition[0] - pinchCenter[0]) * window.devicePixelRatio;
    const dy = (newPosition[1] - pinchCenter[1]) * window.devicePixelRatio;
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

// 스크롤 확대 축 기능
window.addEventListener("wheel", e => {
  window.camera.setXZoom(window.camera.xZoom * Math.exp(e.deltaY * 0.002));
  window.camera.setYZoom(window.camera.yZoom * Math.exp(e.deltaY * 0.002));

  processFrame();
})

// 트랙패드 줌 기능
window.addEventListener("wheel", e => {
  if (e.ctrlKey) {
    e.preventDefault();

    window.camera.setXZoom(window.camera.xZoom * Math.exp(e.deltaY * -0.002));
    window.camera.setYZoom(window.camera.yZoom * Math.exp(e.deltaY * -0.002));

    processFrame();
  }
}, { passive: false });

// 영역 선택 처리
document.addEventListener("selectarea", e => {
  toolVar.area = e.detail.area;
});
