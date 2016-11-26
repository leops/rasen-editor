// @flow
import { combineReducers } from 'redux';
import graph from './graph';
import path from './path';

const rootReducer = combineReducers({
    graph, path
});

export default rootReducer;
