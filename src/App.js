import { useContext } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
} from 'react-router-dom';
import LegBuilder from './LegBuilder';
import { Store } from './Store';
import { AuthContext } from './AuthProvider';
import AuthCallback from './components/AuthCallback';

function App() {
  const { state } = useContext(Store);
  const { login } = useContext(AuthContext);
  console.log(34, state);

  return (
    <Router>
      <div className="App">
        <header>
          {<button onClick={() => login()}>Login</button> }
        </header>
        <Switch>
          <Route exact path="/">
            <p>hi</p>
            <Link to="/options_chains">Options Chain</Link>
          </Route>
          <Route path="/options_chains">
            <LegBuilder symbol="SPY" expirationDate="2021-10-29" />
          </Route>
          <Route path="/auth/callback">
            <AuthCallback />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
