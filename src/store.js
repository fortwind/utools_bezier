import { writable } from 'svelte/store'

const transbezier = (localStorage.getItem('bezier') && localStorage.getItem('bezier').split(',')) || [0, 0.5, 1, 0.5]

export const bezier = writable(transbezier)