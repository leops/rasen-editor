// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Bytecode from '../components/Bytecode';
import * as AsmActions from '../actions/assembly';

function mapStateToProps(state) {
    return {
        mode: state.assembly.mode,
        assembly: state.assembly.assembly,
        glsl: state.assembly.glsl,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AsmActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Bytecode);
