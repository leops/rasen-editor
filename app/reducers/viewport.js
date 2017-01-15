// @flow
import {
    Record,
} from 'immutable';

const Viewport = Record({
    hSplit: 500,
    vSplit: 500,
});

export default function assembly(state: Viewport = new Viewport(), action: Object) {
    switch (action.type) {
        case 'SET_V_SPLIT':
            return state.set('vSplit', action.size);

        case 'SET_H_SPLIT':
            return state.set('hSplit', action.size);

        default:
            return state;
    }
}
