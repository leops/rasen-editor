// @flow
import {
    createStore, applyMiddleware
} from 'redux';
import thunk from 'redux-thunk';
import compiler from '../utils/compiler';
import rootReducer from '../reducers';

const enhancer = applyMiddleware(thunk, compiler);

export default function configureStore(initialState: Object) {
    return createStore(rootReducer, initialState, enhancer);
}
