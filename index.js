let canvas;

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.querySelector("#canvas");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  canvas.addEventListener("resize", e => {
    e.target.width = e.target.clientWidth;
    e.target.height = e.target.clientHeught;
  });
});
