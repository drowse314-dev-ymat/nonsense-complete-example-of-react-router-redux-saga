'use strict';

require('babel-polyfill');

import { createStore, combineReducers, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { call, put, takeLatest, fork } from 'redux-saga/effects';

import * as React from 'react';
import { connect, Provider } from 'react-redux';
import * as ReactDOM from 'react-dom';

import { Router, Route, Link, createMemoryHistory } from 'react-router'
import { syncHistoryWithStore, routerReducer } from 'react-router-redux'


// super great services
// =================
const greatGoodsList = ['milk', 'flour', 'nuts', 'apples', 'pen'];
const greatGoodsListHost = {
    getGreatList() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.65) {
                    reject(new Error("randomly failed!!!"));
                } else {
                    resolve(greatGoodsList);
                }
            }, 2000);
        });
    }
};
// workers
const getGreatGoodsList = function* (action) {
    try {
        const goods = yield call(greatGoodsListHost.getGreatList)
        yield put({ type: 'LIST_GOODS_SUCCEEDED', goods: goods })
    } catch (e) {
        yield put({ type: 'LIST_GOODS_FAILED', reason: e.message })
    }
};
const getGreatGoodsListWorker = function* () {
    yield takeLatest('LIST_GOODS', getGreatGoodsList);
};
// =================


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
    isLoading: false,
    isLoadingFailed: false,
    goods: []
};
const goodsListState = (state = initialGoodsListState, action) => {
    switch (action.type) {
        case 'ROTATE':
            return Object.assign({}, state, {
                goods: (
                    state.goods.length === 0 ?
                        [] :
                        state.goods.slice(1)
                            .concat(state.goods.slice(0, 1))
                )
            });

        case 'LIST_GOODS':
            return Object.assign({}, state, {
                isLoading: true
            });
        case 'LIST_GOODS_SUCCEEDED':
            return {
                isLoading: false, isLoadingFailed: false,
                goods: action.goods
            };
        case 'LIST_GOODS_FAILED':
            return Object.assign({}, state, {
                isLoading: false, isLoadingFailed: true
            });
    }
    return state;
};
// =================


const reducer = combineReducers({
    textState,
    goodsListState,

    routing: routerReducer
});
const logger = createLogger();
const sagaMiddleware = createSagaMiddleware();

const store = createStore(
    reducer,
    applyMiddleware(logger, sagaMiddleware)
);


// stateless view
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

class RotatableGoodsListContainer extends React.Component {
    render() {
        let { listStates, doRotate, doRefresh } = this.props;

        let listApprearance = listStates.isLoading ?
            <p key="loading">Loading...</p> :
            (
                listStates.isLoadingFailed ? [<p key="load-failed">Load failed.</p>] : []
            ).concat(
                <List items={listStates.items} key="items" />
            );

        return (
            <div>
                <button onClick={doRotate}>Rotate</button>
                <button onClick={doRefresh} disabled={listStates.isLoading}>Refresh</button>
                {  listApprearance }
            </div>
        );
    }
    componentWillMount() {
        this.props.doRefresh();
    }
}
const RotatableGoodsList = connect(
    state => ({
        listStates: {
            items: state.goodsListState.goods,
            isLoading: state.goodsListState.isLoading,
            isLoadingFailed: state.goodsListState.isLoadingFailed
        }
    }),
    dispatch => ({
        doRotate: () => dispatch({ type: 'ROTATE' }),
        doRefresh: () => dispatch({ type: 'LIST_GOODS' })
    })
)(RotatableGoodsListContainer);

const NoContent = connect()(() => <div>Nothing to show</div>);

const App = connect()(({ children }) =>
    <div>
        <h3>Router Domain</h3>
        <div><Link to="/goods">To Goods App</Link></div>
        <div><Link to="/text">To Text App</Link></div>
        {children}
    </div>
);


// ## boot & render app

// with router integration
let history = syncHistoryWithStore(createMemoryHistory(), store)

// async action worker
sagaMiddleware.run(function* () { yield [ fork(getGreatGoodsListWorker) ] });

// render
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
            <h3>Out of Router Domain</h3>
            <div>
                <DynamicText />
                <RotatableGoodsList />
            </div>
        </div>
    </Provider>,
    document.getElementById('root')
);