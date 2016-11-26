// @flow
import React from 'react';

import type {
    Pin as PinData
} from 'react-graph-editor';

import styles from './Node.css';

type PinProps = {
    pin: PinData
};

export default (props: PinProps) => (
    <p className={styles.pin} data-connected={props.pin.connected}>
        {props.pin.name}
    </p>
);
