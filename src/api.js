import qs from 'qs';

const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const ConsumerKey = process.env.REACT_APP_CLIENT_ID;

export const login = () => {
  window.location = `https://auth.tdameritrade.com/auth?${qs.stringify({
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    client_id: ConsumerKey + '@AMER.OAUTHAP',
    access_type: 'offline',
  })}`;
};

/**
 * Fetches an access token given a code
 * @param {string} code 
 * @returns the promise from the fetch with the json decoded if the request returned successfully
 */
export const fetchToken = (code) =>
  fetch(`${process.env.REACT_APP_TDA_ORIGIN}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: qs.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.REACT_APP_CLIENT_ID,
      access_type: 'offline',
      redirect_uri: REDIRECT_URI,
    }),
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json()
  });

export const updateToken = (refreshToken) =>
  fetch(`${process.env.REACT_APP_TDA_ORIGIN}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      access_type: 'offline',
      client_id: process.env.REACT_APP_CLIENT_ID,
    }),
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json()
  });
