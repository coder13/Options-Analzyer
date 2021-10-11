import { createContext, useEffect, useReducer } from 'react';

const reducer = (state, action) => {
  switch(action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.user,
      }
    case 'SET_ACCESS_TOKEN':
      return {
        ...state,
        user: {
          ...state.user,
          access_token: action.access_token,
        },
      }
    default:
      return state;
  }
}

const initialState = {
  user: {
    access_token: null,
  },
};

export const Store = createContext(initialState);

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    console.log('reading from localstorage');
    dispatch({
      type: 'SET_ACCESS_TOKEN',
      access_token: window.localStorage.getItem('options_chains-access_token'),
    })
  }, []);

  useEffect(() => {
    console.log('access_token changed')
  }, [state.user.access_token]);

  return <Store.Provider value={{ state, dispatch }}>{children}</Store.Provider>;
};