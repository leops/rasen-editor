// @flow
import { combineReducers } from 'redux';

import graph from './graph';
import path from './path';
import assembly from './assembly';
import viewport from './viewport';

const rootReducer = combineReducers({
    path, graph, assembly, viewport,
});

export default rootReducer;
