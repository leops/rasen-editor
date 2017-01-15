// @flow
import React from 'react';
import {
    render
} from 'react-dom';
import {
    Provider
} from 'react-redux';
import {
    ipcRenderer
} from 'electron';

import configureStore from './store/configureStore';
import * as actionCreators from './actions/graph';
import App from './containers/App';
import './app.global.css';

const store = configureStore();

ipcRenderer.on('action', (evt, message) => {
    store.dispatch(actionCreators[message]());
});

render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);
