import { useContext } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
} from 'react-router-dom';
import LegBuilder from './LegBuilder';
import { AuthContext } from './AuthProvider';
import AuthCallback from './components/AuthCallback';
import './App.css'

function App() {
  const { auth, login } = useContext(AuthContext);

  return (
    <Router>
      <div className="App overflow-hidden h-screen">
        <nav className="flex p-2 bg-green-100 shadow-lg">
          <h1>Options Analyzer</h1>
          <div className="flex-1" />
          {!auth.user || !auth.accessToken
            ? <button onClick={() => login()}>Login</button>
            : <span>{auth.user.userId}</span>
          }
        </nav>
        <div className="flex flex-auto overflow-y-auto min-h-0">
          <Switch>
            <Route exact path="/">
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
      </div>
    </Router>
  );
}

export default App;
