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
    this.xZoom = Math.max(Math.min(zoom, 2000000), 2);
    return this;
  }

  /**
   * 카메라의 표시 배율을 바꿈
   * @param {number} zoom - 바꿀 카메라 표시 배율
   * @returns {Camera}
   */
  setYZoom(zoom) {
    this.yZoom = Math.max(Math.min(zoom, 1000000), 1);
    return this;
  }
}
