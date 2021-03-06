import { useCallback } from 'react';
import { fetchToken, updateToken, login } from '../api';
import { createContext, useEffect, useReducer } from 'react';

const reducer = (state, action) => {
  switch(action.type) {
    case 'SET_TOKENS':
      return {
        ...state,
        accessToken: action.accessToken,
        refreshToken: action.refreshToken,
        expiresAt: action.expiresAt,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.user,
      };
    default:
      return state;
  }
};

const initialState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
};

export const AuthContext = createContext(initialState);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadFromLocalStorage = useCallback(
    () => ({
      accessToken: window.localStorage.getItem('options_chains-access_token'),
      refreshToken: window.localStorage.getItem('options_chains-refresh_token'),
      expiresAt: +window.localStorage.getItem('options_chains-expires_at'),
    }),
    []
  );

  const updateWithNewTokens = (tokens) => {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    window.localStorage.setItem('options_chains-access_token', tokens.access_token);
    window.localStorage.setItem('options_chains-refresh_token', tokens.refresh_token);
    window.localStorage.setItem('options_chains-scope', tokens.scope);
    window.localStorage.setItem('options_chains-expires_at', expiresAt.valueOf());

    dispatch({
      type: 'SET_TOKENS',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
  }

  useEffect(() => {
    console.log('reading auth data from localstorage');
    dispatch({
      type: 'SET_TOKENS',
      ...loadFromLocalStorage(),
    })
  }, [loadFromLocalStorage]);

  useEffect(() => {
    // check if refresh token has expired...
    if (!state.refreshToken || !state.expiresAt) {
      return;
    }

    const expiresIn = Math.max(0, (state.expiresAt - 1*1000*60) - Date.now());
    console.log('Refreshing token in', expiresIn, 'milliseconds or', expiresIn / 1000 / 60, 'minutes');

    const interval = setTimeout(() => {
      console.log('refreshing token now');
      updateToken(state.refreshToken)
        .then((jsonRes) => {
          if (!jsonRes) {
            throw new Error('Token response was empty!')
          }
          if (jsonRes.error) {
            throw jsonRes.error;
          }

          updateWithNewTokens(jsonRes);
        })
        .catch((err) => {
          console.error(err);
        })
    }, expiresIn);

    return () => {
      clearInterval(interval);
    }
  }, [state.expiresAt, state.refreshToken]);

  const fetchUser = useCallback(
    () =>
      fetch(`${process.env.REACT_APP_TDA_ORIGIN}/v1/userprincipals`, {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        
        return res.json();
      })
      .catch((err) => {
        console.error(err);
      }),
    [state.accessToken],
  );

  useEffect(() => {
    if (state.accessToken) {
      fetchUser()
        .then((data) => {
          dispatch({
            type: 'SET_USER',
            user: data,
          });
        });
    }
  }, [state.accessToken, fetchUser]);

  const getToken = useCallback(
    (code) =>
      fetchToken(code).then((jsonRes) => {
        if (!jsonRes) {
          throw new Error('Token response was empty!')
        }
        if (jsonRes.error) {
          throw jsonRes.error;
        }

        updateWithNewTokens(jsonRes);
      })
      .catch((err) => {
        console.error(err);
      }),
    [],
  );

  return <AuthContext.Provider value={{ auth: state, login, getToken }}>{children}</AuthContext.Provider>;
};