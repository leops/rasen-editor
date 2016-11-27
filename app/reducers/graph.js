// @flow
import {
    GraphState
} from 'react-graph-editor';
import {
    UPDATE_GRAPH,
    ADD_NODE,

    FILE_NEW,
    FILE_OPEN,

    EDIT_UNDO,
    EDIT_REDO,
    EDIT_CUT,
    EDIT_COPY,
    EDIT_PASTE,
    EDIT_DELETE,
    EDIT_SELECT_ALL,
} from '../actions/graph';

export default function graph(state: GraphState = GraphState.createEmpty(), action: Object) {
    switch (action.type) {
        case UPDATE_GRAPH:
            return action.graph;

        case ADD_NODE:
            return state.addNode(action.node).closeMenu();

        case FILE_NEW:
            return GraphState.createEmpty();

        case FILE_OPEN:
            return GraphState.restore(action.data);

        case EDIT_UNDO:
            return state.undo();

        case EDIT_REDO:
            return state.redo();

        case EDIT_CUT:
            return state.cut();

        case EDIT_COPY:
            return state.copy();

        case EDIT_PASTE:
            return state.paste();

        case EDIT_DELETE:
            return state.deleteSelection();

        case EDIT_SELECT_ALL:
            return state.selectAll();

        default:
            return state;
    }
}
