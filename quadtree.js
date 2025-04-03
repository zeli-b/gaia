function getMostFrequent(arr) {
  const hashmap = arr.reduce( (acc, val) => {
    acc[val] = (acc[val] || 0 ) + 1
    return acc
  },{});
  return Object.keys(hashmap).reduce((a, b) => hashmap[a] > hashmap[b] ? a : b)
}

class Quadtree {
  constructor(value) {
    this.representValue = value;
    this.children = null;
  }

  isDivided() {
    return this.children !== null;
  }

  divide() {
    if (this.isDivided())
      throw new Error("Quadtree already divided");

    const value = this.representValue;
    this.children = [
      new Quadtree(value),
      new Quadtree(value),
      new Quadtree(value),
      new Quadtree(value),
    ];
  }

  getValue() {
    if (!this.isDivided()) {
      return this.representValue;
    }

    const children = this.children.map(c => c.getValue());
    return getMostFrequent(children);
  }
}

if (require.main === module) {
  qt = new Quadtree(0);
  console.log(qt.isDivided());
  console.log(qt.getValue());

  qt.divide();
  console.log(qt.isDivided());
  console.log(qt.getValue());
}
