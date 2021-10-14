import { createContext, useReducer } from 'react';

const reducer = (state, action) => {
  switch(action.type) {
    default:
      return state;
  }
}

const initialState = {};

export const Store = createContext(initialState);

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <Store.Provider value={{ state, dispatch }}>{children}</Store.Provider>;
};