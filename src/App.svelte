<script>
import { onMount, onDestroy } from 'svelte'
import MCanvas from './mCanvas.svelte'
import BezierSvg from './beziersvg.svelte'
import { bezier } from './store.js'
import Notification, { showNotify } from './notification.svelte'

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
let curves = [{ _id: 0, name: 'ease', val: [.25, .1, .25, 1], default: true, _rev: null }]
let backupCurves

$: referone = curves[chosenone]

initCurves().then(val => {
  curves = val
  backupCurves = curves.map(v => Object.assign({}, v))
})

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
    // curves_db.map(v => utools.db.remove(v))
    if (curves_db.length === 0) {
      curves_db = [
        { _id: 'curves_0', name: 'ease', val: [.25, .1, .25, 1], default: true },
        { _id: 'curves_1', name: 'linear', val: [0, 0, 1, 1], default: true },
        { _id: 'curves_2', name: 'ease-in', val: [.42, 0, 1, 1], default: true },
        { _id: 'curves_3', name: 'ease-out', val: [0, 0, .58, 1], default: true },
        { _id: 'curves_4', name: 'ease-in-out', val: [.42, 0, .58, 1], default: true }
      ]
      curves_db.map(v => {
        const t = utools.db.put(v)
        v._rev = t.rev
      })
    }
    return curves_db.sort((a, b) => a._id.slice(7) - b._id.slice(7)).map(v => ({ _id: v._id, name: v.name, val: v.val, default: v.default, _rev: v._rev }))
  }
}

function copyBezier (value) {
  const val = `cubic-bezier(${value.join(',')})`
  let clipbord = new ClipboardJS('.animate-plane', {
    text: () => val
  })
  clipbord.on('success', () => {
    clipbord.destroy()
    showNotify({
      message: 'Copied',
      type: 'success'
    })
  })
  clipbord.on('error', () => {
    clipbord.destroy()
    showNotify({
      message: 'Error',
      type: 'error'
    })
  })
}

function saveBezier (x) {
  const bezier = x.map(v => v)
  const length = curves.length
  if (length > 99) {
    showNotify({
      message: '添加太多了啦！',
      type: 'warning'
    })
    return false
  }
  const id = curves[length - 1]._id.slice(7) * 1 + 1
  const theone = { _id: 'curves_' + id, name: `new${id}`, val: bezier, default: false }
  const res = utools.db.put(theone)
  backupCurves.push(Object.assign({ _rev: res.rev }, theone))
  curves = backupCurves.map(v => Object.assign({}, v))
}

function enterEvent (e) {
  if (e.keyCode === 13) {
    e.target.blur()
  }
}

function saveName (e, i) {
  const newname = e.target.value
  const oldcurves = backupCurves[i]
  if (newname === oldcurves.name) {
    return false
  } else if (!newname) {
    curves[i].name = oldcurves.name
    showNotify({
      message: '名称不为空哟',
      type: 'warning'
    })
  } else if (backupCurves.map(v => v.name).includes(newname)) {
    curves[i].name = oldcurves.name
    showNotify({
      message: '名称不要重复哟',
      type: 'warning'
    })
  } else {
    const r = utools.db.put({
      _id: oldcurves._id,
      name: newname,
      val: oldcurves.val,
      default: oldcurves.default,
      _rev: oldcurves._rev
    })
    if (r.error) {
      showNotify({
        message: r.message,
        type: 'error'
      })
      curves[i].name = oldcurves.name
    } else {
      oldcurves.name = newname
      oldcurves._rev = r.rev
      curves[i]._rev = r.rev
    }
  }
}

function removeCurves (i) {
  if (chosenone === i) {
    chosenone = 0
  }
  // console.log(exhibitItems.slice(3)) // 这个可，，queryselectorAll不可类似数组slice
  
  if (backupCurves[i]) {
    filp(i, curves.length).then(val => {
      utools.db.remove(backupCurves.splice(i, 1)[0]._id)
      curves = backupCurves.map(v => Object.assign({}, v))
    })
  }
}

let exhibitItems = []
let exhibition

