import { Quadtree } from "./quadtree.js";
import { Area, Layer, Structure, Project, parseProject } from "./project.js";
import { Camera } from "./camera.js";

window.Quadtree = Quadtree;
window.Area = Area;
window.Layer = Layer;
window.Structure = Structure;

const COLLISION_OVERLAP = "overlap";
const COLLISION_EXCLUDE = "exclude";
const COLLISION_LOSE = "lose";

// 도구 관련 기능들
let toolVar = {};
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
      touchstart: () => {
        pushUndoStack();
      },
      touchmove: e => {
        const touch = e.touches[0];
        const cx = (touch.clientX - canvas.offsetLeft) * window.devicePixelRatio;
        const cy = (touch.clientY - canvas.offsetTop) * window.devicePixelRatio;

        if (cx > canvas.width || cx < 0) return;

        const x = window.camera.convertScreenToMapX(canvas, cx);
        const y = window.camera.convertScreenToMapY(canvas, cy);
        const mx = (x % 1 + 1) % 1;
        const radius = toolVar.radius;
        const area = toolVar.area;

        toolVar.cx = cx;
        toolVar.cy = cy;

        toolVar.areas = area._parentLayer.areas;

        const depth = Math.round(Math.log2(window.camera.xZoom));
        toolVar.structure.figure.drawCircle(mx - 1, y, radius, area.id, 0.5, depth);
        toolVar.structure.figure.drawCircle(mx + 0, y, radius, area.id, 0.5, depth);
        toolVar.structure.figure.drawCircle(mx + 1, y, radius, area.id, 0.5, depth);
        processFrame();
      },
      mousedown: e => {
        toolVar.brushing = true;
        pushUndoStack();
      },
      mousemove: e => {
        const cx = (e.clientX - canvas.offsetLeft) * window.devicePixelRatio;
        const cy = (e.clientY - canvas.offsetTop) * window.devicePixelRatio;

        if (cx > canvas.width || cx < 0) return;

        toolVar.cx = cx;
        toolVar.cy = cy;
        processFrame();

        if (!toolVar.brushing) return;

        const x = window.camera.convertScreenToMapX(canvas, cx);
        const y = window.camera.convertScreenToMapY(canvas, cy);
        const mx = (x % 1 + 1) % 1;
        const radius = toolVar.radius;
        const area = toolVar.area;

        toolVar.areas = area._parentLayer.areas;

        const depth = Math.round(Math.log2(window.camera.xZoom));
        toolVar.structure.figure.drawCircle(mx - 1, y, radius, area.id, 0.5, depth);
        toolVar.structure.figure.drawCircle(mx + 0, y, radius, area.id, 0.5, depth);
        toolVar.structure.figure.drawCircle(mx + 1, y, radius, area.id, 0.5, depth);
        processFrame();
      },
      mouseup: e => {
        toolVar.brushing = false;
      }
    },
    init: () => {
      toolVar.structure = new Structure(0, new Quadtree(null));

      const sizeRange = document.createElement("input");
      sizeRange.style.display = "block";
      sizeRange.type = "range";
      sizeRange.min = 4;
      sizeRange.max = 200;
      sizeRange.step = 1;
      sizeRange.value = 16;
      toolVar.radius = sizeRange.value / window.camera.yZoom;
      sizeRange.onchange = e => {
        toolVar.radius = sizeRange.value / window.camera.yZoom;
        toolVar.cx = canvas.width / 2;
        toolVar.cy = canvas.height / 2;
        processFrame();
      };
      toolPropertiesDiv.appendChild(sizeRange);

      const cs = addCollisionStrategySelect();
      addStructureApplyButton(cs);
    },
    render: force => {
      const radius = toolVar.radius * window.camera.yZoom;
      ctx.beginPath();
      ctx.arc(toolVar.cx, toolVar.cy, radius, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.globalAlpha = 0.4;
      toolVar.structure.render(toolVar.areas, canvas, ctx, window.camera, true);
    }
  },
  paint: {
    id: "paint",
    label: "Paint",
    adds: {
      touchstart: e => {
        if (!toolVar.area) return;

        const touch = e.touches[0];
        const cx = (touch.clientX - canvas.offsetLeft) * window.devicePixelRatio;
        const cy = (touch.clientY - canvas.offsetTop) * window.devicePixelRatio;

        if (cx > canvas.width || cx < 0) return;

        pushUndoStack();

        const x = window.camera.convertScreenToMapX(canvas, cx);
        const y = window.camera.convertScreenToMapY(canvas, cy);

        const year = parseFloat(presentInput.value);
        const layer = toolVar.area._parentLayer;
        const preexist = layer.getStructure(year);
        const structure = layer.createStructureByYear(year).clone();

        structure.figure.floodFillAt(x, y, toolVar.area.id);
        const diff = preexist.figure.difference(structure.figure);

        toolVar.structure.figure = diff;

        processFrame(true);
      },
      mousedown: e => {
        if (!toolVar.area) return;

        const cx = (e.clientX - canvas.offsetLeft) * window.devicePixelRatio;
        const cy = (e.clientY - canvas.offsetTop) * window.devicePixelRatio;

        if (cx > canvas.width || cx < 0) return;

        pushUndoStack();

        const x = window.camera.convertScreenToMapX(canvas, cx);
        const y = window.camera.convertScreenToMapY(canvas, cy);

        const year = parseFloat(presentInput.value);
        const layer = toolVar.area._parentLayer;
        const preexist = layer.getStructure(year);
        const structure = layer.createStructureByYear(year).clone();

        structure.figure.floodFillAt(x, y, toolVar.area.id);
        const diff = preexist.figure.difference(structure.figure);

        toolVar.structure.figure = diff;

        processFrame(true);
      }
    },
    init: () => {
      const cs = addCollisionStrategySelect();
      addStructureApplyButton(cs);
    },
    render: force => {
      ctx.globalAlpha = 0.4;
      toolVar.structure.render(toolVar.areas, canvas, ctx, window.camera, true);
    }
  }
};
window.tools = tools;

