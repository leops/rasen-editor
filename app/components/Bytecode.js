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
        // console.profile('toAssembly');
        const result = toAssembly(this.props.graph);
        // console.profileEnd('toAssembly');

        if (result.error) {
            return (
                <div className={styles.bytecode}>
                    {result.error}
                </div>
            );
        }

        let padding = 6;
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
                                    {leftPad(`%${inst.result_id}`, padding - 4)}
                                </span>
                                {' = '}
                            </span>
                        ) : (
                            <span>
                                {new Array(inst.class === ';' ? 1 : padding).join(' ')}
                            </span>
                        )}
                        <span className={styles.opcode}>{inst.class}</span>
                        {' '}
                        {inst.operands.reduce((list, op, i, arr) => {
                            let elem;
                            switch (op.operand) {
                                case 'Id':
                                    elem = (
                                        <span key={i} className={styles.id}>
                                            %{op.value}
                                        </span>
                                    );
                                    break;

                                case 'Type':
                                    elem = (
                                        <span key={i} className={styles.type}>
                                            %{op.value}
                                        </span>
                                    );
                                    break;

                                case 'String':
                                    elem = (
                                        <span key={i} className={styles.string}>
                                            &quot;{op.value}&quot;
                                        </span>
                                    );
                                    break;

                                case 'Int':
                                case 'Float':
                                case 'Double':
                                    elem = (
                                        <span key={i} className={styles.number}>
                                            {op.value}
                                        </span>
                                    );
                                    break;

                                case 'ExtInst':
                                    elem = (
                                        <span key={i} className={styles.func}>
                                            {op.value}
                                        </span>
                                    );
                                    break;

                                default:
                                    elem = <span key={i}>{op.value}</span>;
                                    break;
                            }

                            list.push(elem);
                            if (i < arr.length - 1) {
                                list.push(' ');
                            }

                            return list;
                        }, [])}
                    </div>
                ))}
            </div>
        );
    }
}
