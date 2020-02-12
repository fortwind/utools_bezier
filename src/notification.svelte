<script context="module">
import { s_notifications } from './store.js'
let notifications = new Map()
const typeMap = new Map([
  ['success', 'success'],
  ['info', 'info'],
  ['warning', 'warning'],
  ['error', 'error']
])
// const positionMap = new Map([
//   ['top-right', 'top-right'],
//   ['bottom-right', 'bottom-right'],
//   ['top-left', 'top-left'],
//   ['bottom-left', 'bottom-left']
// ])
const defaultConfig = {
  message: 'message',
  // icon: '',
  duration: 4500,
  showClose: true,
  // offset: 0,
  type: typeMap.get('info'),
  // title: '',
  // position: positionMap.get('top-right')
}

export function showNotify (notification = {}) {
  let {
    type,
    // position,
    duration,
    ...notify
  } = notification
  const typeval = typeMap.get(type)
  typeval && Object.assign(notify, { type: typeval })
  // const posval = typeMap.get(position)
  // posval && Object.assign(notify, { position: posval })
  const target = [...notifications.keys()]
  const id = getID(target)
  const timeout = duration === 0 ? null : setTimeout(() => removeNo(id, timeout), duration * 1 > 0 ? duration : 4500)
  const addone = Object.assign({ id, timeout }, defaultConfig, duration * 1 > -1 ? { duration } : {}, notify) // NaN > -1 ==> false
  animateNo(target.length - 1, -1)
  notifications.set(id, addone)
  s_notifications.update(() => ([...notifications.values()]))
}

function getID(target) {
  const len = target.length
  return len === 0 ? 0 : (Math.max(...target) * 1 + 1)
}

function removeNo(id, timeout) {
  // console.log(999)
  const target = [...notifications.keys()]
  animateNo(target.indexOf(id) - 1)
  clearTimeout(timeout)
  notifications.delete(id)
  s_notifications.update(() => ([...notifications.values()]))
}

function animateNo (end, direct = 1) { // direct => {1, -1}
  const nodes = document.querySelectorAll('.notification') // bind:this不管用
  const height = 46
  for(let kk = end; kk > -1; kk--) {
    nodes[kk].animate([
      { transform: `translateY(${direct * height}px)` },
      { transform: 'translateY(0)' }
    ], {
      duration: direct > 0 ? 300 : 500,
      easing: 'ease',
      delay: direct > 0 ? 500 : 0
    })
  }
}
</script>
<script>
import { fly } from 'svelte/transition'
import { backInOut } from 'svelte/easing'
</script>

<div class="notification-container">
  {#each $s_notifications as {id, message, showClose, type, timeout} (id)}
    <div class="notification tip-{type}" transition:fly="{{ x: 200, duration: 500, easing: backInOut }}">
      <div class="content">
        <div class="message">{message}</div>
      </div>
      {#if showClose}
      <button class="close button" on:click={() => removeNo(id, timeout)}></button>
      {/if}
    </div>
  {/each}
</div>

<style type="text/css">
.notification-container {
  position: fixed;
  display: flex;
  flex-direction: column-reverse;
  top: 56px;
  right: 10px;
  width: 200px;
}

.notification-container .notification {
  position: relative;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 16px;
  letter-spacing: 1px;
  border: 1px solid;
  margin: 3px 0;
}
.notification-container .notification.tip-success {
  color: #9AD67C;
  background-color: #f0f9eb;
  border-color: #e1f3d8;
}
.notification-container .notification.tip-info {
  color: #9B9EA5;
  background-color: #EDF2FC;
  border-color: #EBEEF5;
}
.notification-container .notification.tip-warning {
  color: #EEC17E;
  background-color: #fdf6ec;
  border-color: #faecd8;
}
.notification-container .notification.tip-error {
  color: #F56C6C;
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.notification-container .notification .content {
  display: inline-block;
  width: 80%;
  margin: 0;
}

.notification-container .notification .close {
  position: absolute;
  top: 50%;
  right: 10px;
  margin: 0;
  height: 18px;
  width: 18px;
  background-color: transparent;
  transform: translateY(-50%);
}
.notification-container .notification .close::before,
.notification-container .notification .close::after {
  position: absolute;
  content: '';
  top: 7px;
  left: 1px;
  width: 15px;
  height: 3px;
  border-radius: 3px;
  background-color: #C0C4CC;
}
.notification-container .notification .close::before {
  transform: rotate(45deg);
}
.notification-container .notification .close::after {
  transform: rotate(-45deg);
}
</style>
