import { useContext } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
} from 'react-router-dom';
import { AuthContext } from './providers/AuthProvider';
import AuthCallback from './pages/AuthCallback';
import LegBuilder from './pages/LegBuilder';
import ExplorePage from './pages/Explore';
import HomePage from './pages/Home';
import './App.css'

function App() {
  const { auth, login } = useContext(AuthContext);

  return (
    <Router>
      <div className="app overflow-hidden h-screen">
        <nav className="flex p-0 bg-green-100 shadow-lg">
          <h1 className="m-2">Options Analyzer</h1>
          <Link to="/" className="link">Home</Link>
          <Link to="/options" className="link">Options</Link>
          <Link to="/explore" className="link">Explore</Link>
          <div className="flex-1" />
          {!auth.user || !auth.accessToken
            ? <button className="m-2" onClick={() => login()}>Login</button>
            : <Link className="link">{auth.user.userId}</Link>
          }
        </nav>
        <div className="flex flex-auto overflow-y-auto min-h-0">
          <Switch>
            <Route exact path="/" component={HomePage} />
            <Route path="/options">
              <LegBuilder symbol="SPY" expirationDate="2021-10-29" />
            </Route>
            <Route path="/explore">
              <ExplorePage symbol="SPY" expirationDate="2021-10-29" />
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
