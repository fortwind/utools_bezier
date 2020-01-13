
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const transbezier = localStorage.getItem('bezier') && localStorage.getItem('bezier').split(',');

    const bezier = writable(transbezier);

    /* src/mCanvas.svelte generated by Svelte v3.16.7 */
    const file = "src/mCanvas.svelte";

    function create_fragment(ctx) {
    	let div;
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let button0;
    	let t2;
    	let button1;
    	let t3;
    	let canvas_1;
    	let canvas_1_height_value;
    	let canvas_1_width_value;
    	let div_data_progression_value;
    	let div_data_time_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			button0 = element("button");
    			t2 = space();
    			button1 = element("button");
    			t3 = space();
    			canvas_1 = element("canvas");
    			attr_dev(span0, "class", "dot top svelte-k89guf");
    			add_location(span0, file, 105, 2, 2800);
    			attr_dev(span1, "class", "dot bottom svelte-k89guf");
    			add_location(span1, file, 106, 2, 2832);
    			attr_dev(button0, "class", "ctrltop ctrlbtn svelte-k89guf");
    			set_style(button0, "top", /*ctrltop*/ ctx[2].top + "px");
    			set_style(button0, "left", /*ctrltop*/ ctx[2].left + "px");
    			add_location(button0, file, 107, 2, 2867);
    			attr_dev(button1, "class", "ctrlbottom ctrlbtn svelte-k89guf");
    			set_style(button1, "top", /*ctrlbottom*/ ctx[3].top + "px");
    			set_style(button1, "left", /*ctrlbottom*/ ctx[3].left + "px");
    			add_location(button1, file, 108, 2, 3009);
    			attr_dev(canvas_1, "id", "canvas");
    			attr_dev(canvas_1, "height", canvas_1_height_value = /*canvasSize*/ ctx[4].h);
    			attr_dev(canvas_1, "width", canvas_1_width_value = /*canvasSize*/ ctx[4].w);
    			attr_dev(canvas_1, "class", "svelte-k89guf");
    			add_location(canvas_1, file, 109, 2, 3166);
    			attr_dev(div, "class", "coordinate-plane svelte-k89guf");
    			attr_dev(div, "data-progression", div_data_progression_value = /*cvsdata*/ ctx[1].p);
    			attr_dev(div, "data-time", div_data_time_value = /*cvsdata*/ ctx[1].t);
    			add_location(div, file, 104, 0, 2689);

    			dispose = [
    				listen_dev(button0, "mousedown", /*mousedown_handler*/ ctx[10], false, false, false),
    				listen_dev(button1, "mousedown", /*mousedown_handler_1*/ ctx[11], false, false, false),
    				listen_dev(div, "mousemove", /*mouseMove*/ ctx[5], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, canvas_1);
    			/*canvas_1_binding*/ ctx[12](canvas_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ctrltop*/ 4) {
    				set_style(button0, "top", /*ctrltop*/ ctx[2].top + "px");
    			}

    			if (dirty & /*ctrltop*/ 4) {
    				set_style(button0, "left", /*ctrltop*/ ctx[2].left + "px");
    			}

    			if (dirty & /*ctrlbottom*/ 8) {
    				set_style(button1, "top", /*ctrlbottom*/ ctx[3].top + "px");
    			}

    			if (dirty & /*ctrlbottom*/ 8) {
    				set_style(button1, "left", /*ctrlbottom*/ ctx[3].left + "px");
    			}

    			if (dirty & /*cvsdata*/ 2 && div_data_progression_value !== (div_data_progression_value = /*cvsdata*/ ctx[1].p)) {
    				attr_dev(div, "data-progression", div_data_progression_value);
    			}

    			if (dirty & /*cvsdata*/ 2 && div_data_time_value !== (div_data_time_value = /*cvsdata*/ ctx[1].t)) {
    				attr_dev(div, "data-time", div_data_time_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*canvas_1_binding*/ ctx[12](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function draw(ctx, w, h, startx, starty, endx, endy, cbl, cbt, ctl, ctt) {
    	ctx.clearRect(0, 0, w, h);
    	ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    	ctx.lineWidth = 2;
    	ctx.beginPath();
    	ctx.moveTo(startx, starty);
    	ctx.lineTo(cbl, cbt);
    	ctx.moveTo(endx, endy);
    	ctx.lineTo(ctl, ctt);
    	ctx.stroke();
    	ctx.closePath();
    	ctx.strokeStyle = "rgb(0, 0, 0)";
    	ctx.lineWidth = 5;
    	ctx.beginPath();
    	ctx.moveTo(startx, starty);
    	ctx.bezierCurveTo(cbl, cbt, ctl, ctt, endx, endy);
    	ctx.stroke();
    	ctx.closePath();
    }

    function pos2bezier(startx, starty, endx, endy, cbl, cbt, ctl, ctt) {
    	const w = endx - startx;
    	const h = starty - endy;
    	const x1 = Math.round(cbl / w * 100) / 100;
    	const y1 = Math.round((starty - cbt) / h * 100) / 100;
    	const x2 = Math.round(ctl / w * 100) / 100;
    	const y2 = Math.round((starty - ctt) / h * 100) / 100;
    	return [x1, y1, x2, y2];
    }

    function instance($$self, $$props, $$invalidate) {
    	let $bezier;
    	validate_store(bezier, "bezier");
    	component_subscribe($$self, bezier, $$value => $$invalidate(7, $bezier = $$value));
    	let canvas;
    	let ctx;
    	const canvasSize = { w: 300, h: 600 };
    	const cvsdata = { p: 0, t: 0 };

    	const ctrltop = {
    		top: 300,
    		left: 300,
    		move() {
    			ctrlmove(0);
    		}
    	};

    	const ctrlbottom = {
    		top: 300,
    		left: 0,
    		move() {
    			ctrlmove(1);
    		}
    	};

    	function ctrlmove(flag) {
    		const { top, left, height, width } = document.querySelector(".coordinate-plane").getBoundingClientRect();

    		document.onmousemove = ({ clientX, clientY }) => {
    			const ty = clientY - top;
    			const y = ty < 0 ? 0 : ty > height ? height : ty;
    			const tx = clientX - left;
    			const x = tx < 0 ? 0 : tx > width ? width : tx;

    			if (flag) {
    				$$invalidate(3, ctrlbottom.top = y, ctrlbottom);
    				$$invalidate(3, ctrlbottom.left = x, ctrlbottom);
    			} else {
    				$$invalidate(2, ctrltop.top = y, ctrltop);
    				$$invalidate(2, ctrltop.left = x, ctrltop);
    			}

    			ctrlDraw();
    		};

    		document.onmouseup = () => {
    			document.onmousemove = null;
    			document.onmouseup = null;
    		};
    	}

    	function ctrlDraw() {
    		draw(ctx, canvasSize.w, canvasSize.h, 0, 450, 300, 150, ctrlbottom.left, ctrlbottom.top, ctrltop.left, ctrltop.top);
    		bezier.update(() => pos2bezier(0, 450, 300, 150, ctrlbottom.left, ctrlbottom.top, ctrltop.left, ctrltop.top));
    	}

    	const mouseMove = ({ layerX, layerY }) => {
    		$$invalidate(1, cvsdata.p = Math.round((canvasSize.h * 0.75 - layerY) / canvasSize.w * 100), cvsdata);
    		$$invalidate(1, cvsdata.t = Math.round(layerX / canvasSize.w * 100), cvsdata);
    	};

    	onMount(() => {
    		ctx = canvas.getContext("2d");

    		if ($bezier) {
    			const [x1, y1, x2, y2] = $bezier;
    			const w = 300;
    			const h = 300;
    			$$invalidate(3, ctrlbottom.left = x1 * w, ctrlbottom);
    			$$invalidate(3, ctrlbottom.top = 450 - y1 * h, ctrlbottom);
    			$$invalidate(2, ctrltop.left = x2 * w, ctrltop);
    			$$invalidate(2, ctrltop.top = 450 - y2 * h, ctrltop);
    			draw(ctx, canvasSize.w, canvasSize.h, 0, 450, 300, 150, ctrlbottom.left, ctrlbottom.top, ctrltop.left, ctrltop.top);
    		} else {
    			ctrlDraw();
    		}
    	});

    	const mousedown_handler = () => ctrltop.move.call(ctrltop);
    	const mousedown_handler_1 = () => ctrlbottom.move.call(ctrlbottom);

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, canvas = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("$bezier" in $$props) bezier.set($bezier = $$props.$bezier);
    	};

    	return [
    		canvas,
    		cvsdata,
    		ctrltop,
    		ctrlbottom,
    		canvasSize,
    		mouseMove,
    		ctx,
    		$bezier,
    		ctrlmove,
    		ctrlDraw,
    		mousedown_handler,
    		mousedown_handler_1,
    		canvas_1_binding
    	];
    }

    class MCanvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MCanvas",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/beziersvg.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/beziersvg.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let svg;
    	let path0;
    	let path0_d_value;
    	let path1;
    	let path1_d_value;
    	let circle0;
    	let circle0_cx_value;
    	let circle0_cy_value;
    	let path2;
    	let path2_d_value;
    	let circle1;
    	let circle1_cx_value;
    	let circle1_cy_value;
    	let svg_width_value;
    	let svg_height_value;
    	let svg_viewBox_value;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			circle0 = svg_element("circle");
    			path2 = svg_element("path");
    			circle1 = svg_element("circle");
    			attr_dev(path0, "class", "path svelte-f2393s");
    			attr_dev(path0, "d", path0_d_value = "M " + correct + " " + (1 + correct) + " C " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1] + ", " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3] + ", " + (1 + correct) + " " + correct);
    			attr_dev(path0, "stroke-width", "0.03");
    			attr_dev(path0, "fill", "transparent");
    			add_location(path0, file$1, 12, 4, 491);
    			attr_dev(path1, "class", "path2dot svelte-f2393s");
    			attr_dev(path1, "d", path1_d_value = "M " + correct + " " + (1 + correct) + " L " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1]);
    			attr_dev(path1, "stroke-width", "0.02");
    			attr_dev(path1, "fill", "transparent");
    			add_location(path1, file$1, 13, 4, 667);
    			attr_dev(circle0, "class", "dot svelte-f2393s");
    			attr_dev(circle0, "cx", circle0_cx_value = /*bezier*/ ctx[2][0]);
    			attr_dev(circle0, "cy", circle0_cy_value = /*bezier*/ ctx[2][1]);
    			attr_dev(circle0, "r", "0.03");
    			add_location(circle0, file$1, 14, 4, 797);
    			attr_dev(path2, "class", "path2dot svelte-f2393s");
    			attr_dev(path2, "d", path2_d_value = "M " + (1 + correct) + " " + correct + " L " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3]);
    			attr_dev(path2, "stroke-width", "0.02");
    			attr_dev(path2, "fill", "transparent");
    			add_location(path2, file$1, 15, 4, 866);
    			attr_dev(circle1, "class", "dot svelte-f2393s");
    			attr_dev(circle1, "cx", circle1_cx_value = /*bezier*/ ctx[2][2]);
    			attr_dev(circle1, "cy", circle1_cy_value = /*bezier*/ ctx[2][3]);
    			attr_dev(circle1, "r", "0.03");
    			add_location(circle1, file$1, 16, 4, 996);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", svg_width_value = "" + (/*size*/ ctx[0] + "px"));
    			attr_dev(svg, "height", svg_height_value = "" + (/*size*/ ctx[0] + "px"));
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + (1 + correct * 2) + " " + (1 + correct * 2));
    			add_location(svg, file$1, 11, 2, 361);
    			attr_dev(div, "class", div_class_value = "bezier_item " + /*eclass*/ ctx[1] + " svelte-f2393s");
    			set_style(div, "width", /*size*/ ctx[0] + "px");
    			set_style(div, "height", /*size*/ ctx[0] + "px");
    			add_location(div, file$1, 10, 0, 284);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, circle0);
    			append_dev(svg, path2);
    			append_dev(svg, circle1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*bezier*/ 4 && path0_d_value !== (path0_d_value = "M " + correct + " " + (1 + correct) + " C " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1] + ", " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3] + ", " + (1 + correct) + " " + correct)) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*bezier*/ 4 && path1_d_value !== (path1_d_value = "M " + correct + " " + (1 + correct) + " L " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*bezier*/ 4 && circle0_cx_value !== (circle0_cx_value = /*bezier*/ ctx[2][0])) {
    				attr_dev(circle0, "cx", circle0_cx_value);
    			}

    			if (dirty & /*bezier*/ 4 && circle0_cy_value !== (circle0_cy_value = /*bezier*/ ctx[2][1])) {
    				attr_dev(circle0, "cy", circle0_cy_value);
    			}

    			if (dirty & /*bezier*/ 4 && path2_d_value !== (path2_d_value = "M " + (1 + correct) + " " + correct + " L " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3])) {
    				attr_dev(path2, "d", path2_d_value);
    			}

    			if (dirty & /*bezier*/ 4 && circle1_cx_value !== (circle1_cx_value = /*bezier*/ ctx[2][2])) {
    				attr_dev(circle1, "cx", circle1_cx_value);
    			}

    			if (dirty & /*bezier*/ 4 && circle1_cy_value !== (circle1_cy_value = /*bezier*/ ctx[2][3])) {
    				attr_dev(circle1, "cy", circle1_cy_value);
    			}

    			if (dirty & /*size*/ 1 && svg_width_value !== (svg_width_value = "" + (/*size*/ ctx[0] + "px"))) {
    				attr_dev(svg, "width", svg_width_value);
    			}

    			if (dirty & /*size*/ 1 && svg_height_value !== (svg_height_value = "" + (/*size*/ ctx[0] + "px"))) {
    				attr_dev(svg, "height", svg_height_value);
    			}

    			if (dirty & /*eclass*/ 2 && div_class_value !== (div_class_value = "bezier_item " + /*eclass*/ ctx[1] + " svelte-f2393s")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*size*/ 1) {
    				set_style(div, "width", /*size*/ ctx[0] + "px");
    			}

    			if (dirty & /*size*/ 1) {
    				set_style(div, "height", /*size*/ ctx[0] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const correct = 0.25;

    function instance$1($$self, $$props, $$invalidate) {
    	let { size = 1 } = $$props;
    	let { originalbezier = [0, 0.5, 1, 0.5] } = $$props;
    	let { eclass = "" } = $$props;
    	const writable_props = ["size", "originalbezier", "eclass"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Beziersvg> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("originalbezier" in $$props) $$invalidate(3, originalbezier = $$props.originalbezier);
    		if ("eclass" in $$props) $$invalidate(1, eclass = $$props.eclass);
    	};

    	$$self.$capture_state = () => {
    		return { size, originalbezier, eclass, bezier };
    	};

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("originalbezier" in $$props) $$invalidate(3, originalbezier = $$props.originalbezier);
    		if ("eclass" in $$props) $$invalidate(1, eclass = $$props.eclass);
    		if ("bezier" in $$props) $$invalidate(2, bezier = $$props.bezier);
    	};

    	let bezier;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*originalbezier*/ 8) {
    			 $$invalidate(2, bezier = [
    				originalbezier[0] * 1 + correct,
    				1 + correct - originalbezier[1] * 1,
    				originalbezier[2] * 1 + correct,
    				1 + correct - originalbezier[3] * 1
    			]);
    		}
    	};

    	return [size, eclass, bezier, originalbezier];
    }

    class Beziersvg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { size: 0, originalbezier: 3, eclass: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Beziersvg",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<Beziersvg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Beziersvg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get originalbezier() {
    		throw new Error("<Beziersvg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set originalbezier(value) {
    		throw new Error("<Beziersvg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get eclass() {
    		throw new Error("<Beziersvg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set eclass(value) {
    		throw new Error("<Beziersvg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/App.svelte";

    // (64:4) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "cubic-bezier(0, 0, 0, 0)";
    			add_location(p, file$2, 64, 6, 1611);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(64:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (57:4) {#if $bezier}
    function create_if_block(ctx) {
    	let p;
    	let t0;
    	let span0;
    	let t1_value = /*$bezier*/ ctx[2][0] + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*$bezier*/ ctx[2][1] + "";
    	let t3;
    	let t4;
    	let span2;
    	let t5_value = /*$bezier*/ ctx[2][2] + "";
    	let t5;
    	let t6;
    	let span3;
    	let t7_value = /*$bezier*/ ctx[2][3] + "";
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("cubic-bezier(\n        ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = text(",\n        ");
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(",\n        ");
    			span2 = element("span");
    			t5 = text(t5_value);
    			t6 = text(",\n        ");
    			span3 = element("span");
    			t7 = text(t7_value);
    			t8 = text("\n      )");
    			attr_dev(span0, "class", "bottompos svelte-a44oir");
    			add_location(span0, file$2, 58, 8, 1384);
    			attr_dev(span1, "class", "bottompos svelte-a44oir");
    			add_location(span1, file$2, 59, 8, 1437);
    			attr_dev(span2, "class", "toppos svelte-a44oir");
    			add_location(span2, file$2, 60, 8, 1490);
    			attr_dev(span3, "class", "toppos svelte-a44oir");
    			add_location(span3, file$2, 61, 8, 1540);
    			attr_dev(p, "class", "title svelte-a44oir");
    			add_location(p, file$2, 57, 6, 1345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, span0);
    			append_dev(span0, t1);
    			append_dev(p, t2);
    			append_dev(p, span1);
    			append_dev(span1, t3);
    			append_dev(p, t4);
    			append_dev(p, span2);
    			append_dev(span2, t5);
    			append_dev(p, t6);
    			append_dev(p, span3);
    			append_dev(span3, t7);
    			append_dev(p, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$bezier*/ 4 && t1_value !== (t1_value = /*$bezier*/ ctx[2][0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$bezier*/ 4 && t3_value !== (t3_value = /*$bezier*/ ctx[2][1] + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*$bezier*/ 4 && t5_value !== (t5_value = /*$bezier*/ ctx[2][2] + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$bezier*/ 4 && t7_value !== (t7_value = /*$bezier*/ ctx[2][3] + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(57:4) {#if $bezier}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div11;
    	let t0;
    	let div10;
    	let div0;
    	let t1;
    	let div9;
    	let div1;
    	let h2;
    	let t3;
    	let button;
    	let span0;
    	let t5;
    	let div5;
    	let span1;
    	let t7;
    	let div3;
    	let div2;
    	let span2;
    	let t8;
    	let span3;
    	let t9;
    	let div4;
    	let t10_value = /*timeDot*/ ctx[0].time + "";
    	let t10;
    	let t11;
    	let t12;
    	let div8;
    	let div6;
    	let div6_class_value;
    	let t13;
    	let div7;
    	let div7_class_value;
    	let current;
    	let dispose;
    	const mcanvas = new MCanvas({ $$inline: true });

    	function select_block_type(ctx, dirty) {
    		if (/*$bezier*/ ctx[2]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const beziersvg0 = new Beziersvg({
    			props: {
    				eclass: "target",
    				size: 60,
    				originalbezier: /*$bezier*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const beziersvg1 = new Beziersvg({
    			props: {
    				eclass: "refer",
    				size: 60,
    				originalbezier: /*referone*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			create_component(mcanvas.$$.fragment);
    			t0 = space();
    			div10 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t1 = space();
    			div9 = element("div");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Preview & compare";
    			t3 = space();
    			button = element("button");
    			span0 = element("span");
    			span0.textContent = "GO!";
    			t5 = space();
    			div5 = element("div");
    			span1 = element("span");
    			span1.textContent = "Duration:";
    			t7 = space();
    			div3 = element("div");
    			div2 = element("div");
    			span2 = element("span");
    			t8 = space();
    			span3 = element("span");
    			t9 = space();
    			div4 = element("div");
    			t10 = text(t10_value);
    			t11 = text(" s");
    			t12 = space();
    			div8 = element("div");
    			div6 = element("div");
    			create_component(beziersvg0.$$.fragment);
    			t13 = space();
    			div7 = element("div");
    			create_component(beziersvg1.$$.fragment);
    			attr_dev(div0, "class", "header");
    			add_location(div0, file$2, 55, 4, 1300);
    			add_location(h2, file$2, 69, 8, 1724);
    			add_location(span0, file$2, 70, 75, 1826);
    			attr_dev(button, "class", "button gobtn svelte-a44oir");
    			add_location(button, file$2, 70, 8, 1759);
    			attr_dev(div1, "class", "subtitle svelte-a44oir");
    			add_location(div1, file$2, 68, 6, 1693);
    			add_location(span1, file$2, 73, 8, 1905);
    			attr_dev(span2, "class", "bgfill svelte-a44oir");
    			set_style(span2, "width", /*timeDot*/ ctx[0].left + "px");
    			add_location(span2, file$2, 76, 12, 2036);
    			attr_dev(span3, "class", "inner-dot svelte-a44oir");
    			set_style(span3, "left", /*timeDot*/ ctx[0].left + "px");
    			add_location(span3, file$2, 77, 12, 2108);
    			attr_dev(div2, "class", "inner-slider svelte-a44oir");
    			add_location(div2, file$2, 75, 10, 1967);
    			attr_dev(div3, "class", "slider svelte-a44oir");
    			add_location(div3, file$2, 74, 8, 1936);
    			attr_dev(div4, "class", "time");
    			add_location(div4, file$2, 80, 8, 2238);
    			attr_dev(div5, "class", "timecontrol svelte-a44oir");
    			add_location(div5, file$2, 72, 6, 1871);
    			attr_dev(div6, "class", div6_class_value = "plane-item" + (/*active*/ ctx[1] ? " transform" : "") + " svelte-a44oir");
    			set_style(div6, "transition-duration", /*timeDot*/ ctx[0].time + "s");
    			set_style(div6, "transition-timing-function", "cubic-bezier(" + /*$bezier*/ ctx[2][0] + ", " + /*$bezier*/ ctx[2][1] + ", " + /*$bezier*/ ctx[2][2] + ", " + /*$bezier*/ ctx[2][3] + ")");
    			add_location(div6, file$2, 83, 8, 2334);
    			attr_dev(div7, "class", div7_class_value = "plane-item" + (/*active*/ ctx[1] ? " transform" : "") + " svelte-a44oir");
    			set_style(div7, "transition-duration", /*timeDot*/ ctx[0].time + "s");
    			set_style(div7, "transition-timing-function", "cubic-bezier(" + /*referone*/ ctx[3][0] + ", " + /*referone*/ ctx[3][1] + ", " + /*referone*/ ctx[3][2] + ", " + /*referone*/ ctx[3][3] + ")");
    			add_location(div7, file$2, 86, 8, 2628);
    			attr_dev(div8, "class", "animate-plane svelte-a44oir");
    			add_location(div8, file$2, 82, 6, 2298);
    			attr_dev(div9, "class", "body svelte-a44oir");
    			add_location(div9, file$2, 67, 4, 1668);
    			attr_dev(div10, "class", "container");
    			add_location(div10, file$2, 54, 2, 1272);
    			attr_dev(div11, "id", "app");
    			attr_dev(div11, "class", "svelte-a44oir");
    			add_location(div11, file$2, 52, 0, 1233);

    			dispose = [
    				listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false),
    				listen_dev(
    					span3,
    					"mousedown",
    					function () {
    						if (is_function(/*timeDot*/ ctx[0].move)) /*timeDot*/ ctx[0].move.apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			mount_component(mcanvas, div11, null);
    			append_dev(div11, t0);
    			append_dev(div11, div10);
    			append_dev(div10, div0);
    			if_block.m(div0, null);
    			append_dev(div10, t1);
    			append_dev(div10, div9);
    			append_dev(div9, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t3);
    			append_dev(div1, button);
    			append_dev(button, span0);
    			append_dev(div9, t5);
    			append_dev(div9, div5);
    			append_dev(div5, span1);
    			append_dev(div5, t7);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, span2);
    			append_dev(div2, t8);
    			append_dev(div2, span3);
    			/*div2_binding*/ ctx[6](div2);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, t10);
    			append_dev(div4, t11);
    			append_dev(div9, t12);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			mount_component(beziersvg0, div6, null);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			mount_component(beziersvg1, div7, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (!current || dirty & /*timeDot*/ 1) {
    				set_style(span2, "width", /*timeDot*/ ctx[0].left + "px");
    			}

    			if (!current || dirty & /*timeDot*/ 1) {
    				set_style(span3, "left", /*timeDot*/ ctx[0].left + "px");
    			}

    			if ((!current || dirty & /*timeDot*/ 1) && t10_value !== (t10_value = /*timeDot*/ ctx[0].time + "")) set_data_dev(t10, t10_value);
    			const beziersvg0_changes = {};
    			if (dirty & /*$bezier*/ 4) beziersvg0_changes.originalbezier = /*$bezier*/ ctx[2];
    			beziersvg0.$set(beziersvg0_changes);

    			if (!current || dirty & /*active*/ 2 && div6_class_value !== (div6_class_value = "plane-item" + (/*active*/ ctx[1] ? " transform" : "") + " svelte-a44oir")) {
    				attr_dev(div6, "class", div6_class_value);
    			}

    			if (!current || dirty & /*timeDot*/ 1) {
    				set_style(div6, "transition-duration", /*timeDot*/ ctx[0].time + "s");
    			}

    			if (!current || dirty & /*$bezier*/ 4) {
    				set_style(div6, "transition-timing-function", "cubic-bezier(" + /*$bezier*/ ctx[2][0] + ", " + /*$bezier*/ ctx[2][1] + ", " + /*$bezier*/ ctx[2][2] + ", " + /*$bezier*/ ctx[2][3] + ")");
    			}

    			if (!current || dirty & /*active*/ 2 && div7_class_value !== (div7_class_value = "plane-item" + (/*active*/ ctx[1] ? " transform" : "") + " svelte-a44oir")) {
    				attr_dev(div7, "class", div7_class_value);
    			}

    			if (!current || dirty & /*timeDot*/ 1) {
    				set_style(div7, "transition-duration", /*timeDot*/ ctx[0].time + "s");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mcanvas.$$.fragment, local);
    			transition_in(beziersvg0.$$.fragment, local);
    			transition_in(beziersvg1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mcanvas.$$.fragment, local);
    			transition_out(beziersvg0.$$.fragment, local);
    			transition_out(beziersvg1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			destroy_component(mcanvas);
    			if_block.d();
    			/*div2_binding*/ ctx[6](null);
    			destroy_component(beziersvg0);
    			destroy_component(beziersvg1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $bezier;
    	validate_store(bezier, "bezier");
    	component_subscribe($$self, bezier, $$value => $$invalidate(2, $bezier = $$value));

    	utools.onPluginOut(() => {
    		localStorage.setItem("bezier", $bezier);
    	});

    	const curves = {
    		"ease": [0.25, 0.1, 0.25, 1],
    		"linear": [0, 0, 1, 1],
    		"ease-in": [0.42, 0, 1, 1],
    		"ease-out": [0, 0, 0.58, 1],
    		"ease-in-out": [0.42, 0, 0.58, 1]
    	};

    	const timeDot = {
    		fatherDom: "",
    		left: 26.125,
    		time: 1,
    		move() {
    			const { width, x } = timeDot.fatherDom.getBoundingClientRect();
    			let dist;

    			document.onmousemove = ({ clientX }) => {
    				dist = clientX - x - 2;
    				$$invalidate(0, timeDot.left = dist < 8 ? 8 : dist > width - 10 ? width - 10 : dist, timeDot);
    				$$invalidate(0, timeDot.time = Math.round((timeDot.left - 7) / (width - 17) * 100) / 10, timeDot);
    			};

    			document.onmouseup = () => {
    				document.onmousemove = null;
    				document.onmouseup = null;
    			};
    		}
    	};

    	let referone = curves.ease;
    	let active = false;

    	const click_handler = () => {
    		$$invalidate(1, active = !active);
    	};

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			timeDot.fatherDom = $$value;
    			$$invalidate(0, timeDot);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("referone" in $$props) $$invalidate(3, referone = $$props.referone);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("$bezier" in $$props) bezier.set($bezier = $$props.$bezier);
    	};

    	return [timeDot, active, $bezier, referone, curves, click_handler, div2_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
