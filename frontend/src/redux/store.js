import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import authReducer from './reducers/authReducer';
import userReducer from './reducers/userReducer';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer
});

// Create store with middleware
export const store = createStore(
  rootReducer,
  // Enable Redux DevTools extension
  window.__REDUX_DEVTOOLS_EXTENSION__ 
    ? window.__REDUX_DEVTOOLS_EXTENSION__() 
    : undefined,
  applyMiddleware(thunk)
);

// Optional: Add store subscription for persistence
store.subscribe(() => {
  const state = store.getState();
  
  // Persist authentication token
  if (state.auth.token) {
    localStorage.setItem('userToken', state.auth.token);
  }
});

export default store;