import { connect } from 'react-redux';
import React, { Component } from 'react';
import './App.css';

import { frame, effect, interceptors as reduxFrameInterceptors } from './redux-frame';

class App extends Component {
  state = {
    thing: ''
  }

  handleChange = event => {
    this.setState({
      thing: event.target.value
    })
  }

  handleSubmit = event => {
    event.preventDefault();
    this.props.onSubmit(this.state.thing)
    this.setState({ thing: '' });
  }

  render() {
    return (
      <div className="App">
        <form onSubmit={this.handleSubmit}>
          <label>
            Add some stuff:
            <input type="text" value={this.state.thing} onChange={this.handleChange} />
          </label>
          <button type="submit">save</button>
        </form>
        {this.props.stuff.map((thing, index) => <div key={index}>{thing}</div>)}
        <button onClick={this.props.onClickClear}>clear</button>
        <p>
          Refresh the page to see the stuff loaded from the localStorage cache
        </p>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    stuff: state.stuff
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onClickClear: () => dispatch({
      type: frame('CLEAR_STUFF'),
      interceptors: [reduxFrameInterceptors.debug, effect('clearLocalStorage'), reduxFrameInterceptors.dispatch]
    }),
    onSubmit: thing => dispatch({
      type: frame('ADD_STUFF'),
      thing,
      interceptors: [reduxFrameInterceptors.debug, effect('syncToLocalStorage', { key: 'stuff' }), reduxFrameInterceptors.dispatch]
    })
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
