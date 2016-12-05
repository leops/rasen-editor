// @flow
import React, {
    Component
} from 'react';
import type {
    GraphState
} from 'react-graph-editor';
import leftPad from 'left-pad';

import {
    toAssembly,
} from '../utils/rasen.render';

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
        const result = toAssembly(this.props.graph);
        if (result.error) {
            return (
                <div className={styles.bytecode}>
                    {result.error}
                </div>
            );
        }

        let padding = 5;
        while (result.bound > 10) {
            padding += 1;
            result.bound /= 10;
        }

        return (
            <div className={styles.bytecode}>
                {result.instructions.map((inst, key) => (
                    <div key={key} className={inst.class === ';' && styles.comment}>
                        {inst.result_id ? (
                            <span>
                                <span className={styles.id}>
                                    {leftPad(`%${inst.result_id}`, padding - 3)}
                                </span>
                                =
                            </span>
                        ) : (
                            <span>
                                {new Array(inst.class === ';' ? 0 : padding).join(' ')}
                            </span>
                        )}
                        <span className={styles.opcode}>{inst.class}</span>
                        {inst.operands.map((op, i) => {
                            switch (op.operand) {
                                case 'Id':
                                    return (
                                        <span key={i} className={styles.id}>
                                            %{op.value}
                                        </span>
                                    );
                                case 'Type':
                                    return (
                                        <span key={i} className={styles.type}>
                                            %{op.value}
                                        </span>
                                    );
                                case 'String':
                                    return (
                                        <span key={i} className={styles.string}>
                                            &quot;{op.value}&quot;
                                        </span>
                                    );
                                case 'Int':
                                case 'Float':
                                    return (
                                        <span key={i} className={styles.number}>
                                            {op.value}
                                        </span>
                                    );
                                case 'ExtInst':
                                    return (
                                        <span key={i} className={styles.function}>
                                            {op.value}
                                        </span>
                                    );
                                default:
                                    return <span key={i}>{op.value}</span>;
                            }
                        })}
                    </div>
                ))}
            </div>
        );
    }
}
