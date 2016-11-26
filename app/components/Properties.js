// @flow
import React from 'react';
import type {
    GraphState
} from 'react-graph-editor';
import SplitPane from 'react-split-pane';

import styles from './Properties.css';

type Props = {
    graph: GraphState,
    updateGraph: (nextState: GraphState) => void
};

export default ({ graph, updateGraph }: Props) => (
    <SplitPane className={styles.properties} split="vertical" defaultSize={250}>
        <div className={styles.column}>
            {
                graph.selectedNodes
                    .take(1)
                    .flatMap(node =>
                        node.data
                            .map((value, key) => (
                                <label key={key} htmlFor={key}>{key}:</label>
                            ))
                            .values()
                    )
                    .toArray()
            }
        </div>
        <div className={styles.column}>
            {
                graph.selectedNodes
                    .take(1)
                    .flatMap(node =>
                        node.data
                            .map((value, key) => (
                                <input
                                    key={key}
                                    type="text"
                                    value={value}
                                    onChange={evt => {
                                        updateGraph(
                                            graph.setIn(
                                                ['editorState', 'nodes', node.id, 'data', key],
                                                evt.target.value
                                            )
                                        );
                                    }} />
                            ))
                            .values()
                    )
                    .toArray()
            }
        </div>
    </SplitPane>
);
