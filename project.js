import { parseQuadtree, Quadtree } from "./quadtree.js";

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
    this._parentLayer = undefined;
    this._removed = false;
  }

  /**
   * 영역 정보를 프로젝트 패널에 렌더
   */
  renderDiv() {
    const container = document.createElement("div");
    container.style.borderLeft = `${this.color} 1px solid`;
    container.classList.add("structure-area");
    container.innerText = `${this.name} (${this.color})`;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "area";
    radio.checked = window.toolVar.area === this;
    radio.onclick = () => {
      document.dispatchEvent(
        new CustomEvent("selectarea", {detail: {area: this}})
      );
    };
    container.appendChild(radio);

    const recolorButton = document.createElement("button");
    recolorButton.style.display = "block";
    recolorButton.innerText = "Change Color";
    recolorButton.onclick = () => {
      const color = prompt("color");
      if (!color) return;
      this.color = color;
      document.dispatchEvent(
        new CustomEvent("processframe", {detail: {force: true}})
      );
    };
    container.appendChild(recolorButton);

    const renameButton = document.createElement("button");
    renameButton.style.display = "block";
    renameButton.innerText = "Change Name";
    renameButton.onclick = () => {
      const name = prompt("name");
      if (!name) return;
      this.name = name;
      document.dispatchEvent(new CustomEvent("processframe"));
    };
    container.appendChild(renameButton);

    const deleteButton = document.createElement("button");
    deleteButton.style.display = "block";
    deleteButton.innerText = "Remove Area";
    deleteButton.onclick = () => {
      if (prompt(this.name) !== this.name)
        return;
      this._removed = true;
      document.dispatchEvent(
        new CustomEvent("processframe", {detail: {force: true}})
      );
    };
    container.appendChild(deleteButton);

    return container;
  }

  /**
   * 영역의 아이디를 지정
   */
  setId(id) {
    this.id = id;
    return this;
  }

  setParentLayer(parentLayer) {
    this._parentLayer = parentLayer;
    return this;
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

    this._canvas = document.createElement("canvas");
    this._ctx = this._canvas.getContext("2d");
    this._rendered = false;
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
   * @param {boolean} [force] - 강제로 다시 그릴지 여부
   * @returns {Structure}
   */
  render(areas, canvas, context, camera, force = false) {
    if (this._rendered && !force) {
      const left = camera.convertMapToScreenX(canvas, 0) % camera.xZoom
        - camera.xZoom;
      const up = camera.convertMapToScreenY(canvas, 0);
      context.imageSmoothingEnabled = false;
      for (let x = left; x < canvas.width; x += camera.xZoom) {
        context.drawImage(this._canvas, x, up, camera.xZoom, camera.yZoom);
      }
      return;
    }

    this._canvas.width = Math.pow(2, this.figure.getDepth());
    this._canvas.height = this._canvas.width;
    this.figure.render(areas, this._canvas, this._ctx);
    this._rendered = true;
    this.render(areas, canvas, context, camera, false);
  }

  /**
   * 동일한 내용의 복제품을 반환
   * 이때, figure도 복사하여 반환함.
   */
  clone(year) {
    return new Structure(parseFloat(year), this.figure.clone());
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
    this.structures = [new Structure(0, new Quadtree(0))];
    this.areas = {
      0: new Area("No Name", "transparent").setId(0).setParentLayer(this)
    };
    this.unaffected = unaffected;
    this.childLayers = [];
    this.lastId = 0;
    this.parentAreaIds = parentAreaIds ? parentAreaIds : [];
    this.disabled = false;
    this.structureVisible = true;
    this.areaVisible = true;
    this._removed = false;
  }

  /**
   * 레이어를 화면에 보일 수 있게 렌더링한다
   * @param {number} year - 지도 렌더링될 연도
   * @param {canvas} canvas - 지도 렌더링될 레이어
   * @param {CanvasRenderingContext2D} context - 지도 2차원 렌더링 맥락
   * @param {Camera} camera - 현재 지도를 비추고 있는 카메라 객체
   * @param {boolean} force - 강제로 화면을 업데이트할지 결정
   * @returns {Layer}
   */
  render(year, canvas, context, camera, force = false) {
    if (this.disabled) return this;

    const structure = this.getStructure(year);

    if (structure) {
      structure.render(this.areas, canvas, context, camera, force);
    }

    this.childLayers.forEach(l => l.render(year, canvas, context, camera));

    return this;
  }

  removeSelf() {
    this._removed = true;
  }

  /**
   * 수정사항이 발생한 가장 마지막 연도를 반환
   */
  getLastYear() {
    let result = 0;

    const structure = this.getLastStructure();
    if (structure)
      result = Math.max(result, structure.startYear);

    this.childLayers.forEach(l => result = Math.max(l.getLastYear()));

    return result;
  }

  /**
   * 특정 연도에 표시되는 구조체를 반환
   * @param {number} year - 표시할 연도
   */
  getStructure(year) {
    const structures = this.structures;
    let left = 0;
    let right = structures.length - 1;
    let answer = null;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (structures[mid].startYear <= year) {
        answer = structures[mid];
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return answer;
  }

  /**
   * 연도에 해당하는 구조체가 있다면 그것을 반환하고
   * 없다면 하나를 생성해서 반환한다.
   */
  createStructureByYear(year) {
    const possible = this.getStructure(year);

    if (possible.startYear == year) {
      return possible;
    }

    const newStructure = possible.clone(year);
    this.addStructure(newStructure);
    return newStructure;
  }

  /**
   * 구조체에 대해 실행하는 콜백
   * @callback StructureCallback
   * @param {Structure} structure - 구조체
   */

  /**
   * 이 시간 이후의 모든 구조체에 대해 콜백을 실행
   * @param {number} year - 연도
   * @param {StructureCallback} callback - 구조체에 대해 실행할 함수
   */
  forEachStructureAfter(year, callback) {
    const now = this.getStructure(year);
    if (!now)
      return;

    let index = this.structures.indexOf(now);
    if (now.year < year)
      index++;

    for (; index < this.structures.length; index++) {
      callback(this.structures[index]);
    }

    return this;
  }

  /**
   * 프로젝트 레이어 패널에 표시될 내용을 렌더
   */
  renderDiv() {
    const container = document.createElement("div");
    container.classList.add("structure-layer");

    const layerTitle = document.createElement("span");

    const disableToggle = document.createElement("input");
    disableToggle.type = "checkbox";
    disableToggle.checked = !this.disabled;
    disableToggle.onchange = e => {
      this.disabled = !e.target.checked;
      document.dispatchEvent(
        new CustomEvent("processframe", {detail: {force: true}})
      );
    };
    layerTitle.appendChild(disableToggle);

    const structureToggle = document.createElement("input");
    structureToggle.type = "checkbox";
    structureToggle.checked = this.structureVisible;
    structureToggle.onchange = e => {
      this.structureVisible = e.target.checked;
      document.dispatchEvent(new CustomEvent("processframe"));
    };
    layerTitle.appendChild(structureToggle);

    const areaToggle = document.createElement("input");
    areaToggle.type = "checkbox";
    areaToggle.checked = this.areaVisible;
    areaToggle.onchange = e => {
      this.areaVisible = e.target.checked;
      document.dispatchEvent(new CustomEvent("processframe"));
    };
    layerTitle.appendChild(areaToggle);

    const realTitle = document.createElement("span");
    realTitle.innerText = this.name;
    layerTitle.appendChild(realTitle);

    const deleteLayerButton = document.createElement("button");
    deleteLayerButton.style.display = "block";
    deleteLayerButton.innerText = "Delete";
    deleteLayerButton.onclick = () => {
      if (prompt(this.name) !== this.name) return;
      this.removeSelf();
      document.dispatchEvent(
        new CustomEvent("processframe", {detail: {force: true}})
      );
    };
    layerTitle.appendChild(deleteLayerButton);
    
    const renameLayerButton = document.createElement("button");
    renameLayerButton.style.display = "block";
    renameLayerButton.innerText = "Rename";
    renameLayerButton.onclick = () => {
      const name = prompt("name");
      if (!name) return;
      this.name = name;
      document.dispatchEvent(new CustomEvent("processframe"));
    };
    layerTitle.appendChild(renameLayerButton);
    
    container.appendChild(layerTitle);

    if (!this.disabled) {
      if (this.structureVisible) {
        const structureDiv = document.createElement("div");
        structureDiv.classList.add("structure-structure-div");
        this.structures.forEach(s => {
          structureDiv.appendChild(s.renderDiv());
        });
        container.appendChild(structureDiv);
      }

      if (this.areaVisible) {
        const areasDiv = document.createElement("div");
        areasDiv.classList.add("structure-area-div");
        Object.keys(this.areas).forEach(k => {
          if (this.areas[k]._removed)
            delete this.areas[k];
        });
        Object.keys(this.areas).forEach(id => {
          const area = this.areas[id];
          areasDiv.appendChild(area.renderDiv());
        });
        container.appendChild(areasDiv);

        const newAreaButton = document.createElement("button");
        newAreaButton.style.display = "block";
        newAreaButton.innerText = "New Area";
        newAreaButton.onclick = () => {
          const name = prompt("name of the area");
          if (!name) return;
          const color = prompt("color of the area");
          if (!color) return;
          const area = new Area(name, color);
          this.addArea(area);
          document.dispatchEvent(new CustomEvent("processframe"));
        };
        areasDiv.appendChild(newAreaButton);
      }

      const layersDiv = document.createElement("div");
      layersDiv.classList.add("structure-layers-div");
      this.childLayers = this.childLayers.filter(l => !l._removed);
      this.childLayers.forEach(l => {
        layersDiv.appendChild(l.renderDiv());
      });
      container.appendChild(layersDiv);

      const newLayerButton = document.createElement("button");
      newLayerButton.style.display = "block";
      newLayerButton.innerText = "New Layer";
      newLayerButton.onclick = () => {
        const name = prompt("Layer Name");
        if (!name) return;
        const newLayer = new Layer(name);
        this.addChildLayer(newLayer);
        document.dispatchEvent(new CustomEvent("processframe"));
      };
      layersDiv.appendChild(newLayerButton);
    }

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
    area.setId(this.lastId);
    area._parentLayer = this;
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
   * 프로젝트 내 최후의 변경사항이 생긴 연도를 반환
   */
  getLastYear() {
    return this.baseLayer.getLastYear();
  }

  /**
   * 프로젝트를 JSON 문자열로 변환
   * @returns {string}
   */
  stringify() {
    return JSON.stringify(this, (key, value) => {
      if (key.match(/^_.+/)) {
        return undefined;
      }
      return value;
    }, 1);
  }

  /**
   * 프로젝트를 화면에 보일 수 있게 렌더링한다
   * @param {number} year - 지도 렌더링될 시각
   * @param {canvas} canvas - 지도 렌더링될 레이어
   * @param {CanvasRenderingContext2D} context - 지도 2차원 렌더링 맥락
   * @param {Camera} camera - 현재 지도를 비추고 있는 카메라 객체
   * @param {boolean} force - 강제로 화면을 렌더할지 결정
   * @returns {Project}
   */
  render(year, canvas, context, camera, force = false) {
    this.baseLayer.render(year, canvas, context, camera, force);
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
    return area;
  }

  function parseStructure(structureData) {
    return new Structure(
      structureData.startYear,
      parseQuadtree(structureData.figure)
    );
  }

  function parseLayer(layerData) {
    const layer = new Layer(
      layerData.name, layerData.unaffected, layerData.parentAreaIds
    );
    layer.lastId = layerData.lastId;
    layer.areas = {};
    layer.structures = [];

    // areas: Dictionary<int, Area>
    for (const [id, areaData] of Object.entries(layerData.areas)) {
      const area = parseArea(areaData);
      area.id = Number(id);
      area._parentLayer = layer;
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

