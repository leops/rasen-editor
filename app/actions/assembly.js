// @flow
import type {
    GraphState
} from 'react-graph-editor';
import {
    build,
} from '../utils/rasen.render';

type Dispatcher = (action: Object) => void;

export function setMode(evt: any) {
    return {
        type: 'SET_MODE',
        mode: evt.target.value.toLowerCase(),
    };
}

export function updateAssembly(graph: GraphState) {
    return (dispatch: Dispatcher) => {
        build(graph)
            .then(result =>
                dispatch({
                    type: 'UPDATE_ASSEMBLY',
                    asm: result.asm,
                    glsl: result.glsl,
                })
            )
            .catch(error =>
                dispatch({
                    type: 'UPDATE_ASSEMBLY',
                    asm: { error },
                    glsl: '',
                })
            );
    };
}
