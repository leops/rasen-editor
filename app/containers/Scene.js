// @flow
import { connect } from 'react-redux';
import Scene from '../components/Scene';

function mapStateToProps(state) {
    return {
        width: state.viewport.vSplit,
        height: state.viewport.hSplit,
        glsl: state.assembly.glsl,
    };
}

export default connect(mapStateToProps)(Scene);
