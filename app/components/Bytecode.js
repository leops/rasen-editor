// @flow
import React, {
    Component
} from 'react';
import type {
    GraphState
} from 'react-graph-editor';

import {
    compile
} from '../utils/rasen';

import styles from './Bytecode.css';

type Props = {
    graph: GraphState
};

export default class Bytecode extends Component {
    shouldComponentUpdate(nextProps: Props) {
        return this.props.graph.editorState.nodes !== nextProps.graph.editorState.nodes ||
            this.props.graph.editorState.edges !== nextProps.graph.editorState.edges;
    }

    props: Props;

    render() {
        const {
            nodes, edges
        } = this.props.graph.editorState;

        const payload = {
            nodes: nodes
                .map(({ title, data }) => ({
                    ...data
                        .map(prop => {
                            try {
                                return JSON.parse(prop);
                            } catch (err) {
                                return prop;
                            }
                        })
                        .toObject(),
                    title
                }))
                .toJS(),
            edges: edges
                .sort((a, b) =>
                    a.input - b.input
                )
                .map(({ from, to }) => ({
                    from, to
                }))
                .toJS()
        };

        return (
            <pre className={styles.bytecode}>
                {compile(JSON.stringify(payload))}
            </pre>
        );
    }
}