function addStructureApplyButton() {
  const applyButton = document.createElement("button");
  applyButton.style.display = "block";
  applyButton.innerText = "Apply";
  applyButton.onclick = () => {
    const year = parseFloat(presentInput.value);
    const change = toolVar.structure;
    const layer = toolVar.area._parentLayer;
    const strategy = toolVar.collisionStrategy;

    const thisYear = layer.createStructureByYear(year);
    const isNull = c => c === null;
    const isNotNull = c => c !== null;
    let p = thisYear.clone();
    thisYear.figure.overlap(change.figure, isNull);
    layer.forEachStructureAfter(year, (s) => {
      if (strategy === COLLISION_OVERLAP) {
        s.figure.overlap(change.figure, isNull);
      } else if (strategy === COLLISION_EXCLUDE) {
        s.figure.excludeOverlap(change.figure, 0, isNull);
      } else if (strategy === COLLISION_LOSE) {
        const od = p.figure.difference(s.figure, null);
        change.figure.mask(od, null, isNotNull);
        s.figure.overlap(change.figure, isNull);
        p = s;
      }
    });
    change.figure = new Quadtree(null);
    processFrame(true);
  };
  toolPropertiesDiv.appendChild(applyButton);
}


function addCollisionStrategySelect() {
  const collisionStrategy = document.createElement("select");
  collisionStrategy.style.display = "block";
  collisionStrategy.name = "collisionStrategy";
  collisionStrategy.onchange = () => {
    toolVar.collisionStrategy = collisionStrategy.value;
  };

  const option1 = document.createElement("option");
  option1.innerText = "Overlap";
  option1.value = COLLISION_OVERLAP;
  collisionStrategy.appendChild(option1);

  const option2 = document.createElement("option");
  option2.innerText = "Exclude";
  option2.value = COLLISION_EXCLUDE;
  collisionStrategy.appendChild(option2);

  const option3 = document.createElement("option");
  option3.innerText = "Lose";
  option3.value = COLLISION_LOSE;
  collisionStrategy.appendChild(option3);

  collisionStrategy.value = COLLISION_LOSE;
  toolVar.collisionStrategy = collisionStrategy.value;
  toolPropertiesDiv.appendChild(collisionStrategy);

  return collisionStrategy;
}

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

  processFrame();
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
  {
    id: "undo",
    label: "Undo",
    onclick: () => {
      popUndoStack();
    }
  },
];

