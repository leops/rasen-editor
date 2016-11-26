// @flow
import { connect } from 'react-redux';
import Bytecode from '../components/Bytecode';

function mapStateToProps(state) {
    return {
        graph: state.graph
    };
}

export default connect(mapStateToProps)(Bytecode);
