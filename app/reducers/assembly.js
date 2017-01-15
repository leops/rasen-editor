// @flow
import {
    Record,
} from 'immutable';

const Assembly = Record({
    mode: 'assembly',
    assembly: null,
    glsl: '',
});

export default function assembly(state: Assembly = new Assembly(), action: Object) {
    switch (action.type) {
        case 'SET_MODE':
            return state.set('mode', action.mode);

        case 'UPDATE_ASSEMBLY':
            return state.set(
                'assembly',
                action.asm
            ).set(
                'glsl',
                action.glsl
            );

        default:
            return state;
    }
}
