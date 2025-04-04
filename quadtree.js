function getMostFrequent(arr) {
  const hashmap = arr.reduce( (acc, val) => {
    acc[val] = (acc[val] || 0 ) + 1
    return acc
  },{});

  return Object.keys(hashmap)
    .reduce((a, b) => hashmap[a] > hashmap[b] ? a : b);
}

class Quadtree {
  constructor(value) {
    this.value = value;
    this.children = null;
  }

  isDivided() {
    return this.children !== null;
  }

  divide() {
    if (this.isDivided())
      throw new Error("Quadtree already divided");

    this.children = [
      new Quadtree(this.value),
      new Quadtree(this.value),
      new Quadtree(this.value),
      new Quadtree(this.value),
    ];

    return this;
  }

  reduce() {
    if (!this.isDivided()) {
      return;
    }

    this.children.forEach(c => c.reduce());

    if (this.children.some(c => c.isDivided())) {
      return;
    }

    const value = this.children
      .reduce((a, b) => a !== null && a.value === b.value ? a : null);
    
    if (value === null) {
      return;
    }

    this.children = null;
    this.value = value.value;

    return this;
  }

  setChild(index, value) {
    if (!(value instanceof Quadtree))
      throw new Error("child of quadtree must instanceof quadtree");

    this.children[index] = value;
    return this;
  }

  getValue() {
    if (!this.isDivided()) {
      return this.value;
    }

    const children = this.children.map(c => c.getValue());
    return getMostFrequent(children);
  }

  jsonify() {
    if (!this.isDivided()) {
      return this.value;
    }

    return [
      this.children[0].jsonify(),
      this.children[1].jsonify(),
      this.children[2].jsonify(),
      this.children[3].jsonify(),
    ];
  }
}

function getQuadtreeFromJson(json) {
  if (json instanceof Number || typeof json === "number") {
    return new Quadtree(json);
  }

  const result = new Quadtree(null).divide();
  result.setChild(0, getQuadtreeFromJson(json[0]));
  result.setChild(1, getQuadtreeFromJson(json[1]));
  result.setChild(2, getQuadtreeFromJson(json[2]));
  result.setChild(3, getQuadtreeFromJson(json[3]));
  return result;
}

if (require.main === module) {
  qt = new Quadtree(0);
  console.log(qt.isDivided());
  console.log(qt.getValue());
  console.log(qt);

  qt.divide();
  console.log(qt.isDivided());
  console.log(qt.getValue());
  console.log(qt);

  const json = qt.jsonify();
  console.log(json);
  const jqt = getQuadtreeFromJson(json);
  console.log(jqt);

  qt.reduce();
  console.log(qt.isDivided());
  console.log(qt.getValue());
  console.log(qt);
}
