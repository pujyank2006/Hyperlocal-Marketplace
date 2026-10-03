import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { handleError, handleSuccess } from '../utils';

import styles from "../styles/authPages.module.css";
import LoginLayout from "../Components/loginLayout";

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("Email and Password are required!");
    }

    try {
      setIsSubmitting(true);
      const data = await login(loginInfo);
      if (data.success) {
        handleSuccess(data.message || "Login Successful!");
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        handleError(data.message || "Invalid credentials");
      }
    } catch (err) {
      handleError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginLayout>
      <h1>Get back to your community!</h1>
      <form onSubmit={handleLogin}>
        <ul className={styles.list}>
          <li>
            <div className={styles.eachList}>
              <label>Email: </label>
              <input
                className={styles.inputSpaces}
                type="email"
                placeholder="email@example.com"
                name="email"
                autoFocus
                value={loginInfo.email}
                onChange={handleChange}
                required
              />
            </div>
          </li>

          <li>
            <div className={styles.eachList}>
              <label>Password: </label>
              <input
                className={styles.inputSpaces}
                type="password"
                placeholder="Password"
                name="password"
                value={loginInfo.password}
                onChange={handleChange}
                required
              />
            </div>
          </li>
        </ul>

        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className={styles.line}>
          Don't have an account?
          <Link to="/signup">Signup</Link>
        </p>
        <ToastContainer />
      </form>
    </LoginLayout>
  );
}

export default Login;
