import { Quadtree, parseQuadtree } from "./quadtree.js";
import { Camera } from "./camera.js";

/**
 * 영역(Area)을 나타내는 클래스
 *
 * 영역은 name과 color, id로 이루어져 있으며
 * id는 레이어에 등록될 때에 자동으로 부여된다.
 * 즉, 영역은 구조체를 이루기 전에 레이어에 등록되어야 한다.
 */
export class Area {
  /**
   * @param {string} name - 영역 이름
   * @param {string} color - 영역 색상
   */
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.id = undefined; // 영역 식별자
  }

  /**
   * 영역 정보를 프로젝트 패널에 렌더
   */
  renderDiv() {
    const container = document.createElement("div");
    container.classList.add("structure-area");
    container.innerText = `${this.name} (${this.color})`;

    return container;
  }
}

/**
 * 구조체(Structure)를 나타내는 클래스
 *
 * 구조체는 시간선상의 지도를 나타낸다.
 * startYear는 아벨리카력으로 시간을 나타내고,
 * figure은 Quadtree 오브젝트이다:
 * figure은 값으로 영역의 id를 참조한다.
 */
export class Structure {
  /**
   * @param {number} startYear - 시작 연도
   * @param {any} figure - 구조를 나타내는 도형(예: 쿼드트리)
   */
  constructor(startYear, figure) {
    this.startYear = startYear;
    this.figure = figure;
  }

  /**
   * 구조 패널에서 구조체를 렌더
   */
  renderDiv() {
    const container = document.createElement("div");
    container.classList.add("structure-structure");
    container.innerText = `Structure from ${this.startYear}`;

    return container;
  }

  /**
   * 레이어를 화면에 보일 수 있게 렌더링한다
   * @param {object} areas - 각 색상에 대한 정보
   * @param {canvas} canvas - 지도 렌더링될 레이어
   * @param {CanvasRenderingContext2D} context - 지도 2차원 렌더링 맥락
   * @param {Camera} camera - 현재 지도를 비추고 있는 카메라 객체
   * @returns {Structure}
   */
  render(areas, canvas, context, camera) {
    this.figure.render(areas, canvas, context, camera);
    return this;
  }
}

/**
 * 레이어(Layer)는 여러 구조체와 영역을 포함하는 단위
 */
export class Layer {
  /**
   * @param {string} name - 레이어 이름
   * @param {boolean} [unaffected=false] - 외부의 영향을 받지 않는 레이어 여부
   * @param {number[] | null} [parentAreaIds=null] - 부모 영역 ID 배열
   */
  constructor(name, unaffected = false, parentAreaIds = null) {
    this.name = name;
    this.structures = [];
    this.areas = {}; // key: 영역 ID, value: Area 객체
    this.unaffected = unaffected;
    this.childLayers = [];
    this.lastId = 0;
    this.parentAreaIds = parentAreaIds ? parentAreaIds : [];
    this.disabled = false;
  }

  /**
   * 레이어를 화면에 보일 수 있게 렌더링한다
   * @param {canvas} canvas - 지도 렌더링될 레이어
   * @param {CanvasRenderingContext2D} context - 지도 2차원 렌더링 맥락
   * @param {Camera} camera - 현재 지도를 비추고 있는 카메라 객체
   * @returns {Layer}
   */
  render(canvas, context, camera) {
    if (this.disabled) return this;

    const structure = this.getLastStructure();

    if (structure)
      structure.render(this.areas, canvas, context, camera);

    this.childLayers.forEach(l => l.render(canvas, context, camera));

    return this;
  }

  /**
   * 프로젝트 레이어 패널에 표시될 내용을 렌더
   */
  renderDiv() {
    const container = document.createElement("div");
    container.classList.add("structure-layer");

    const layerTitle = document.createElement("span");
    layerTitle.innerText = this.name;

    const disableToggle = document.createElement("input");
    disableToggle.type = "checkbox";
    disableToggle.checked = true;
    disableToggle.onchange = e => {
      this.disabled = !e.target.checked;
      processFrame();
    };
    layerTitle.appendChild(disableToggle);
    
    container.appendChild(layerTitle);

    const structureDiv = document.createElement("div");
    structureDiv.classList.add("structure-structure-div");
    const structure = this.getLastStructure();
    if (structure) {
      structureDiv.appendChild(structure.renderDiv());
      container.appendChild(structureDiv);
    }

    const areasDiv = document.createElement("div");
    areasDiv.classList.add("structure-area-div");
    Object.keys(this.areas).forEach(id => {
      const area = this.areas[id];
      areasDiv.appendChild(area.renderDiv());
    });
    container.appendChild(areasDiv);

    const layersDiv = document.createElement("div");
    layersDiv.classList.add("structure-layers-div");
    this.childLayers.forEach(l => {
      layersDiv.appendChild(l.renderDiv());
    });
    container.appendChild(layersDiv);

    return container;
  }

