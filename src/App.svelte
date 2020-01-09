<script>
import { onMount, onDestroy } from 'svelte'
import { bezier } from './store.js'
import MCanvas from './mCanvas.svelte'

utools.onPluginOut(() => {
  localStorage.setItem('bezier', $bezier)
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
    <div class="body">
      <div class="subtitle">
        <h2>Preview & compare</h2>
        <button class="button gobtn"><span>GO</span></button>
      </div>
      <div class="timecontrol">
        <span>Duration:</span>
        <div class="slider">
          <div class="inner-slider"></div>
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
  padding: 6px 14px;
  font-size: 16px;
  color: #fff;
  background-color: #ccc;
  transition: background-color 0.3s;
}
.gobtn:hover {
  background-color: rgb(190, 46, 221);
}

.timecontrol {
  font-size: 18px;
  color: #777777;
}
</style>
