// @flow
import React from 'react';
import SplitPane from 'react-split-pane';

import Viewport from '../containers/Viewport';
import Properties from '../containers/Properties';
import Bytecode from '../containers/Bytecode';

export default () => (
    <SplitPane split="vertical" defaultSize={500} primary="second">
        <SplitPane split="horizontal" defaultSize={300} primary="second">
            <Viewport />
            <Properties />
        </SplitPane>
        <Bytecode />
    </SplitPane>
);