  /**
   * 구조체 추가
   * @param {Structure} structure 
   */
  addStructure(structure) {
    this.structures.push(structure);
    this.structures.sort((a, b) => a.startYear - b.startYear); // 시작 연도 기준 정렬
  }

  /**
   * 마지막 구조체 반환
   * @returns {Structure}
   */
  getLastStructure() {
    return this.structures[this.structures.length - 1];
  }

  /**
   * 영역 추가
   * @param {Area} area 
   */
  addArea(area) {
    this.areas[++this.lastId] = area;
    area.id = this.lastId;
  }

  /**
   * 자식 레이어 추가
   * @param {Layer} layer 
   */
  addChildLayer(layer) {
    this.childLayers.push(layer);
  }
}

/**
 * 프로젝트 단위를 정의하는 클래스
 */
export class Project {
  /**
   * @param {string} name - 프로젝트 이름
   * @param {Layer} baseLayer - 기본 레이어
   */
  constructor(name, baseLayer) {
    this.name = name;
    this.baseLayer = baseLayer;
    this.gaiaVersion = 1;
  }

  /**
   * 프로젝트를 JSON 문자열로 변환
   * @returns {string}
   */
  stringify() {
    return JSON.stringify(this, null, 1);
  }

  /**
   * 프로젝트를 화면에 보일 수 있게 렌더링한다
   * @param {canvas} canvas - 지도 렌더링될 레이어
   * @param {CanvasRenderingContext2D} context - 지도 2차원 렌더링 맥락
   * @param {Camera} camera - 현재 지도를 비추고 있는 카메라 객체
   * @returns {Project}
   */
  render(canvas, context, camera) {
    this.baseLayer.render(canvas, context, camera);
  }

  /**
   * 프로젝트 구조 패널에 들어갈 내용을 렌더
   */
  renderDiv() {
    // container div
    const container = document.createElement("div");

    // name div
    const nameDiv = document.createElement("div");
    nameDiv.innerText = this.name;
    container.appendChild(nameDiv);

    // layers
    const layerDiv = this.baseLayer.renderDiv();
    container.appendChild(layerDiv);

    return container;
  }
}

/**
 * JSON 데이터를 Project 객체로 파싱
 * @param {string | object} json - JSON 문자열 또는 객체
 * @returns {Project}
 */
export function parseProject(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;

  function parseArea(areaData) {
    const area = new Area(areaData.name, areaData.color);
    area.id = areaData.id;
    return area;
  }

  function parseStructure(structureData) {
    return new Structure(
      structureData.startYear,
      parseQuadtree(structureData.figure)
    );
  }

  function parseLayer(layerData) {
    const layer = new Layer(layerData.name, layerData.unaffected, layerData.parentAreaIds);
    layer.lastId = layerData.lastId;

    // areas: Dictionary<int, Area>
    for (const [id, areaData] of Object.entries(layerData.areas)) {
      const area = parseArea(areaData);
      area.id = Number(id);
      layer.areas[area.id] = area;
    }

    // structures: List<Structure>
    for (const struct of layerData.structures) {
      layer.addStructure(parseStructure(struct));
    }

    // childLayers: List<Layer>
    for (const child of layerData.childLayers) {
      layer.addChildLayer(parseLayer(child));
    }

    return layer;
  }

  const baseLayer = parseLayer(data.baseLayer);
  return new Project(data.name, baseLayer);
}

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
window.camera = new Camera(0.5, 0.5, 1000.0);

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
    window.camera.zoom *= newScale / scaling;
    scaling = newScale;

    const newPosition = getPinchPosition(e);
    const dx = newPosition[0] - pinchCenter[0];
    const dy = newPosition[1] - pinchCenter[1];
    window.camera.x -= dx / window.camera.zoom;
    window.camera.y -= dy / window.camera.zoom;
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
