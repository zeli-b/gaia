import { Quadtree } from "./quadtree.js";
import { Area, Layer, Structure, Project } from "./project.js";

window.Quadtree = Quadtree;
window.Area = Area;
window.Layer = Layer;
window.Structure = Structure;

let canvas;
window.project = new Project("Untitled", new Layer("Layer 1"));

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.querySelector("#canvas");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  canvas.addEventListener("resize", e => {
    e.target.width = e.target.clientWidth;
    e.target.height = e.target.clientHeught;
  });
});