let canvas;
let ctx;
window.project = new Project("Untitled", new Layer("Layer 1"));
window.camera = new Camera(0.5, 0.5, 1000.0, 500.0);

let presentInput, presentInputRange;
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
  presentInputRange = document.querySelector("#present-range");
  presentInput.onchange = e => {
    presentInputRange.value = e.target.value;
    processFrame(true);
  };
  presentInputRange.onchange = e => {
    presentInput.value = e.target.value;
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
  presentInputRange.max = project.getLastYear();
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
  const transparentSize = 5 * window.devicePixelRatio;
  for (let x = 0; x < canvas.width; x += transparentSize * 2)
    for (let y = 0; y < canvas.height; y += transparentSize * 2) {
      ctx.fillRect(x, y, transparentSize, transparentSize);
      ctx.fillRect(
        x + transparentSize, y + transparentSize,
        transparentSize, transparentSize
      );
    }

  window.camera.updateOnlyChild(canvas);
  if (window.camera.update) {
    force = true;
    window.camera.update = false;
  }
  
  // render project
  const year = presentInput.value;
  window.project.render(year, canvas, ctx, window.camera, force);

  drawParallels();

  // tool render
  if (nowTool) {
    const renderCallback = tools[nowTool].render;
    if (renderCallback) renderCallback(force);
  }
}

/* render 경도선, 위도선
 */
function drawParallels() {
  ctx.lineWidth = 1;

  // 촘촘한 위도선
  const deltaY = Math.pow(
    10, Math.round(Math.log10(canvas.height / window.camera.yZoom) + 1.7));
  if (deltaY < 100) {
    ctx.strokeStyle = "black";
    for (let y = 0; y <= 180; y += deltaY) {
      const screenY = window.camera.convertMapToScreenY(canvas, y / 180);
      if (screenY < 0)
        continue;
      if (screenY > canvas.height)
        break;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
      ctx.stroke();
    }

    for (let y = 0; ; y += deltaY) {
      const screenY = window.camera.convertMapToScreenX(canvas, y / 360);
      if (screenY < 0)
        continue;
      if (screenY > canvas.width)
        break;

      ctx.beginPath();
      ctx.moveTo(screenY, 0);
      ctx.lineTo(screenY, canvas.height);
      ctx.stroke();
    }
  }

  // 위도선
  {
    // 적도선
    ctx.strokeStyle = "red";
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
  }

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
  ctx.globalAlpha = 1.0;

  renderProjectStructureDiv();
  resizeCanvas();
  tick();
  render(force);

  presentInputRange.max = window.project.getLastYear() + 1;
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
  if (
    toolVar.area
    && toolVar.area._parentLayer !== e.detail.area._parentLayer
  ) {
    toolVar.structure.figure = new Quadtree(null);
  }

  toolVar.area = e.detail.area;
  processFrame(true);
});

// 실행취소 되돌리기 기능
const undoStack = [];
const undoCount = 20;

function pushUndoStack() {
  if (undoStack.length >= undoCount) {
    undoStack.splice(0, 1);
  }

  undoStack.push([project.clone(), {...toolVar}]);
}
document.addEventListener("pushundo", pushUndoStack);

function popUndoStack() {
  if (undoStack.length <= 0) return;
  
  [window.project, toolVar] = undoStack.pop();
  window.toolVar = toolVar;
  processFrame(true);
}
