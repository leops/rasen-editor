/* eslint-disable import/no-extraneous-dependencies */
import {
    createStore,
    applyMiddleware,
    compose
} from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import compiler from '../utils/compiler';
import rootReducer from '../reducers';

import * as graphActions from '../actions/graph';

const actionCreators = {
    ...graphActions
};

const logger = createLogger({
    level: 'info',
    collapsed: true,
    predicate(getState, action) {
        return action.type !== graphActions.UPDATE_GRAPH &&
            action.type !== 'UPDATE_ASSEMBLY' &&
            action.type.indexOf('SPLIT') === -1;
    },
});

/* eslint-disable no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        actionCreators,
    }) :
    compose;
/* eslint-enable no-underscore-dangle */

const enhancer = composeEnhancers(
    applyMiddleware(thunk, compiler, logger)
);

export default function configureStore(initialState) {
    const store = createStore(rootReducer, initialState, enhancer);

    if (module.hot) {
        module.hot.accept('../reducers', () =>
            store.replaceReducer(require('../reducers')) // eslint-disable-line global-require
        );
    }

    return store;
}
