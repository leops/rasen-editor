// @flow
import React from 'react';
import leftPad from 'left-pad';

import SyntaxHighlighter from 'react-syntax-highlighter';

import syntax from '../utils/syntax';
import styles from './Bytecode.css';

const Assembly = ({ assembly }: { assembly: Object }) => {
    let padding = 5;
    let bound = assembly.bound;
    while (bound > 10) {
        padding += 1;
        bound /= 10;
    }

    return (
        <div className={styles.bytecode}>
            {assembly.instructions.map((inst, key) => (
                <span key={key} className={inst.class === ';' && styles.comment}>
                    {inst.result_id ? (
                        <span>
                            <span className={styles.id}>
                                {leftPad(`%${inst.result_id}`, padding - 3)}
                            </span>
                            {' = '}
                        </span>
                    ) : (
                        <span>
                            {' '.repeat(inst.class === ';' ? 0 : padding)}
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
                    {'\n'}
                </span>
            ))}
        </div>
    );
};

type Props = {
    setMode: (evt: any) => void,
    mode: string,
    assembly: ?Object,
    glsl: string,
};

export default (props: Props) => {
    let content;
    if (!props.assembly) {
        content = (
            <div className={styles.bytecode}>
                {'No compilation result yet'}
            </div>
        );
    } else if (props.assembly.error) {
        content = (
            <div className={styles.bytecode}>
                {props.assembly.error}
            </div>
        );
    } else {
        switch (props.mode) {
            case 'assembly':
                content = <Assembly assembly={props.assembly} />;
                break;

            case 'glsl':
                content = (
                    <SyntaxHighlighter language="glsl" style={syntax} className={styles.bytecode}>
                        {props.glsl}
                    </SyntaxHighlighter>
                );
                break;

            default:
                content = (
                    <div className={styles.bytecode}>
                        {'Unsupported format'}
                    </div>
                );
                break;
        }
    }

    return (
        <div className={styles.container}>
            <select onChange={props.setMode}>
                <option>Assembly</option>
                <option>GLSL</option>
            </select>
            {content}
        </div>
    );
};
