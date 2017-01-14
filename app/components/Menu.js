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

function unaryNode(title: string): Object {
    return {
        title,
        inputs: new List([
            new Pin({
                name: 'value',
            }),
        ]),
        outputs: new List([
            new Pin({
                name: 'result',
            }),
        ]),
    };
}

function binaryNode(title: string): Object {
    return {
        title,
        inputs: new List([
            new Pin({
                name: 'a',
            }),
            new Pin({
                name: 'b',
            }),
        ]),
        outputs: new List([
            new Pin({
                name: 'result',
            }),
        ]),
    };
}

const OPTIONS = [{
    title: 'Variables',
    types: [{
        title: 'Input',
        data: new Map({
            type: new Map({
                type: '_type',
                value: 'float',
            }),
            location: new Map({
                type: 'uint',
                value: 0,
            }),
        }),
        outputs: new List([
            new Pin({
                name: 'value',
            }),
        ]),
    }, {
        title: 'Output',
        data: new Map({
            type: new Map({
                type: '_type',
                value: 'float',
            }),
            location: new Map({
                type: 'uint',
                value: 0,
            }),
        }),
        inputs: new List([
            new Pin({
                name: 'value',
            }),
        ]),
    }, {
        title: 'Constant',
        data: new Map({
            type: new Map({
                type: '_type',
                value: 'float',
            }),
            value: new Map({
                type: 'float',
                value: 1.0,
            }),
        }),
        outputs: new List([
            new Pin({
                name: 'value',
            }),
        ]),
    }, {
        title: 'Construct',
        data: new Map({
            type: new Map({
                type: '_vectype',
                value: 'vec3',
            }),
        }),
        inputs: new List([
            new Pin({
                name: 'x',
            }),
            new Pin({
                name: 'y',
            }),
            new Pin({
                name: 'z',
            }),
        ]),
        outputs: new List([
            new Pin({
                name: 'value',
            }),
        ]),
    }, {
        title: 'Extract',
        data: new Map({
            index: new Map({
                type: 'uint',
                value: 0,
            }),
        }),
        inputs: new List([
            new Pin({
                name: 'value',
            }),
        ]),
        outputs: new List([
            new Pin({
                name: 'field',
            }),
        ]),
    }],
}, {
    title: 'Math',
    types: [
        binaryNode('Add'),
        binaryNode('Substract'),
        binaryNode('Multiply'),
        binaryNode('Divide'),
        binaryNode('Modulus'),
        binaryNode('Dot'),
    ],
}, {
    title: 'GLSL',
    types: [
        unaryNode('Normalize'),
        {
            title: 'Clamp',
            inputs: new List([
                new Pin({
                    name: 'value',
                }),
                new Pin({
                    name: 'min',
                }),
                new Pin({
                    name: 'max',
                }),
            ]),
            outputs: new List([
                new Pin({
                    name: 'result',
                }),
            ]),
        },
        {
            title: 'Mix',
            inputs: new List([
                new Pin({
                    name: 'a',
                }),
                new Pin({
                    name: 'b',
                }),
                new Pin({
                    name: 'alpha',
                }),
            ]),
            outputs: new List([
                new Pin({
                    name: 'result',
                }),
            ]),
        },
        binaryNode('Cross'),
        unaryNode('Floor'),
        unaryNode('Ceil'),
        unaryNode('Round'),
        unaryNode('Sin'),
        unaryNode('Cos'),
        unaryNode('Tan'),
        {
            title: 'Pow',
            inputs: new List([
                new Pin({
                    name: 'base',
                }),
                new Pin({
                    name: 'exp',
                }),
            ]),
            outputs: new List([
                new Pin({
                    name: 'result',
                }),
            ]),
        },
        binaryNode('Min'),
        binaryNode('Max'),
        unaryNode('Length'),
        binaryNode('Distance'),
        binaryNode('Reflect'),
        {
            title: 'Refract',
            inputs: new List([
                new Pin({
                    name: 'vector',
                }),
                new Pin({
                    name: 'normal',
                }),
                new Pin({
                    name: 'indice',
                }),
            ]),
            outputs: new List([
                new Pin({
                    name: 'result',
                }),
            ]),
        },
    ],
}];

export default ({ menu, addNode }: Props) => (
    <div className={styles.menu} style={{
        transform: `translate(${menu.x}px, ${menu.y}px)`,
        maxHeight: menu.maxHeight,
        maxWidth: menu.maxWidth,
    }}>
        {OPTIONS.map(({ title, types }) => (
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
