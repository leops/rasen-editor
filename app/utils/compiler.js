import {
    updateAssembly,
} from '../actions/assembly';

export default ({ dispatch, getState }) => next => action => {
    const currentState = getState();
    next(action);
    const nextState = getState();

    if (
        currentState === undefined ||
        currentState.graph.editorState.nodes !== nextState.graph.editorState.nodes ||
        currentState.graph.editorState.edges !== nextState.graph.editorState.edges
    ) {
        dispatch(updateAssembly(nextState.graph));
    }
};
