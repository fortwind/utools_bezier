<script>
export let size = 1
export let originalbezier = [0, 0.5, 1, 0.5]
export let eclass = ''

const correct = 0.25

$: bezier = [originalbezier[0] * 1 + correct, 1 + correct - originalbezier[1] * 1, originalbezier[2] * 1 + correct, 1 + correct - originalbezier[3] * 1]
</script>

<div class="bezier_item {eclass}" style="width:{size}px;height:{size}px;">
  <svg xmlns="http://www.w3.org/2000/svg" width="{size}px" height="{size}px" viewBox="0 0 {1 + correct * 2} {1 + correct * 2}">
    <path class="path" d="M {correct} {1 + correct} C {bezier[0]} {bezier[1]}, {bezier[2]} {bezier[3]}, {1 + correct} {correct}" stroke-width='0.03' fill="transparent"></path>
    <path class="path2dot" d="M {correct} {1 + correct} L {bezier[0]} {bezier[1]}" stroke-width='0.02' fill="transparent"></path>
    <circle class="dot" cx="{bezier[0]}" cy="{bezier[1]}" r="0.03"/>
    <path class="path2dot" d="M {1 + correct} {correct} L {bezier[2]} {bezier[3]}" stroke-width='0.02' fill="transparent"></path>
    <circle class="dot" cx="{bezier[2]}" cy="{bezier[3]}" r="0.03"/>
  </svg>
</div>

<style>
.bezier_item {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
}
.bezier_item.target {
  background-color: #f08;
}
.bezier_item.refer {
  background-color: #00aabb;
}

.path {
  stroke: #ffffff;
}

.path2dot {
  stroke: rgba(255, 255, 255);
  opacity: 0.5;
}

.dot {
  fill: #ffffff;
}
</style>