function filp (i, length) {
  if (exhibitItems.slice(-1)[0] === null) exhibitItems.length--
  const el = exhibitItems.slice(i+1)
  const first = el.map(v => v.getBoundingClientRect())
  exhibitItems[i].classList.add('remove-el')
  const last = el.map(v => v.getBoundingClientRect())
  const top = el.map((v, i) => first[i].top - last[i].top)
  const left = el.map((v, i) => first[i].left - last[i].left)
  const player = el.map((v, i) => v.animate([
    { transform: `translate(${left[i]}px, ${top[i]}px)` },
    { transform: 'translate(0, 0)' }
  ], {
    duration: 500,
    easing: 'ease'
  }))
  return new Promise(resolve => {
    setTimeout(() => {
      exhibitItems[i].classList.remove('remove-el')
      resolve('finish')
    }, 600)
  })
  // return new Promise.all(player.map(v => new Promise(resolve => {
  //   v.addEventListener('finish'), () => {
  //     resolve('finish')
  //   }
  // })))
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
        <p class="explain">👇点击下方两个方块可拷贝对应bezier值到剪切板。</p>
        <div class="animate-plane">
          <div class="plane-item{active ? ' transform' : ''}" style="transition-duration: {timeDot.time}s;transition-timing-function:cubic-bezier({$bezier[0]}, {$bezier[1]}, {$bezier[2]}, {$bezier[3]})">
            <BezierSvg on:choose="{() => copyBezier($bezier)}" eclass={'target'} size={64} originalbezier={$bezier} />
          </div>
          <div class="plane-item{active ? ' transform' : ''}" style="transition-duration: {timeDot.time}s;transition-timing-function:cubic-bezier({referone.val[0]}, {referone.val[1]}, {referone.val[2]}, {referone.val[3]})">
            <BezierSvg on:choose="{() => copyBezier(referone.val)}" eclass={'refer'} size={64} originalbezier={referone.val} />
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="subtitle">
          <h2>Library</h2>
          <p class="explain">Click on a curve to compare it with the current one.</p>
          <p class="explain">For new one, it`s name can be changed by click it`s name.</p>
          <p class="explain">Attention!! The name cannot be repeated!</p>
        </div>
        <div bind:this={exhibition} class="exhibition">
          <div class="exhibits remove-el" style="display:none"></div> <!-- svelte如果检测html中（js中没用）css unused，就不会打包，，所以虚晃一下 -->
          {#each curves as key, i (key._id)}
            <div bind:this={exhibitItems[i]} class="exhibit_item exhibits">
              <button class="button removebtn" on:click="{() => removeCurves(i)}"></button>
              <BezierSvg on:choose="{() => chosenone = i}" eclass={i === chosenone ? 'plain is-active' : 'plain'} size={100} originalbezier={key.val}></BezierSvg>
              {#if key.default}
                <p>{key.name}</p>
              {:else}
                <input class="edit-name" bind:value="{key.name}" on:blur="{(e) => saveName(e, i)}" on:keypress="{enterEvent}"/>
                <div class="edit-bottom"></div>
                <div class="forsee">
                  <span class="cline leftl"></span>
                  <span class="cline rightl"></span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
<Notification></Notification>

<style scoped>
#app {
  position: relative;
	margin: 32px;
	min-height: 600px;
	padding-left: 333px;
  user-select: none;
}

.container {
  padding: 0 10px;
}

.title {
  font-size: 2.6vw;
  text-align: center;
  letter-spacing: 1px;
  user-select: text;
  /* cursor: pointer; */
  /* transition: text-shadow 0.3s; */
}
.title .bottompos {
  color: #ff0088;
}
.title .toppos {
  color: #00aabb;
}
/* .title:hover {
  text-shadow: 0 0 5px rgb(190, 46, 221);
} */

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

.explain {
  color: #969696;
  line-height: 0.5;
}

.footer .exhibition {
  position: relative;
  margin: 0 -11px;
}

.footer .exhibition .exhibit_item {
  position: relative;
  display: inline-block;
  margin: 0 12px 10px;
  opacity: 1;
  transform: scale(1);
  transition: transform 0.5s, opacity 0.5s;
}

.footer .exhibition .exhibits.remove-el {
  position: absolute;
  opacity: 0;
  transform: scale(0);
}

.footer .exhibition .exhibit_item p {
  margin-top: 0;
  text-align: center;
}

.footer .exhibition .exhibit_item .edit-name {
  color: #969696;
  margin: 0;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
  width: 100px;
  text-align: center;
  border: 0px;
}
.footer .exhibition .exhibit_item .edit-name:focus {
  outline: 0;
  outline-offset: 0px;
}
.edit-name + .edit-bottom {
  position: relative;
  width: 0;
  height: 2px;
  margin-top: 2px;
  left: 50%;
  transform: translateX(-50%);
  background-color: transparent;
  transition: width 0.3s, background-color 0.3s;
}
.edit-name:focus + .edit-bottom {
  width: 100%;
  background-color: rgb(190, 46, 221);
}

/* .bezier_item.plain:hover + p, .bezier_item.plain:hover + .edit-name {
  color: rgba(190, 46, 221, 0.5);
}
.bezier_item.plain.is-active + p, .bezier_item.plain.is-active + .edit-name {
  color: rgb(190, 46, 221);
} */

.exhibit_item > .removebtn {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  transform: translate(50%, -50%);
  opacity: 0;
  z-index: 2;
}

.forsee {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  right: 0;
  height: 20px;
  width: 20px;
  background-color: #969696;
  border-radius: 50%;
  transform: translate(50%, -50%);
  transition: background-color 0.3s;
  visibility: hidden;
}

.forsee .cline {
  position: absolute;
  height: 10px;
  width: 2px;
  background-color: #ffffff;
  transform: rotate(0);
  transition: transform 0.3s;
}

.exhibit_item > .removebtn:hover ~ .forsee {
  visibility: visible;
  background-color: #000000;
}

</style>
