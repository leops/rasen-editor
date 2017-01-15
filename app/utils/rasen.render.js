import {
    ipcRenderer,
} from 'electron';

const serializeGraph = ({ editorState }) => JSON.stringify({
    nodes: editorState.nodes
        .map(({ title, data }) => ({
            ...data
                .map(prop => prop.get('value'))
                .toObject(),
            title
        }))
        .toObject(),
    edges: editorState.edges
        .map(({ from, to, input }) => ({ from, to, input }))
        .toArray()
});

let rpcId = 0;
const handlers = {};

ipcRenderer.on('build', (evt, id, result) => {
    if (handlers[id]) {
        handlers[id](result);
        delete handlers[id];
    }
});

export function build(graph) {
    return new Promise((resolve, reject) => {
        const id = rpcId++;
        handlers[id] = result => {
            if (result.error) {
                reject(result.error);
            } else {
                resolve(result.payload);
            }
        };

        ipcRenderer.send('build', id, serializeGraph(graph));
    });
}

export function exportGraph(graph, file) {
    ipcRenderer.send('export', serializeGraph(graph), file);
}
