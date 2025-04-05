export class Area {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }
}

export class Structure {
  constructor(startYear, figure) {
    this.startYear = startYear;
    this.figure = figure;  // 예: { type: "Quadtree", nodes: {...} }
  }
}

export class Layer {
  constructor(name, unaffected = false) {
    this.name = name;
    this.structures = [];
    this.areas = {}; // key: int (id), value: Area
    this.unaffected = unaffected;
    this.childLayers = [];
  }

  addStructure(structure) {
    this.structures.push(structure);
    this.structures.sort((a, b) => a.startYear - b.startYear); // SortedList 효과
  }

  addArea(id, area) {
    this.areas[id] = area;
  }

  addChildLayer(layer) {
    this.childLayers.push(layer);
  }
}

export class Project {
  constructor(name, baseLayer) {
    this.name = name;
    this.baseLayer = baseLayer;
  }

  toJSON() {
    return JSON.stringify(this);
  }
}

export function parseProject(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;

  function parseArea(areaData) {
    return new Area(areaData.name, areaData.color);
  }

  function parseStructure(structureData) {
    return new Structure(structureData.startYear, structureData.figure);
  }

  function parseLayer(layerData) {
    const layer = new Layer(layerData.name, layerData.unaffected);

    // areas: Dictionary<int, Area>
    for (const [id, area] of Object.entries(layerData.areas)) {
      layer.addArea(Number(id), parseArea(area));
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

if (require.main === module) {
}
