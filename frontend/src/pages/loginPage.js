import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils';

// Importing Style
import styles from "../styles/loginPage.module.css";
// Layout 
import LoginLayout from "./Components/loginLayout";

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value);
    const copyLoginInfo = { ...loginInfo };
    copyLoginInfo[name] = value;
    setLoginInfo(copyLoginInfo);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("ID and password is required!")
    }
    try {
      const url = "http://localhost:9000/auth/login";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(loginInfo)
      })
      const result = await response.json();
      const { message, success, jwtToken, name, email, city, area, error } = result;
      if (success) {
        handleSuccess(message);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('loggedInUser', name);
        localStorage.setItem('email', email);
        localStorage.setItem('city', city);
        localStorage.setItem('area', area);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else if (error) {
        const details = error.details[0].message;
        handleError(details);
      } else if (!success) {
        handleError(message);
      }
      console.log(result);
    }
    catch (err) {
      handleError(err);
    }
  }

  return (
    <LoginLayout >
      <h1>Get back to your community!</h1>
      <form name="myform" id="form" method="post" onSubmit={handleLogin}>

        <ul className={styles.list}>
          <li>
            <div className={styles.eachList}>
            <label>Email: </label>
              <input type="text" placeholder="email" name="email" autoFocus onChange={handleChange} />
            </div>
          </li>

          <li>
            <div>
            <label>Password: </label>
              <input type="password" placeholder="Password" name="password" onChange={handleChange} />
            </div>
          </li>
        </ul>

        <button className={styles.login} type="submit">
          Login
        </button>

        <p className={styles.line}>
          Don't have an account?
          <Link to="/signup">Signup</Link>
        </p>
        < ToastContainer />
      </form>
    </LoginLayout >
  )
}

export default Login
