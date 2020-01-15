<script>
import { onMount, onDestroy } from 'svelte'
import MCanvas from './mCanvas.svelte'
import BezierSvg from './beziersvg.svelte'
import { bezier } from './store.js'

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

let active = false
let chosenone = localStorage.getItem('chosenone') || 0
let curves = [{ name: 'ease', val: [.25, .1, .25, 1], default: true, rev: null, edit: false }]

$: referone = curves[chosenone]

initCurves().then(val => { curves = val; console.log(val) })

function initCurves () {
  return new Promise((resolve, reject) => {
    try {
      resolve(getCurves())
    } catch {
      utools.onPluginReady(() => {
        resolve(getCurves())
      })
    }
  })

  function getCurves () {
    let curves_db = utools.db.allDocs('curves')
    if (curves_db.length === 0) {
      curves_db = [
        { _id: 'curves_ease', val: [.25, .1, .25, 1], default: true },
        { _id: 'curves_linear', val: [0, 0, 1, 1], default: true },
        { _id: 'curves_ease-in', val: [.42, 0, 1, 1], default: true },
        { _id: 'curves_ease-out', val: [0, 0, .58, 1], default: true },
        { _id: 'curves_ease-in-out', val: [.42, 0, .58, 1], default: true }
      ]
      curves_db.map(v => {
        const t = utools.db.put(v)
        v._rev = t.rev
      })
    }
    // const curves2obj = []
    return curves_db.map(v => ({ name: v._id.slice(7), val: v.val, default: v.default, rev: v._rev, edit: false }))
    // })
    // return curves2obj
  }
}

function saveBezier (x) {
  const bezier = x.map(v => v)
  const name = 'new' + curves.length
  const res = utools.db.put({ _id: 'curves_' + name, val: bezier, default: false })
  curves.push({ name, val: bezier, default: false, rev: res.rev })
}

function editName (e) {
  e.stopPropagation()
}

utools.onPluginOut(() => {
  localStorage.setItem('bezier', $bezier)
  localStorage.setItem('chosenone', chosenone)
})
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
    <div class="content">
      <div class="body">
        <div class="subtitle">
          <h2>Preview & compare</h2>
          <button class="button operatebtn" on:click="{() => {active = !active}}"><span>GO!</span></button>
          <button class="button operatebtn" on:click="{saveBezier($bezier)}"><span>SAVE</span></button>
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
          <div class="plane-item{active ? ' transform' : ''}" style="transition-duration: {timeDot.time}s;transition-timing-function:cubic-bezier({$bezier[0]}, {$bezier[1]}, {$bezier[2]}, {$bezier[3]})">
            <BezierSvg eclass={'target'} size={64} originalbezier={$bezier} />
          </div>
          <div class="plane-item{active ? ' transform' : ''}" style="transition-duration: {timeDot.time}s;transition-timing-function:cubic-bezier({referone.val[0]}, {referone.val[1]}, {referone.val[2]}, {referone.val[3]})">
            <BezierSvg eclass={'refer'} size={64} originalbezier={referone.val} />
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="subtitle">
          <h2>Library</h2>
          <p class="explain">Click on a curve to compare it with the current one.</p>
        </div>
        <div class="exhibition">
          {#each curves as key, i}
            <div class="exhibit_item" on:click={() => chosenone = i}>
              <BezierSvg eclass={i === chosenone ? 'plain is-active' : 'plain'} size={100} originalbezier={key.val}></BezierSvg>
              {#if key.default}
                <p>{key.name}</p>
              {:else}
                <p on:click="{() => key.edit = true}" style="cursor:text;display:{ key.edit ? 'none' : '' }">{key.name}</p>
                <input bind:value="{key.name}" on:blur="{() => key.edit = false}" style="display:{ key.edit ? '' : 'none' }" />
              {/if}
            </div>
          {/each}
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

.content {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 1111px) {
  .content {
    flex-wrap: wrap;
  }
}

.body {
  max-width: 522px;
  min-width: 337px;
  margin-right: 36px;
}

.body .subtitle {
  display: flex;
  align-items: center;
}

.operatebtn {
  margin-left: 12px;
  padding: 6px 12px;
  font-size: 16px;
  color: #fff;
  background-color: #ccc;
  border-radius: 6px;
  transition: background-color 0.3s;
}
.operatebtn:hover {
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

.animate-plane {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.animate-plane .plane-item{
  position: relative;
  margin: 24px 0 12px;
  transition-property: left;
  transition-delay: 0s;
  width: 60px;
  left: 0;
}

.plane-item.transform {
  left: 81%;
}

.footer {
  min-width: 390px;
}

.footer .subtitle .explain {
  color: #969696;
  margin-top: -14px;
}

.footer .exhibition {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.footer .exhibition .exhibit_item {
  margin: 0 24px 10px 0;
}

.footer .exhibition .exhibit_item p {
  margin-top: 0;
  text-align: center;
}

.bezier_item.plain + p {
  color: #929292;
}
.bezier_item.plain:hover + p {
  color: rgba(190, 46, 221, 0.5);
}
.bezier_item.plain.is-active + p {
  color: rgb(190, 46, 221);
}
</style>
