import { writable } from 'svelte/store'

const transbezier = localStorage.getItem('bezier') && localStorage.getItem('bezier').split(',')

export const bezier = writable(transbezier)