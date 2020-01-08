<script>
const canvasSize = { w: 300, h: 600 }
const cvsdata = { p: 0, t: 0}
const ctrltop = {
  self: undefined,
  top: 0,
  left: 0,
  move: function () {
    ctrlmove(0)
  }
}
const ctrlbottom = {
  self: undefined,
  top: 0,
  left: 0,
  move: function () {
    // console.log(this, e)
    ctrlmove(1)
  }
}

function ctrlmove (flag) {
  const { top, left } = document.querySelector('.coordinate-plane').getBoundingClientRect()
  const target = flag ? ctrltop : ctrlbottom
  document.onmousemove = ({ clientX, clientY }) => {
    if (flag) {
      ctrlbottom.top = clientY - top
      ctrlbottom.left = clientX - left
    } else {
      ctrltop.top = clientY - top
      ctrltop.left = clientX - left
    }
  }
  document.onmouseup = () => {
    document.onmousemove = null
    document.onmouseup = null
  }
}

const mouseMove = ({ layerX, layerY }) => {
  cvsdata.p = Math.round((canvasSize.h * 0.75 - layerY) / canvasSize.w * 100)
  cvsdata.t = Math.round(layerX / canvasSize.w * 100)
}

</script>

<div class="coordinate-plane" on:mousemove="{mouseMove}" data-progression={cvsdata.p} data-time={cvsdata.t}>
  <span class="dot top"></span>
  <span class="dot bottom"></span>
  <button bind:this={ctrltop.self} class="ctrltop ctrlbtn" style="top:{ctrltop.top}px;left:{ctrltop.left}px" on:mousedown={() => ctrltop.move.call(ctrltop)}></button>
  <button bind:this={ctrlbottom.self} class="ctrlbottom ctrlbtn" style="top:{ctrlbottom.top}px;left:{ctrlbottom.left}px" on:mousedown={() => ctrlbottom.move.call(ctrlbottom)}></button>
  <canvas id="canvas" height="{canvasSize.h}" width="{canvasSize.w}"></canvas>
</div>

<style scoped>
.coordinate-plane {
  position: absolute;
  height: 600px;
  left: 0;
  color: rgba(0,0,0,.6);
  text-transform: uppercase;
  font-size: 75%;
}

.dot {
  position: absolute;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 100%;
  border: 1px solid rgb(211, 211, 211);
  z-index: 1;
}
.dot.bottom {
  bottom: 25%;
  left: 0;
  transform: translate(-50%, 50%);
}
.dot.top {
  top: 25%;
  right: 0;
  transform: translate(50%, -50%);
}

.ctrlbtn {
  position: absolute;
  width: 18px;
  height: 18px;
  outline: 0;
  border-radius: 100%;
  border: 1px solid rgba(0,0,0,.3);
  cursor: pointer;
  transition: box-shadow 0.2s;
  transform: translate(-50%, -50%);
}
.ctrlbtn:hover {
  box-shadow: 0 0 5px #cc00ff;
}
.ctrlbtn.ctrltop {
  background-color: #00aabb;
}
.ctrlbtn.ctrlbottom {
  background-color: #ff0088;
}

.coordinate-plane::before, .coordinate-plane::after {
  position: absolute;
  width: 100%;
  left: 0;
  padding: 5px 15px;
  box-sizing: border-box;
  line-height: 1;
}
.coordinate-plane::before {
  border-bottom: 1px solid #b9b8b8;
  content: 'Progression';
  transform-origin: bottom left;
  transform: rotate(-90deg);
  bottom: 25%;
}
.coordinate-plane:hover::before {
  content: 'Progression (' attr(data-progression) '%)';
}
.coordinate-plane::after {
  content: 'Time';
  border-top: 1px solid #b9b8b8;
  transform: translateY(100%);
  bottom: 25%;
}
.coordinate-plane:hover::after {
  content: 'Time (' attr(data-time) '%)';
}

#canvas {
  background: linear-gradient(-45deg, transparent 49%, rgba(0,0,0,.1) 49%, rgba(0,0,0,.1) 51%, transparent 51%) center no-repeat,
		repeating-linear-gradient(white, white 20px, transparent 20px, transparent 40px) no-repeat,
		linear-gradient(transparent, rgba(0,0,0,.06) 25%, rgba(0,0,0,.06) 75%, transparent);
  background-size: 100% 50%, 100% 50%, auto;
  background-position: 25%, 0, 0;
  user-select: none;
}
</style>