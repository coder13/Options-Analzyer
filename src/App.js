import { useContext, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useLocation,
} from 'react-router-dom';
import qs from 'qs';
import LegBuilder from './LegBuilder';
import { Store } from './Store';

const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const ConsumerKey = process.env.REACT_APP_CLIENT_ID;
const LoginURL = `https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=${REDIRECT_URI}&client_id=${ConsumerKey}%40AMER.OAUTHAP&access_type=offline`;

function AuthCallback() {
  const { state,dispatch } = useContext(Store);
  const location = useLocation();
  const params = qs.parse(location.search, { ignoreQueryPrefix: true });
  window.localStorage.setItem('options_chains-code', params.code);
  dispatch({
    type: 'SET_CODE',
    code: params.code,
  });

  useEffect(() => {
    let searchParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      client_id: ConsumerKey,
      access_type: 'offline',
      redirect_uri: REDIRECT_URI,
    });

    fetch(`${process.env.REACT_APP_TDA_ORIGIN}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: searchParams.toString(),
    }).then((response) => response.json())
    .then((jsonRes) => {
      if (jsonRes.error) {
        throw jsonRes.error;
      }

      window.localStorage.setItem('options_chains-access_token', jsonRes.access_token);
      window.localStorage.setItem('options_chains-refresh_token', jsonRes.refresh_token);
      window.localStorage.setItem('options_chains-scope', jsonRes.scope);
      dispatch({
        type: 'SET_ACCESS_TOKEN',
        access_token: jsonRes.access_token,
      })
    })
    .catch((err) => {
      console.error(err);
    });
  }, [params.code, dispatch]);

  return (
    <div>
      {params.code}
      {state.user.access_token && <Redirect to="/" />}
    </div>
  )
}

function App() {
  const { state } = useContext(Store);
  console.log(34, state);

  return (
    <div className="App">
      <header>
        {<a href={LoginURL}>Login</a> }
      </header>
      <Router>
        <Switch>
          <Route exact path="/">
            <p>hi</p>
            <Link to="/options_chains">Options Chain</Link>
          </Route>
          <Route path="/options_chains">
            <LegBuilder symbol="SPY" expirationDate="2021-10-22" />
          </Route>
          <Route path="/auth/callback">
            <AuthCallback />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
