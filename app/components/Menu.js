// @flow
import React from 'react';
import {
    List, Map
} from 'immutable';

import {
    Pin
} from 'react-graph-editor';

// eslint-disable-next-line no-duplicate-imports
import type {
    MenuState
} from 'react-graph-editor';

import styles from './Menu.css';

type Props = {
    menu: MenuState,
    addNode: (node: Object) => void
};

function binaryNode(title: string): Object {
    return {
        title,
        inputs: new List([
            new Pin({
                name: 'a'
            }),
            new Pin({
                name: 'b'
            })
        ]),
        outputs: new List([
            new Pin({
                name: 'result'
            })
        ])
    };
}

export default ({ menu, addNode }: Props) => (
    <div className={styles.menu} style={{
        transform: `translate(${menu.x}px, ${menu.y}px)`
    }}>
        {[{
            title: 'Variables',
            types: [{
                title: 'Input',
                data: new Map({
                    type: 'float',
                    location: '0'
                }),
                outputs: new List([
                    new Pin({
                        name: 'value'
                    })
                ])
            }, {
                title: 'Output',
                data: new Map({
                    type: 'float',
                    location: '0'
                }),
                inputs: new List([
                    new Pin({
                        name: 'value'
                    })
                ]),
            }, {
                title: 'Constant',
                data: new Map({
                    type: 'float',
                    value: '1.0'
                }),
                outputs: new List([
                    new Pin({
                        name: 'value'
                    })
                ])
            }]
        }, {
            title: 'Math',
            types: [
                binaryNode('Add'),
                binaryNode('Substract'),
                binaryNode('Multiply'),
                binaryNode('Divide'),
                binaryNode('Modulus'),
                binaryNode('Dot')
            ]
        }, {
            title: 'GLSL',
            types: [
                {
                    title: 'Normalize',
                    inputs: new List([
                        new Pin({
                            name: 'value'
                        })
                    ]),
                    outputs: new List([
                        new Pin({
                            name: 'result'
                        })
                    ])
                },
                {
                    title: 'Clamp',
                    inputs: new List()
                        .push(new Pin({
                            name: 'value'
                        }))
                        .push(new Pin({
                            name: 'min'
                        }))
                        .push(new Pin({
                            name: 'max'
                        })),
                    outputs: new List()
                        .push(new Pin({
                            name: 'result'
                        }))
                },
                binaryNode('Cross')
            ]
        }].map(({ title, types }) => (
            <details key={title}>
                <summary>{title}</summary>
                <div className={styles.submenu}>
                    {types.map(template => (
                        <button key={template.title} onClick={evt => {
                            evt.preventDefault();
                            evt.stopPropagation();

                            addNode(template);
                        }}>{template.title}</button>
                    ))}
                </div>
            </details>
        ))}
    </div>
);
