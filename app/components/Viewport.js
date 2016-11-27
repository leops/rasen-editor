// @flow
import React from 'react';

import {
    Graph
} from 'react-graph-editor';

// eslint-disable-next-line no-duplicate-imports
import type {
    GraphState
} from 'react-graph-editor';

import NodeClass from './Node';
import PinClass from './Pin';
import MenuClass from '../containers/Menu';

import styles from './Viewport.css';

type Props = {
    graph: GraphState,
    updateGraph: (nextState: GraphState) => void
};

export default (props: Props) => (
    <Graph
        className={styles.graph}

        value={props.graph}
        onChange={props.updateGraph}

        nodeClass={NodeClass}
        pinClass={PinClass}
        menuClass={MenuClass} />
);
