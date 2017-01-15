// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import App from '../components/App';
import * as ViewportActions from '../actions/viewport';

function mapDispatchToProps(dispatch) {
    return bindActionCreators(ViewportActions, dispatch);
}

export default connect(() => ({}), mapDispatchToProps)(App);
