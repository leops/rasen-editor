// @flow
import React from 'react';

// eslint-disable-next-line no-duplicate-imports
import type {
    Element
} from 'react';
import type {
    List
} from 'immutable';
import type {
    Node as NodeData
} from 'react-graph-editor';

import styles from './Node.css';

type NodeProps = {
    node: NodeData,
    selected: boolean,
    inputs: List<Element<any>>,
    outputs: List<Element<any>>
};

export default (props: NodeProps) => (
    <div className={styles.node} style={{
        borderColor: props.selected && '#FF6100',
        boxShadow: props.selected && '0 1px 6px rgba(0, 0, 0, 0.2)',
    }}>
        <div className={styles.head}>
            <h3>{props.node.title}</h3>
        </div>
        <div className={styles.body}>
            <div className={styles.inputs}>
                {props.inputs}
            </div>
            <div className={styles.outputs}>
                {props.outputs}
            </div>
        </div>
    </div>
);
