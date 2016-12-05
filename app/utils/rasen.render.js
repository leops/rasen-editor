import {
    remote,
    ipcRenderer,
} from 'electron';
import path from 'path';

const ffi = remote.require('ffi');

const rasen = ffi.Library(path.join(__dirname, '../native/target/debug/rasen'), {
    to_assembly: ['string', ['string']],
});

const serializeGraph = ({ editorState }) => JSON.stringify({
    nodes: editorState.nodes
        .map(({ title, data }) => ({
            ...data
                .map(prop => {
                    try {
                        return JSON.parse(prop);
                    } catch (err) {
                        return prop;
                    }
                })
                .toObject(),
            title
        }))
        .toJS(),
    edges: editorState.edges
        .toMap()
        .mapEntries(([key, { input, from, to }]) => ([
            `${key}:${input}`,
            { from, to }
        ]))
        .toJS()
});

export function toAssembly(graph) {
    const data = serializeGraph(graph);

    // console.time('toAssembly');
    const asm = rasen.to_assembly(data);
    // console.timeEnd('toAssembly');

    return JSON.parse(asm);
}

export function toBytecode(graph, file) {
    ipcRenderer.send('to_bytecode', serializeGraph(graph), file);
}
