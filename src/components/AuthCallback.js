import { useContext, useState, useEffect } from 'react';
import {
  Redirect,
  useLocation,
} from 'react-router-dom';
import qs from 'qs';
import { AuthContext } from '../AuthProvider';

function AuthCallback() {
  const { auth, getToken } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const location = useLocation();
  const params = qs.parse(location.search, { ignoreQueryPrefix: true });

  useEffect(() => {
    if (!params.code) {
      console.error('Missing code!');
      return;
    }

    getToken(params.code).catch(setError);
  }, [getToken, params.code]);

  return (
    <div>
      {error && (
        <div>
          <p>{error.toString()}</p>
          <p>Code: {params.code}</p>
        </div>
      )}
      {auth.accessToken && <Redirect to="/" />}
    </div>
  )
}

export default AuthCallback;
