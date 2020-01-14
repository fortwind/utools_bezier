<script>
export let size = 1
export let originalbezier = [0, 0.5, 1, 0.5]
export let eclass = ''

const correct = 0.25

$: bezier = [originalbezier[0] * 1 + correct, 1 + correct - originalbezier[1] * 1, originalbezier[2] * 1 + correct, 1 + correct - originalbezier[3] * 1]
</script>

<div class="bezier_item {eclass}" style="width:{size}px;height:{size}px;">
  <svg xmlns="http://www.w3.org/2000/svg" width="{size}px" height="{size}px" viewBox="0 0 {1 + correct * 2} {1 + correct * 2}">
    <path class="path {eclass}" d="M {correct} {1 + correct} C {bezier[0]} {bezier[1]}, {bezier[2]} {bezier[3]}, {1 + correct} {correct}" stroke-width='0.03' fill="transparent"></path>
    <path class="path2dot {eclass}" d="M {correct} {1 + correct} L {bezier[0]} {bezier[1]}" stroke-width='0.02' fill="transparent"></path>
    <circle class="dot {eclass}" cx="{bezier[0]}" cy="{bezier[1]}" r="0.03"/>
    <path class="path2dot {eclass}" d="M {1 + correct} {correct} L {bezier[2]} {bezier[3]}" stroke-width='0.02' fill="transparent"></path>
    <circle class="dot {eclass}" cx="{bezier[2]}" cy="{bezier[3]}" r="0.03"/>
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

.bezier_item.plain {
  background-color: #e5e5e5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.path.plain {
  stroke: #000000;
}
.path2dot.plain {
  stroke: #000000;
}
.dot.plain {
  fill: #000000;
}
.bezier_item.plain:hover {
  background-color: rgb(190, 46, 221, 0.5);
}
.bezier_item.plain:hover .path.plain, .bezier_item.plain:hover .path2dot.plain {
  stroke: #ffffff;
}
.bezier_item.plain:hover .dot.plain {
  fill: #ffffff;
}
.bezier_item.plain.is-active {
  background-color: rgb(155, 28, 184);
}
.bezier_item.plain.is-active .path.plain, .bezier_item.plain.is-active .path2dot.plain {
  stroke: #ffffff;
}
.bezier_item.plain.is-active .dot.plain {
  fill: #ffffff;
}
</style>
