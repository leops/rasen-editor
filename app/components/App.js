// @flow
import React from 'react';
import SplitPane from 'react-split-pane';

import Viewport from '../containers/Viewport';
import Properties from '../containers/Properties';
import Bytecode from '../containers/Bytecode';
import Scene from '../containers/Scene';

type Props = {
    setVSplit: (size: number) => void,
    setHSplit: (size: number) => void,
};

export default (props: Props) => (
    <SplitPane split="vertical" defaultSize={500} primary="second" onChange={props.setVSplit}>
        <SplitPane split="horizontal" defaultSize={300} primary="second">
            <Viewport />
            <Properties />
        </SplitPane>
        <SplitPane split="horizontal" defaultSize={500} primary="second" onChange={props.setHSplit}>
            <Bytecode />
            <Scene />
        </SplitPane>
    </SplitPane>
);
