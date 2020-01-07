<div class="coordinate-plane">
  <canvas id="canvas" height="600" width="300"></canvas>
</div>

<style>
.coordinate-plane {
  position: absolute;
  left: 0;
  color: rgba(0,0,0,.6);
  text-transform: uppercase;
  font-size: 75%;
}
.coordinate-plane::before, .coordinate-plane::after {
  position: absolute;
  width: 100%;
  left: 0;
  bottom: 25%;
  padding: 5px;
  box-sizing: border-box;
  line-height: 1;
}
.coordinate-plane::before {
  border-bottom: 1px solid #b9b8b8;
  content: 'Progression';
  transform-origin: bottom left;
  transform: rotate(-90deg);
}
.coordinate-plane::after{
  content: 'Time';
  border-top: 1px solid #b9b8b8;
}
#canvas {
  background: linear-gradient(-45deg, transparent 49%, rgba(0,0,0,.1) 49%, rgba(0,0,0,.1) 51%, transparent 51%) center no-repeat,
		repeating-linear-gradient(white, white 20px, transparent 20px, transparent 40px) no-repeat,
		linear-gradient(transparent, rgba(0,0,0,.06) 25%, rgba(0,0,0,.06) 75%, transparent);
}
</style>