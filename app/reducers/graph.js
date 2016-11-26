// @flow
import {
    GraphState
} from 'react-graph-editor';
import {
    UPDATE_GRAPH,
    ADD_NODE,

    FILE_NEW,
    FILE_OPEN,

    UNDO_EDIT,
    REDO_EDIT
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

        case UNDO_EDIT:
            return state.undo();

        case REDO_EDIT:
            return state.redo();

        default:
            return state;
    }
}
