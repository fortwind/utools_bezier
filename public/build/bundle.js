
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
    			attr_dev(span0, "class", "dot top svelte-1atvsst");
    			add_location(span0, file, 54, 2, 1333);
    			attr_dev(span1, "class", "dot bottom svelte-1atvsst");
    			add_location(span1, file, 55, 2, 1365);
    			attr_dev(button0, "class", "ctrltop ctrlbtn svelte-1atvsst");
    			set_style(button0, "top", /*ctrltop*/ ctx[2].top + "px");
    			set_style(button0, "left", /*ctrltop*/ ctx[2].left + "px");
    			add_location(button0, file, 56, 2, 1400);
    			attr_dev(button1, "class", "ctrlbottom ctrlbtn svelte-1atvsst");
    			set_style(button1, "top", /*ctrlbottom*/ ctx[3].top + "px");
    			set_style(button1, "left", /*ctrlbottom*/ ctx[3].left + "px");
    			add_location(button1, file, 57, 2, 1542);
    			attr_dev(canvas_1, "id", "canvas");
    			attr_dev(canvas_1, "height", canvas_1_height_value = /*canvasSize*/ ctx[4].h);
    			attr_dev(canvas_1, "width", canvas_1_width_value = /*canvasSize*/ ctx[4].w);
    			attr_dev(canvas_1, "class", "svelte-1atvsst");
    			add_location(canvas_1, file, 58, 2, 1699);
    			attr_dev(div, "class", "coordinate-plane svelte-1atvsst");
    			attr_dev(div, "data-progression", div_data_progression_value = /*cvsdata*/ ctx[1].p);
    			attr_dev(div, "data-time", div_data_time_value = /*cvsdata*/ ctx[1].t);
    			add_location(div, file, 53, 0, 1222);

    			dispose = [
    				listen_dev(button0, "mousedown", /*mousedown_handler*/ ctx[7], false, false, false),
    				listen_dev(button1, "mousedown", /*mousedown_handler_1*/ ctx[8], false, false, false),
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
    			/*canvas_1_binding*/ ctx[9](canvas_1);
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
    			/*canvas_1_binding*/ ctx[9](null);
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

    function instance($$self, $$props, $$invalidate) {
    	let canvas;
    	const canvasSize = { w: 300, h: 600 };
    	const cvsdata = { p: 0, t: 0 };

    	const ctrltop = {
    		top: 0,
    		left: 0,
    		move() {
    			ctrlmove(0);
    		}
    	};

    	const ctrlbottom = {
    		top: 0,
    		left: 0,
    		move() {
    			ctrlmove(1);
    		}
    	};

    	function ctrlmove(flag) {
    		const { top, left, height, width } = document.querySelector(".coordinate-plane").getBoundingClientRect();
    		const ctx = canvas.getContext("2d");
    		ctx.strokeStyle = "#000000";
    		ctx.lineWidth = 10;

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

    			ctx.beginPath();
    			ctx.bezierCurveTo(100, 200, 300, 400, 500, 600);
    		};

    		document.onmouseup = () => {
    			document.onmousemove = null;
    			document.onmouseup = null;
    		};
    	}

    	const mouseMove = ({ layerX, layerY }) => {
    		$$invalidate(1, cvsdata.p = Math.round((canvasSize.h * 0.75 - layerY) / canvasSize.w * 100), cvsdata);
    		$$invalidate(1, cvsdata.t = Math.round(layerX / canvasSize.w * 100), cvsdata);
    	};

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
    	};

    	return [
    		canvas,
    		cvsdata,
    		ctrltop,
    		ctrlbottom,
    		canvasSize,
    		mouseMove,
    		ctrlmove,
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

    /* src/App.svelte generated by Svelte v3.16.7 */

    function create_fragment$1(ctx) {
    	let current;
    	const mcanvas = new MCanvas({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mcanvas.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(mcanvas, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mcanvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mcanvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mcanvas, detaching);
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

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
