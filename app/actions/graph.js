// @flow
import fs from 'fs';
import {
    remote
} from 'electron';
import type {
    GraphState, Node
} from 'react-graph-editor';

export const UPDATE_GRAPH = 'UPDATE_GRAPH';
export const ADD_NODE = 'ADD_NODE';

export const FILE_NEW = 'FILE_NEW';
export const FILE_OPEN = 'FILE_OPEN';
export const FILE_SAVE = 'FILE_SAVE';
export const FILE_SAVE_AS = 'FILE_SAVE_AS';

export const EDIT_UNDO = 'EDIT_UNDO';
export const EDIT_REDO = 'EDIT_REDO';
export const EDIT_COPY = 'EDIT_COPY';
export const EDIT_CUT = 'EDIT_CUT';
export const EDIT_PASTE = 'EDIT_PASTE';
export const EDIT_DELETE = 'EDIT_DELETE';
export const EDIT_SELECT_ALL = 'EDIT_SELECT_ALL';

type Dispatcher = (action: Object) => void;
type StateGetter = () => Object;

export function updateGraph(graph: GraphState) {
    return {
        type: UPDATE_GRAPH,
        graph
    };
}

export function addNode(node: Node) {
    return {
        type: ADD_NODE,
        node
    };
}

export function newFile() {
    return {
        type: FILE_NEW
    };
}

export function open() {
    return (dispatch: Dispatcher) => {
        remote.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{
                name: 'Rasen',
                extensions: ['rasen']
            }, {
                name: 'All Files',
                extensions: ['*']
            }]
        }, ([path]) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    return console.error(err);
                }

                dispatch({
                    type: FILE_OPEN,
                    data: JSON.parse(data),
                    path,
                });
            });
        });
    };
}

export function save() {
    return (dispatch: Dispatcher, getState: StateGetter) => {
        const {
            path, graph
        } = getState();

        if (path) {
            fs.writeFile(path, JSON.stringify(graph.save(), null, '    '), err => {
                if (err) {
                    return console.error(err);
                }

                dispatch({
                    type: FILE_SAVE,
                    path
                });
            });
        } else {
            dispatch(saveAs());
        }
    };
}

export function saveAs() {
    return (dispatch: Dispatcher, getState: StateGetter) => {
        remote.dialog.showSaveDialog({
            filters: [{
                name: 'Rasen',
                extensions: ['rasen']
            }]
        }, path => {
            const {
                graph
            } = getState();

            fs.writeFile(path, JSON.stringify(graph.save(), null, '    '), err => {
                if (err) {
                    return console.error(err);
                }

                dispatch({
                    type: FILE_SAVE_AS,
                    path
                });
            });
        });
    };
}

export function undo() {
    return {
        type: EDIT_UNDO
    };
}

export function redo() {
    return {
        type: EDIT_REDO
    };
}

export function copy() {
    return {
        type: EDIT_COPY
    };
}

export function cut() {
    return {
        type: EDIT_CUT
    };
}

export function paste() {
    return {
        type: EDIT_PASTE
    };
}

export function deleteSelection() {
    return {
        type: EDIT_DELETE
    };
}

export function selectAll() {
    return {
        type: EDIT_SELECT_ALL
    };
}
