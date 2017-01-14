// @flow
import React from 'react';
import {
    List
} from 'immutable';
import {
    Pin,
    GraphState,
} from 'react-graph-editor';
import SplitPane from 'react-split-pane';

import styles from './Properties.css';

type Props = {
    graph: GraphState,
    updateGraph: (nextState: GraphState) => void
};

const INTEGERS = [{
    name: 'bool',
    prefix: 'b'
}, {
    name: 'int',
    prefix: 'i'
}, {
    name: 'uint',
    prefix: 'u'
}];
const FLOATS = [{
    name: 'float',
    prefix: ''
}, {
    name: 'double',
    prefix: 'd'
}];

const TYPES = INTEGERS.concat(FLOATS).map(({ name }) => ({ name, type: name }));
const VEC_TYPES = [];

for (let i = 2; i <= 4; i += 1) {
    INTEGERS.concat(FLOATS)
        .forEach(({ prefix, name }) => {
            const ty = {
                name: `${prefix}vec${i}`,
                type: name,
            };

            TYPES.push(ty);
            VEC_TYPES.push(ty);
        });

    FLOATS.forEach(({ prefix, name }) => TYPES.push({
        name: `${prefix}mat${i}`,
        type: name,
    }));
}

const makeOption = ({ name }: { name: string }) => <option key={name} value={name}>{name}</option>;
const OPTIONS = TYPES.map(makeOption);
const VEC_OPTIONS = VEC_TYPES.map(makeOption);

function convert(type, v): any {
    if (type === '_type' || type === '_vectype') {
        return v;
    }

    if (type.indexOf('vec') !== -1) {
        const arr = v instanceof List ? v.toArray() : v;
        const val = arr instanceof Array ? arr : [arr];

        const i = Number(type[type.length - 1]);
        while (val.length < i) {
            val.push(0);
        }

        return val.map(convert.bind(undefined, type[0]));
    }

    if (v instanceof List) {
        // eslint-disable-next-line no-param-reassign
        v = v.first();
    } else if (v instanceof Array) {
        // eslint-disable-next-line no-param-reassign
        v = v[0];
    }

    if (type[0] === 'b') {
        return Boolean(v);
    }

    return Number(v);
}

function getTypedEditor(type, key, value: any, onChange) {
    switch (type) {
        case '_type':
            return (
                <select key={key} value={value} onChange={onChange}>
                    {OPTIONS}
                </select>
            );

        case '_vectype':
            return (
                <select key={key} value={value} onChange={onChange}>
                    {VEC_OPTIONS}
                </select>
            );

        case 'bool':
            return (
                <input key={key} type="checkbox" checked={Boolean(value)} onChange={evt => {
                    onChange({
                        target: {
                            value: evt.target.checked,
                        },
                    });
                }} />
            );

        case 'int':
            return (
                <input key={key} type="number" step={1} value={value} onChange={onChange} />
            );

        case 'uint':
            return (
                <input key={key} type="number" min={0} step={1} value={value} onChange={onChange} />
            );

        case 'float':
        case 'double':
            return (
                <input key={key} type="number" value={value} onChange={onChange} />
            );

        default: {
            const val = convert(type, value);
            if (val instanceof Array) {
                return (
                    <div key={key} className={styles.vector}>
                        {val.map((v, j) => {
                            const t = TYPES.find(({ name }) => name === type);
                            return t ? getTypedEditor(
                                t.type, j, v,
                                evt => {
                                    val[j] = evt.target.value;
                                    onChange({
                                        target: {
                                            value: val,
                                        },
                                    });
                                }
                            ) : null;
                        })}
                    </div>
                );
            }

            return (
                <input key={key} type="text" value={value} onChange={onChange} />
            );
        }
    }
}

const PINS = new List([
    'x', 'y', 'z', 'w'
]).map(name => new Pin({ name }));

export default ({ graph, updateGraph }: Props) => (
    <SplitPane className={styles.properties} split="vertical" defaultSize={250}>
        <div className={styles.column}>
            {
                graph.selectedNodes
                    .take(1)
                    .flatMap(node =>
                        node.data
                            .map((value, key) => (
                                <label key={key} htmlFor={key}>{key}</label>
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
                            .map((value, key) => {
                                const type = value.get('type');
                                return getTypedEditor(
                                    type, key, value.get('value'),
                                    evt => {
                                        const converted = convert(type, evt.target.value);
                                        const nextGraph = graph.setIn(
                                            ['editorState', 'nodes', node.id, 'data', key, 'value'],
                                            converted,
                                        );

                                        if (type === '_type' && node.data.has('value')) {
                                            updateGraph(
                                                nextGraph.setIn(
                                                    ['editorState', 'nodes', node.id, 'data', 'value', 'type'],
                                                    converted,
                                                ).updateIn(
                                                    ['editorState', 'nodes', node.id, 'data', 'value', 'value'],
                                                    val => convert(converted, val),
                                                )
                                            );
                                        } else if (type === '_vectype' && node.title === 'Construct') {
                                            const len = Number(converted[converted.length - 1]);
                                            updateGraph(
                                                nextGraph.setIn(
                                                    ['editorState', 'nodes', node.id, 'inputs'],
                                                    PINS.take(len),
                                                )
                                            );
                                        } else {
                                            updateGraph(nextGraph);
                                        }
                                    }
                                );
                            })
                            .values()
                    )
                    .toArray()
            }
        </div>
    </SplitPane>
);
