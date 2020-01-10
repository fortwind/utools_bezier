<script>
import { onMount, onDestroy } from 'svelte'
import { bezier } from './store.js'
import MCanvas from './mCanvas.svelte'
import BezierSvg from './beziersvg.svelte'

utools.onPluginOut(() => {
  localStorage.setItem('bezier', $bezier)
})

const timeDot = {
  fatherDom: '',
  left: 26.125, // 初始位置8
  time: 1,
  move: function () {
    const { width, x } = timeDot.fatherDom.getBoundingClientRect()
    let dist
    document.onmousemove = ({ clientX }) => {
      dist = clientX - x - 2
      timeDot.left = dist < 8 ? 8 : dist > width - 10 ? width - 10 : dist
      timeDot.time = Math.round((timeDot.left - 7) / (width - 17) * 100) / 10
    }
    document.onmouseup = () => {
      document.onmousemove = null
      document.onmouseup = null
    }
  }
}

</script>

<div id="app">
  <MCanvas></MCanvas>
  <div class="container">
    <div class="header">
    {#if $bezier}
      <p class="title">cubic-bezier(
        <span class="bottompos">{$bezier[0]}</span>,
        <span class="bottompos">{$bezier[1]}</span>,
        <span class="toppos">{$bezier[2]}</span>,
        <span class="toppos">{$bezier[3]}</span>
      )</p>
    {:else}
      <p>cubic-bezier(0, 0, 0, 0)</p>
    {/if}
    </div>
    <div class="body">
      <div class="subtitle">
        <h2>Preview & compare</h2>
        <button class="button gobtn"><span>GO!</span></button>
      </div>
      <div class="timecontrol">
        <span>Duration:</span>
        <div class="slider">
          <div bind:this={timeDot.fatherDom} class="inner-slider">
            <span class="bgfill" style="width:{timeDot.left}px"></span>
            <span class="inner-dot" style="left:{timeDot.left}px" on:mousedown={timeDot.move}></span>
          </div>
        </div>
        <div class="time">{timeDot.time} s</div>
      </div>
      <div class="animate-plane">
        <div class="bezier">
          <BezierSvg size={1} />
        </div>
      </div>
    </div>
  </div>
</div>

<style scoped>
#app {
  position: relative;
	margin: 32px;
	min-height: 600px;
	padding-left: 333px;
  user-select: none;
}

.button {
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  -webkit-appearance: none;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: .1s;
  font-weight: 500;
  font-size: 14px;
  border-radius: 4px;
}

.title {
  font-size: 2.6vw;
  text-align: center;
  letter-spacing: 1px;
  cursor: pointer;
  transition: text-shadow 0.3s;
}
.title .bottompos {
  color: #ff0088;
}
.title .toppos {
  color: #00aabb;
}
.title:hover {
  text-shadow: 0 0 5px rgb(190, 46, 221);
}

.subtitle {
  display: flex;
  align-items: center;
}

.gobtn {
  margin-left: 12px;
  padding: 6px 12px;
  font-size: 16px;
  color: #fff;
  background-color: #ccc;
  border-radius: 6px;
  transition: background-color 0.3s;
}
.gobtn:hover {
  background-color: rgb(190, 46, 221);
}

.timecontrol {
  display: flex;
  align-items: center;
  font-size: 18px;
  color: #777777;
}

.slider {
  margin: 0 12px;
}

.slider .inner-slider {
  position: relative;
  width: 211px;
  height: 16px;
  border: 1px solid #b3b0b0;
  border-radius: 25px;
  background-color: #eee;
  box-shadow: inset 1px 1px #dddddd;
  overflow: hidden;
}

.slider .inner-dot {
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: rgb(219, 49, 255);
  border-radius: 100%;
  box-shadow: inset 0 0 7px 0px #5d5d5db8;
  cursor: pointer;
  transform: translate(-50%);
}

.slider .bgfill {
  position: absolute;
  height: 100%;
  background-color: rgb(239, 203, 247);
}

.animate-plane .bezier{
  width: 100px;
  height: 100px;
}
</style>
