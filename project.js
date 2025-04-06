import { parseQuadtree } from "./quadtree.js";

/**
 * 영역(Area)을 나타내는 클래스
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
}

/**
 * 구조체(Structure)를 나타내는 클래스
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
    return self.structures[self.structures.length - 1];
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
  }

  /**
   * 프로젝트를 JSON 문자열로 변환
   * @returns {string}
   */
  stringify() {
    return JSON.stringify(this, null, 1);
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
    return new Area(areaData.name, areaData.color);
  }

  function parseStructure(structureData) {
    return new Structure(
      structureData.startYear,
      parseQuadtree(structureData.figure)
    );
  }

  function parseLayer(layerData) {
    const layer = new Layer(layerData.name, layerData.unaffected);

    // 영역 파싱
    for (const [id, area] of Object.entries(layerData.areas)) {
      layer.addArea(Number(id), parseArea(area)); // 문제 있음: addArea는 id를 넘기지 않음
    }

    // 구조체 파싱
    for (const struct of layerData.structures) {
      layer.addStructure(parseStructure(struct));
    }

    // 자식 레이어 파싱
    for (const child of layerData.childLayers) {
      layer.addChildLayer(parseLayer(child));
    }

    return layer;
  }

  const baseLayer = parseLayer(data.baseLayer);
  return new Project(data.name, baseLayer);
}
