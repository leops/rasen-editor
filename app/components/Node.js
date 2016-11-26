// @flow
import React from 'react';

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
        borderColor: props.selected ? undefined : 'transparent'
    }}>
        <h1>{props.node.title}</h1>
        <div>
            <div className={styles.inputs}>
                {props.inputs}
            </div>
            <div className={styles.outputs}>
                {props.outputs}
            </div>
        </div>
    </div>
);
