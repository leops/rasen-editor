// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Viewport from '../components/Viewport';
import * as GraphActions from '../actions/graph';

function mapStateToProps(state) {
    return {
        graph: state.graph
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(GraphActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Viewport);
