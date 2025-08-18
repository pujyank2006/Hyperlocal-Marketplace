import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils';

import styles from "../styles/authPages.module.css";
import SignupLayout from "./Components/signupLayout";

function SignupPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [temp, setTemp] = useState(false);
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    area: '',
    pincode: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value);
    const copySignupInfo = { ...signupInfo };
    copySignupInfo[name] = value;
    setSignupInfo(copySignupInfo);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log("handleSignup");
    if(temp){
      setTemp(false);
      return null;
    }
    const { name, email, phone, state, city, area, pincode, password, confirmPassword } = signupInfo;
    if (!name || !email || !phone || !state || !city || !area || !pincode || !password || !confirmPassword) {
      return handleError("every field is required!");
    }
    else if (password !== confirmPassword) {
      return handleError("password doesn't match");
    }

    try {
      const url = "http://localhost:9000/auth/signup";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(signupInfo)
      });
      const result = await response.json();
      const { success, message, error } = result;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else if (error) {
        const details = error.details[0].message;
        handleError(details);
      } else if (!success) {
        handleError(message);
      }
      console.log(result);
    } catch (error) {
      handleError(error);
    }
  };

  const nextStep = () => {
    console.log("nextStep");
    if (currentStep === 1) {
      const { name, email, phone } = signupInfo;
      if (!name || !email || !phone) {
        return handleError("Fill all fields in Step 1");
      }
    }

    if (currentStep === 2) {
      setTemp(true);
      const { state, city, area, pincode } = signupInfo;
      if (!state || !city || !area || !pincode) {
        return handleError("Fill all fields in Step 2");
      }
    }

    setCurrentStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(prevStep => prevStep - 1);
  };

  return (
    <SignupLayout>
      <form onSubmit={handleSignup}>
        {currentStep === 1 && (
          <>
            <h1>Connect with your community!</h1>
            <ul className={styles.list}>
              <li>
                <div className={styles.eachList}>
                  <label>Name: </label>
                  <input type="text" placeholder="name" name="name" autoFocus onChange={handleChange} value={signupInfo.name}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Email: </label>
                  <input type="text" placeholder="email" name="email" onChange={handleChange} value={signupInfo.email}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Phone: </label>
                  <input type="text" placeholder="phone" name="phone" onChange={handleChange} value = {signupInfo.phone}/>
                </div>
              </li>
            </ul>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h1>Almost there!</h1>
            <ul className={styles.list}>
              <li>
                <div className={styles.eachList}>
                  <label>State: </label>
                  <input type="text" placeholder="state" name="state" autoFocus onChange={handleChange} value={signupInfo.state}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>City: </label>
                  <input type="text" placeholder="city" name="city" onChange={handleChange} value={signupInfo.city}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Area: </label>
                  <input type="text" placeholder="area" name="area" onChange={handleChange} value={signupInfo.area}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Pincode: </label>
                  <input type="text" placeholder="pincode" name="pincode" onChange={handleChange} value={signupInfo.pincode}/>
                </div>
              </li>
            </ul>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h1>one last step!!</h1>

            <ul className={styles.list}>
              <li>
                <div className={styles.eachList}>
                  <label>Password: </label>
                  <input type="password" placeholder="password" name="password" autoFocus onChange={handleChange} value={signupInfo.password}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Confirm Password: </label>
                  <input type="password" placeholder="confirm password" name="confirmPassword" onChange={handleChange} value={signupInfo.confirmPassword}/>
                </div>
              </li>
            </ul>
          </>
        )}

        <p className={styles.line}>
          Already have an account?
          <Link to="/login">Login</Link>
        </p>
        < ToastContainer />

        {currentStep > 1 && (
          <button type="button" className={styles.login} onClick={prevStep}>Previous</button>
        )}
        {currentStep < 3 ? (
          <button type="button" className={styles.login} onClick={nextStep}>Next</button>
        ) : (
          <button type="submit" className={styles.login}>Submit</button>
        )}

      </form>
    </SignupLayout>
  );
}

export default SignupPage
