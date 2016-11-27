// @flow
import {
    FILE_NEW,
    FILE_OPEN,
    FILE_SAVE,
    FILE_SAVE_AS,
} from '../actions/graph';

export default function path(state: ?string = null, action: Object) {
    switch (action.type) {
        case FILE_NEW:
            return null;

        case FILE_OPEN:
        case FILE_SAVE:
        case FILE_SAVE_AS:
            return action.path;

        default:
            return state;
    }
}
