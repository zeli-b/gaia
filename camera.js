/**
 * 현재 바라보고 있는 위치를 나타낸다
 */
export class Camera {
  /**
   * 카메라 오브젝트를 생성
   * @param {number} x - 카메라의 x좌표 초기값
   * @param {number} y - 카메라의 y좌표 초기값
   * @param {number} xZoom - 카메라의 확대율 초기값
   * @param {number} yZoom - 카메라의 확대율 초기값
   */
  constructor(x, y, xZoom, yZoom) {
    this.x = x;
    this.y = y;
    this.xZoom = xZoom;
    this.yZoom = yZoom;
    this.dx = 0;
    this.dy = 0;
    this.onlyChild = [];
    this.update = false;
  }

  updateOnlyChild(canvas) {
    const sx = this.convertScreenToMapX(canvas, 0);
    const sy = this.convertScreenToMapY(canvas, 0);
    const ex = this.convertScreenToMapX(canvas, canvas.width);
    const ey = this.convertScreenToMapY(canvas, canvas.height)
    const original = JSON.stringify(this.onlyChild);

    this.dx = 0;
    this.dy = 0;
    this.onlyChild.length = 0;
    while (true) {
      const size = Math.pow(0.5, this.onlyChild.length);
      const half = size / 2;

      if (
        this.dx <= sx && ex < this.dx + half
        && this.dy <= sy && ey < this.dy + half
      ) {
        this.onlyChild.push(0);
        continue;
      }

      if (
        this.dx + half <= sx && ex < this.dx + size
        && this.dy <= sy && ey < this.dy + half
      ) {
        this.onlyChild.push(1);
        this.dx += half;
        continue;
      }

      if (
        this.dx <= sx && ex < this.dx + half
        && this.dy + half <= sy && ey < this.dy + size
      ) {
        this.onlyChild.push(2);
        this.dy += half;
        continue;
      }

      if (
        this.dx + half <= sx && ex < this.dx + size
        && this.dy + half <= sy && ey < this.dy + size
      ) {
        this.onlyChild.push(3);
        this.dx += half;
        this.dy += half;
        continue;
      }

      break;
    }

    if (original !== JSON.stringify(this.onlyChild)) {
      this.update = true;
    }
  }

  /**
   * 화면상의 좌표를 현재 투영중인 지도 상의 좌표로 변경
   * 이때, 지도가 평면임을 가정한다.
   * @param {canvas} canvas - 전체 화면
   * @param {number} screenX - 화면상의 x좌표
   * @return {number} - screenX가 나타내는 지도상의 x좌표
   */
  convertScreenToMapX(canvas, screenX) {
    return (screenX - canvas.width / 2) / this.xZoom + this.x;
  }

  /**
   * 지도상의 좌표를 현재 투영중인 화면 상의 좌표로 변경
   * 이때, 지도가 평면임을 가정한다.
   * @param {canvas} canvas - 전체 화면
   * @param {number} mapX - 지도상의 x좌표
   * @return {number} - mapX가 나타내는 화면상의 x좌표
   */
  convertMapToScreenX(canvas, mapX) {
    return (mapX - this.x) * this.xZoom + canvas.width / 2;
  }

  /**
   * 화면상의 좌표를 현재 투영중인 지도 상의 좌표로 변경
   * 이때, 지도가 평면임을 가정한다.
   * @param {canvas} canvas - 전체 화면
   * @param {number} screenY - 화면상의 y좌표
   * @return {number} - screenY가 나타내는 지도상의 y좌표
   */
  convertScreenToMapY(canvas, screenY) {
    return (screenY - canvas.height / 2) / this.yZoom + this.y;
  }

  /**
   * 지도상의 좌표를 현재 투영중인 화면 상의 좌표로 변경
   * 이때, 지도가 평면임을 가정한다.
   * @param {canvas} canvas - 전체 화면
   * @param {number} mapY - 지도상의 y좌표
   * @return {number} - mape가 나타내는 화면상의 y좌표
   */
  convertMapToScreenY(canvas, mapY) {
    return (mapY - this.y) * this.yZoom + canvas.height / 2;
  }

  /**
   * 카메라의 x좌표를 설정
   */
  setX(x) {
    this.x = (x % 1 + 1) % 1;
    return this;
  }

  /**
   * 카메라의 x좌표를 설정
   */
  setY(y) {
    this.y = Math.min(Math.max(y, 0), 1);
    return this;
  }

  /**
   * 카메라의 표시 배율을 바꿈
   * @param {number} zoom - 바꿀 카메라 표시 배율
   * @returns {Camera}
   */
  setXZoom(zoom) {
    const original = this.xZoom;
    this.xZoom = Math.max(Math.min(zoom, 2000000), 2);

    this.update = this.update
      || Math.floor(Math.log2(this.xZoom)) !== Math.floor(Math.log2(original));
    return this;
  }

  /**
   * 카메라의 표시 배율을 바꿈
   * @param {number} zoom - 바꿀 카메라 표시 배율
   * @returns {Camera}
   */
  setYZoom(zoom) {
    const original = this.yZoom;
    this.yZoom = Math.max(Math.min(zoom, 1000000), 1);

    this.update = this.update ||
      Math.floor(Math.log2(this.yZoom)) !== Math.floor(Math.log2(original));
    return this;
  }
}
