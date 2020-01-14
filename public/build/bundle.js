
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    const transbezier = (localStorage.getItem('bezier') && localStorage.getItem('bezier').split(',')) || [0, 0.5, 1, 0.5];

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
    			add_location(span0, file, 101, 2, 2737);
    			attr_dev(span1, "class", "dot bottom svelte-k89guf");
    			add_location(span1, file, 102, 2, 2769);
    			attr_dev(button0, "class", "ctrltop ctrlbtn svelte-k89guf");
    			set_style(button0, "top", /*ctrltop*/ ctx[2].top + "px");
    			set_style(button0, "left", /*ctrltop*/ ctx[2].left + "px");
    			add_location(button0, file, 103, 2, 2804);
    			attr_dev(button1, "class", "ctrlbottom ctrlbtn svelte-k89guf");
    			set_style(button1, "top", /*ctrlbottom*/ ctx[3].top + "px");
    			set_style(button1, "left", /*ctrlbottom*/ ctx[3].left + "px");
    			add_location(button1, file, 104, 2, 2946);
    			attr_dev(canvas_1, "id", "canvas");
    			attr_dev(canvas_1, "height", canvas_1_height_value = /*canvasSize*/ ctx[4].h);
    			attr_dev(canvas_1, "width", canvas_1_width_value = /*canvasSize*/ ctx[4].w);
    			attr_dev(canvas_1, "class", "svelte-k89guf");
    			add_location(canvas_1, file, 105, 2, 3103);
    			attr_dev(div, "class", "coordinate-plane svelte-k89guf");
    			attr_dev(div, "data-progression", div_data_progression_value = /*cvsdata*/ ctx[1].p);
    			attr_dev(div, "data-time", div_data_time_value = /*cvsdata*/ ctx[1].t);
    			add_location(div, file, 100, 0, 2626);

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
    		const [x1, y1, x2, y2] = $bezier;
    		const w = 300;
    		const h = 300;
    		$$invalidate(3, ctrlbottom.left = x1 * w, ctrlbottom);
    		$$invalidate(3, ctrlbottom.top = 450 - y1 * h, ctrlbottom);
    		$$invalidate(2, ctrltop.left = x2 * w, ctrltop);
    		$$invalidate(2, ctrltop.top = 450 - y2 * h, ctrltop);
    		draw(ctx, canvasSize.w, canvasSize.h, 0, 450, 300, 150, ctrlbottom.left, ctrlbottom.top, ctrltop.left, ctrltop.top);
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
    	let path0_class_value;
    	let path0_d_value;
    	let path1;
    	let path1_class_value;
    	let path1_d_value;
    	let circle0;
    	let circle0_class_value;
    	let circle0_cx_value;
    	let circle0_cy_value;
    	let path2;
    	let path2_class_value;
    	let path2_d_value;
    	let circle1;
    	let circle1_class_value;
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
    			attr_dev(path0, "class", path0_class_value = "path " + /*eclass*/ ctx[1] + " svelte-kd34s");
    			attr_dev(path0, "d", path0_d_value = "M " + correct + " " + (1 + correct) + " C " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1] + ", " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3] + ", " + (1 + correct) + " " + correct);
    			attr_dev(path0, "stroke-width", "0.03");
    			attr_dev(path0, "fill", "transparent");
    			add_location(path0, file$1, 12, 4, 491);
    			attr_dev(path1, "class", path1_class_value = "path2dot " + /*eclass*/ ctx[1] + " svelte-kd34s");
    			attr_dev(path1, "d", path1_d_value = "M " + correct + " " + (1 + correct) + " L " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1]);
    			attr_dev(path1, "stroke-width", "0.02");
    			attr_dev(path1, "fill", "transparent");
    			add_location(path1, file$1, 13, 4, 676);
    			attr_dev(circle0, "class", circle0_class_value = "dot " + /*eclass*/ ctx[1] + " svelte-kd34s");
    			attr_dev(circle0, "cx", circle0_cx_value = /*bezier*/ ctx[2][0]);
    			attr_dev(circle0, "cy", circle0_cy_value = /*bezier*/ ctx[2][1]);
    			attr_dev(circle0, "r", "0.03");
    			add_location(circle0, file$1, 14, 4, 815);
    			attr_dev(path2, "class", path2_class_value = "path2dot " + /*eclass*/ ctx[1] + " svelte-kd34s");
    			attr_dev(path2, "d", path2_d_value = "M " + (1 + correct) + " " + correct + " L " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3]);
    			attr_dev(path2, "stroke-width", "0.02");
    			attr_dev(path2, "fill", "transparent");
    			add_location(path2, file$1, 15, 4, 893);
    			attr_dev(circle1, "class", circle1_class_value = "dot " + /*eclass*/ ctx[1] + " svelte-kd34s");
    			attr_dev(circle1, "cx", circle1_cx_value = /*bezier*/ ctx[2][2]);
    			attr_dev(circle1, "cy", circle1_cy_value = /*bezier*/ ctx[2][3]);
    			attr_dev(circle1, "r", "0.03");
    			add_location(circle1, file$1, 16, 4, 1032);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", svg_width_value = "" + (/*size*/ ctx[0] + "px"));
    			attr_dev(svg, "height", svg_height_value = "" + (/*size*/ ctx[0] + "px"));
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + (1 + correct * 2) + " " + (1 + correct * 2));
    			add_location(svg, file$1, 11, 2, 361);
    			attr_dev(div, "class", div_class_value = "bezier_item " + /*eclass*/ ctx[1] + " svelte-kd34s");
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
    			if (dirty & /*eclass*/ 2 && path0_class_value !== (path0_class_value = "path " + /*eclass*/ ctx[1] + " svelte-kd34s")) {
    				attr_dev(path0, "class", path0_class_value);
    			}

    			if (dirty & /*bezier*/ 4 && path0_d_value !== (path0_d_value = "M " + correct + " " + (1 + correct) + " C " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1] + ", " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3] + ", " + (1 + correct) + " " + correct)) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*eclass*/ 2 && path1_class_value !== (path1_class_value = "path2dot " + /*eclass*/ ctx[1] + " svelte-kd34s")) {
    				attr_dev(path1, "class", path1_class_value);
    			}

    			if (dirty & /*bezier*/ 4 && path1_d_value !== (path1_d_value = "M " + correct + " " + (1 + correct) + " L " + /*bezier*/ ctx[2][0] + " " + /*bezier*/ ctx[2][1])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*eclass*/ 2 && circle0_class_value !== (circle0_class_value = "dot " + /*eclass*/ ctx[1] + " svelte-kd34s")) {
    				attr_dev(circle0, "class", circle0_class_value);
    			}

    			if (dirty & /*bezier*/ 4 && circle0_cx_value !== (circle0_cx_value = /*bezier*/ ctx[2][0])) {
    				attr_dev(circle0, "cx", circle0_cx_value);
    			}

    			if (dirty & /*bezier*/ 4 && circle0_cy_value !== (circle0_cy_value = /*bezier*/ ctx[2][1])) {
    				attr_dev(circle0, "cy", circle0_cy_value);
    			}

    			if (dirty & /*eclass*/ 2 && path2_class_value !== (path2_class_value = "path2dot " + /*eclass*/ ctx[1] + " svelte-kd34s")) {
    				attr_dev(path2, "class", path2_class_value);
    			}

    			if (dirty & /*bezier*/ 4 && path2_d_value !== (path2_d_value = "M " + (1 + correct) + " " + correct + " L " + /*bezier*/ ctx[2][2] + " " + /*bezier*/ ctx[2][3])) {
    				attr_dev(path2, "d", path2_d_value);
    			}

    			if (dirty & /*eclass*/ 2 && circle1_class_value !== (circle1_class_value = "dot " + /*eclass*/ ctx[1] + " svelte-kd34s")) {
    				attr_dev(circle1, "class", circle1_class_value);
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

    			if (dirty & /*eclass*/ 2 && div_class_value !== (div_class_value = "bezier_item " + /*eclass*/ ctx[1] + " svelte-kd34s")) {
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

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (81:4) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "cubic-bezier(0, 0, 0, 0)";
    			attr_dev(p, "class", "svelte-175o1ff");
    			add_location(p, file$2, 81, 6, 2157);
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
    		source: "(81:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:4) {#if $bezier}
    function create_if_block(ctx) {
    	let p;
    	let t0;
    	let span0;
    	let t1_value = /*$bezier*/ ctx[5][0] + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*$bezier*/ ctx[5][1] + "";
    	let t3;
    	let t4;
    	let span2;
    	let t5_value = /*$bezier*/ ctx[5][2] + "";
    	let t5;
    	let t6;
    	let span3;
    	let t7_value = /*$bezier*/ ctx[5][3] + "";
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
    			attr_dev(span0, "class", "bottompos svelte-175o1ff");
    			add_location(span0, file$2, 75, 8, 1930);
    			attr_dev(span1, "class", "bottompos svelte-175o1ff");
    			add_location(span1, file$2, 76, 8, 1983);
    			attr_dev(span2, "class", "toppos svelte-175o1ff");
    			add_location(span2, file$2, 77, 8, 2036);
    			attr_dev(span3, "class", "toppos svelte-175o1ff");
    			add_location(span3, file$2, 78, 8, 2086);
    			attr_dev(p, "class", "title svelte-175o1ff");
    			add_location(p, file$2, 74, 6, 1891);
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
    			if (dirty & /*$bezier*/ 32 && t1_value !== (t1_value = /*$bezier*/ ctx[5][0] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$bezier*/ 32 && t3_value !== (t3_value = /*$bezier*/ ctx[5][1] + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*$bezier*/ 32 && t5_value !== (t5_value = /*$bezier*/ ctx[5][2] + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$bezier*/ 32 && t7_value !== (t7_value = /*$bezier*/ ctx[5][3] + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(74:4) {#if $bezier}",
    		ctx
    	});

    	return block;
    }

    // (116:10) {#each Object.keys(curves) as key}
    function create_each_block(ctx) {
    	let div;
    	let t0;
    	let p;
    	let t1_value = /*key*/ ctx[9] + "";
    	let t1;
    	let t2;
    	let current;
    	let dispose;

    	const beziersvg = new Beziersvg({
    			props: {
    				eclass: /*key*/ ctx[9] === /*chosenone*/ ctx[3]
    				? "plain is-active"
    				: "plain",
    				size: 100,
    				originalbezier: /*curves*/ ctx[0][/*key*/ ctx[9]]
    			},
    			$$inline: true
    		});

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[8](/*key*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(beziersvg.$$.fragment);
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(p, "class", "svelte-175o1ff");
    			add_location(p, file$2, 118, 14, 4047);
    			attr_dev(div, "class", "exhibit_item svelte-175o1ff");
    			add_location(div, file$2, 116, 12, 3838);
    			dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(beziersvg, div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const beziersvg_changes = {};

    			if (dirty & /*curves, chosenone*/ 9) beziersvg_changes.eclass = /*key*/ ctx[9] === /*chosenone*/ ctx[3]
    			? "plain is-active"
    			: "plain";

    			if (dirty & /*curves*/ 1) beziersvg_changes.originalbezier = /*curves*/ ctx[0][/*key*/ ctx[9]];
    			beziersvg.$set(beziersvg_changes);
    			if ((!current || dirty & /*curves*/ 1) && t1_value !== (t1_value = /*key*/ ctx[9] + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(beziersvg.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(beziersvg.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(beziersvg);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(116:10) {#each Object.keys(curves) as key}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div15;
    	let t0;
    	let div14;
    	let div0;
    	let t1;
    	let div13;
    	let div9;
    	let div1;
    	let h20;
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
    	let t10_value = /*timeDot*/ ctx[1].time + "";
    	let t10;
    	let t11;
    	let t12;
    	let div8;
    	let div6;
    	let div6_class_value;
    	let t13;
    	let div7;
    	let div7_class_value;
    	let t14;
    	let div12;
    	let div10;
    	let h21;
    	let t16;
    	let p;
    	let t18;
    	let div11;
    	let current;
    	let dispose;
    	const mcanvas = new MCanvas({ $$inline: true });

    	function select_block_type(ctx, dirty) {
    		if (/*$bezier*/ ctx[5]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const beziersvg0 = new Beziersvg({
    			props: {
    				eclass: "target",
    				size: 80,
    				originalbezier: /*$bezier*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const beziersvg1 = new Beziersvg({
    			props: {
    				eclass: "refer",
    				size: 80,
    				originalbezier: /*referone*/ ctx[4]
    			},
    			$$inline: true
    		});

    	let each_value = Object.keys(/*curves*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			create_component(mcanvas.$$.fragment);
    			t0 = space();
    			div14 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t1 = space();
    			div13 = element("div");
    			div9 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Preview & compare";
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
    			t14 = space();
    			div12 = element("div");
    			div10 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Library";
    			t16 = space();
    			p = element("p");
    			p.textContent = "Click on a curve to compare it with the current one.";
    			t18 = space();
    			div11 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "header");
    			add_location(div0, file$2, 72, 4, 1846);
    			add_location(h20, file$2, 87, 10, 2302);
    			add_location(span0, file$2, 88, 77, 2406);
    			attr_dev(button, "class", "button gobtn svelte-175o1ff");
    			add_location(button, file$2, 88, 10, 2339);
    			attr_dev(div1, "class", "subtitle svelte-175o1ff");
    			add_location(div1, file$2, 86, 8, 2269);
    			add_location(span1, file$2, 91, 10, 2491);
    			attr_dev(span2, "class", "bgfill svelte-175o1ff");
    			set_style(span2, "width", /*timeDot*/ ctx[1].left + "px");
    			add_location(span2, file$2, 94, 14, 2628);
    			attr_dev(span3, "class", "inner-dot svelte-175o1ff");
    			set_style(span3, "left", /*timeDot*/ ctx[1].left + "px");
    			add_location(span3, file$2, 95, 14, 2702);
    			attr_dev(div2, "class", "inner-slider svelte-175o1ff");
    			add_location(div2, file$2, 93, 12, 2557);
    			attr_dev(div3, "class", "slider svelte-175o1ff");
    			add_location(div3, file$2, 92, 10, 2524);
    			attr_dev(div4, "class", "time");
    			add_location(div4, file$2, 98, 10, 2838);
    			attr_dev(div5, "class", "timecontrol svelte-175o1ff");
    			add_location(div5, file$2, 90, 8, 2455);
    			attr_dev(div6, "class", div6_class_value = "plane-item" + (/*active*/ ctx[2] ? " transform" : "") + " svelte-175o1ff");
    			set_style(div6, "transition-duration", /*timeDot*/ ctx[1].time + "s");
    			set_style(div6, "transition-timing-function", "cubic-bezier(" + /*$bezier*/ ctx[5][0] + ", " + /*$bezier*/ ctx[5][1] + ", " + /*$bezier*/ ctx[5][2] + ", " + /*$bezier*/ ctx[5][3] + ")");
    			add_location(div6, file$2, 101, 10, 2940);
    			attr_dev(div7, "class", div7_class_value = "plane-item" + (/*active*/ ctx[2] ? " transform" : "") + " svelte-175o1ff");
    			set_style(div7, "transition-duration", /*timeDot*/ ctx[1].time + "s");
    			set_style(div7, "transition-timing-function", "cubic-bezier(" + /*referone*/ ctx[4][0] + ", " + /*referone*/ ctx[4][1] + ", " + /*referone*/ ctx[4][2] + ", " + /*referone*/ ctx[4][3] + ")");
    			add_location(div7, file$2, 104, 10, 3240);
    			attr_dev(div8, "class", "animate-plane svelte-175o1ff");
    			add_location(div8, file$2, 100, 8, 2902);
    			attr_dev(div9, "class", "body svelte-175o1ff");
    			add_location(div9, file$2, 85, 6, 2242);
    			add_location(h21, file$2, 111, 10, 3630);
    			attr_dev(p, "class", "explain svelte-175o1ff");
    			add_location(p, file$2, 112, 10, 3657);
    			attr_dev(div10, "class", "subtitle");
    			add_location(div10, file$2, 110, 8, 3597);
    			attr_dev(div11, "class", "exhibition svelte-175o1ff");
    			add_location(div11, file$2, 114, 8, 3756);
    			attr_dev(div12, "class", "footer svelte-175o1ff");
    			add_location(div12, file$2, 109, 6, 3568);
    			attr_dev(div13, "class", "content svelte-175o1ff");
    			add_location(div13, file$2, 84, 4, 2214);
    			attr_dev(div14, "class", "container");
    			add_location(div14, file$2, 71, 2, 1818);
    			attr_dev(div15, "id", "app");
    			attr_dev(div15, "class", "svelte-175o1ff");
    			add_location(div15, file$2, 69, 0, 1779);

    			dispose = [
    				listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false),
    				listen_dev(
    					span3,
    					"mousedown",
    					function () {
    						if (is_function(/*timeDot*/ ctx[1].move)) /*timeDot*/ ctx[1].move.apply(this, arguments);
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
    			insert_dev(target, div15, anchor);
    			mount_component(mcanvas, div15, null);
    			append_dev(div15, t0);
    			append_dev(div15, div14);
    			append_dev(div14, div0);
    			if_block.m(div0, null);
    			append_dev(div14, t1);
    			append_dev(div14, div13);
    			append_dev(div13, div9);
    			append_dev(div9, div1);
    			append_dev(div1, h20);
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
    			/*div2_binding*/ ctx[7](div2);
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
    			append_dev(div13, t14);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, h21);
    			append_dev(div10, t16);
    			append_dev(div10, p);
    			append_dev(div12, t18);
    			append_dev(div12, div11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div11, null);
    			}

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

    			if (!current || dirty & /*timeDot*/ 2) {
    				set_style(span2, "width", /*timeDot*/ ctx[1].left + "px");
    			}

    			if (!current || dirty & /*timeDot*/ 2) {
    				set_style(span3, "left", /*timeDot*/ ctx[1].left + "px");
    			}

    			if ((!current || dirty & /*timeDot*/ 2) && t10_value !== (t10_value = /*timeDot*/ ctx[1].time + "")) set_data_dev(t10, t10_value);
    			const beziersvg0_changes = {};
    			if (dirty & /*$bezier*/ 32) beziersvg0_changes.originalbezier = /*$bezier*/ ctx[5];
    			beziersvg0.$set(beziersvg0_changes);

    			if (!current || dirty & /*active*/ 4 && div6_class_value !== (div6_class_value = "plane-item" + (/*active*/ ctx[2] ? " transform" : "") + " svelte-175o1ff")) {
    				attr_dev(div6, "class", div6_class_value);
    			}

    			if (!current || dirty & /*timeDot*/ 2) {
    				set_style(div6, "transition-duration", /*timeDot*/ ctx[1].time + "s");
    			}

    			if (!current || dirty & /*$bezier*/ 32) {
    				set_style(div6, "transition-timing-function", "cubic-bezier(" + /*$bezier*/ ctx[5][0] + ", " + /*$bezier*/ ctx[5][1] + ", " + /*$bezier*/ ctx[5][2] + ", " + /*$bezier*/ ctx[5][3] + ")");
    			}

    			const beziersvg1_changes = {};
    			if (dirty & /*referone*/ 16) beziersvg1_changes.originalbezier = /*referone*/ ctx[4];
    			beziersvg1.$set(beziersvg1_changes);

    			if (!current || dirty & /*active*/ 4 && div7_class_value !== (div7_class_value = "plane-item" + (/*active*/ ctx[2] ? " transform" : "") + " svelte-175o1ff")) {
    				attr_dev(div7, "class", div7_class_value);
    			}

    			if (!current || dirty & /*timeDot*/ 2) {
    				set_style(div7, "transition-duration", /*timeDot*/ ctx[1].time + "s");
    			}

    			if (!current || dirty & /*referone*/ 16) {
    				set_style(div7, "transition-timing-function", "cubic-bezier(" + /*referone*/ ctx[4][0] + ", " + /*referone*/ ctx[4][1] + ", " + /*referone*/ ctx[4][2] + ", " + /*referone*/ ctx[4][3] + ")");
    			}

    			if (dirty & /*chosenone, Object, curves*/ 9) {
    				each_value = Object.keys(/*curves*/ ctx[0]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div11, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mcanvas.$$.fragment, local);
    			transition_in(beziersvg0.$$.fragment, local);
    			transition_in(beziersvg1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mcanvas.$$.fragment, local);
    			transition_out(beziersvg0.$$.fragment, local);
    			transition_out(beziersvg1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			destroy_component(mcanvas);
    			if_block.d();
    			/*div2_binding*/ ctx[7](null);
    			destroy_component(beziersvg0);
    			destroy_component(beziersvg1);
    			destroy_each(each_blocks, detaching);
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

    function initCurves() {
    	try {
    		let curves_db = null;

    		if (curves_db.lengt === 0) {
    			curves_db = [
    				{
    					_id: "curves_ease",
    					val: [0.25, 0.1, 0.25, 1]
    				},
    				{ _id: "curves_linear", val: [0, 0, 1, 1] },
    				{
    					_id: "curves_ease-in",
    					val: [0.42, 0, 1, 1]
    				},
    				{
    					_id: "curves_ease-out",
    					val: [0, 0, 0.58, 1]
    				},
    				{
    					_id: "curves_ease-in-out",
    					val: [0.42, 0, 0.58, 1]
    				}
    			];

    			curves_db.map(v => utools.db.put(v));
    		}

    		const curves2obj = {};

    		curves_db.map(v => {
    			Object.assign(curves2obj, { [v._id.slice(7)]: v.val });
    		});

    		return curves2obj;
    	} catch {
    		return null;
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $bezier;
    	validate_store(bezier, "bezier");
    	component_subscribe($$self, bezier, $$value => $$invalidate(5, $bezier = $$value));
    	let curves = { "ease": [0.25, 0.1, 0.25, 1] };

    	utools.onPluginReady(() => {
    		const curves_temp = initCurves();

    		if (curves_temp) {
    			$$invalidate(0, curves = curves_temp);
    		}
    	});

    	const timeDot = {
    		fatherDom: "",
    		left: 26.125,
    		time: 1,
    		move() {
    			const { width, x } = timeDot.fatherDom.getBoundingClientRect();
    			let dist;

    			document.onmousemove = ({ clientX }) => {
    				dist = clientX - x - 2;
    				$$invalidate(1, timeDot.left = dist < 8 ? 8 : dist > width - 10 ? width - 10 : dist, timeDot);
    				$$invalidate(1, timeDot.time = Math.round((timeDot.left - 7) / (width - 17) * 100) / 10, timeDot);
    			};

    			document.onmouseup = () => {
    				document.onmousemove = null;
    				document.onmouseup = null;
    			};
    		}
    	};

    	let active = false;
    	let chosenone = localStorage.getItem("chosenone") || "";

    	utools.onPluginOut(() => {
    		localStorage.setItem("bezier", $bezier);
    		localStorage.setItem("chosenone", chosenone);
    	});

    	const click_handler = () => {
    		$$invalidate(2, active = !active);
    	};

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			timeDot.fatherDom = $$value;
    			$$invalidate(1, timeDot);
    		});
    	}

    	const click_handler_1 = key => $$invalidate(3, chosenone = key);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("curves" in $$props) $$invalidate(0, curves = $$props.curves);
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    		if ("chosenone" in $$props) $$invalidate(3, chosenone = $$props.chosenone);
    		if ("referone" in $$props) $$invalidate(4, referone = $$props.referone);
    		if ("$bezier" in $$props) bezier.set($bezier = $$props.$bezier);
    	};

    	let referone;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*curves, chosenone*/ 9) {
    			 $$invalidate(4, referone = curves[chosenone || "ease"]);
    		}
    	};

    	return [
    		curves,
    		timeDot,
    		active,
    		chosenone,
    		referone,
    		$bezier,
    		click_handler,
    		div2_binding,
    		click_handler_1
    	];
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
