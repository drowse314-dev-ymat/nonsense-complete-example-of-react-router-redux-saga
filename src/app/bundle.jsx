'use strict';

import { createStore, combineReducers, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';

import * as React from 'react';
import { connect, Provider } from 'react-redux';
import * as ReactDOM from 'react-dom';

import { Router, Route, Link, createMemoryHistory, browserHistory } from 'react-router'
import { syncHistoryWithStore, routerReducer } from 'react-router-redux'


// state, store
// =================
const initialTextState = {
    text: "hoge",
    isVisible: true
};
const textState = (state = initialTextState, action) => {
    switch (action.type) {
        case 'SWITCH':
            return Object.assign({}, state,
                {
                    isVisible: !state.isVisible
                })
    }
    return state;
};
// =================
const initialGoodsListState = {
    goods: ['milk', 'flour', 'nuts', 'apples', 'pen']
};
const goodsListState = (state = initialGoodsListState, action) => {
    switch (action.type) {
        case 'ROTATE':
            return {
                goods: (
                    state.goods.slice(1)
                        .concat(state.goods.slice(0, 1))
                )
            }
    }
    return state;
};
// =================


const reducer = combineReducers({
    textState,
    goodsListState,

    routing: routerReducer
});
const store = createStore(reducer, applyMiddleware(createLogger()));


// view
const Text = ({ text, isVisible, doSwitch }) => (
    <div>
        <button onClick={doSwitch}>Switch</button>
        <div>{isVisible ? text : ""}</div>
    </div>
);
const List = ({ items }) => (
    <ul>{
        items.map((item, i) => <li key={i}>{item}</li>)
    }</ul>
);

// react <-> redux connection
const DynamicText = connect(
    state => ({
        text: state.textState.text,
        isVisible: state.textState.isVisible
    }),
    dispatch => ({
        doSwitch: () => dispatch({ type: 'SWITCH' })
    })
)(Text);

const RotatableGoodsList = connect(
    state => ({
        items: state.goodsListState.goods
    }),
    dispatch => ({
        doRotate: () => dispatch({ type: 'ROTATE' })
    })
)(({ items, doRotate }) => (
    <div>
        <button onClick={doRotate}>Rotate</button>
        <List items={items}/>
    </div>
));

const NoContent = connect()(() => <div>Nothing to show</div>);

const App = connect()(({ children }) =>
    <div>
        <h3>Router Domain</h3>
        <div><Link to="/goods">To Goods App</Link></div>
        <div><Link to="/text">To Text App</Link></div>
        {children}
    </div>
);


// with router integration
let history = syncHistoryWithStore(createMemoryHistory(), store)

// boot app
ReactDOM.render(
    <Provider store={store}>
        <div>
            <Router history={history}>
                <Route path="/" component={App}>
                    <Route path="text" component={DynamicText} />
                    <Route path="goods" component={RotatableGoodsList} />
                    <Route path="*" component={NoContent} />
                </Route>
            </Router>
            <h1>Out of Router Domain</h1>
            <div>
                <DynamicText />
                <RotatableGoodsList />
            </div>
        </div>
    </Provider>,
    document.getElementById('root')
);