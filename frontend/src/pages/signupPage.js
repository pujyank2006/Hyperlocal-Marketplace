import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils';

import styles from "../styles/authPages.module.css";
import SignupLayout from "../Components/signupLayout";

function SignupPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
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
    setSignupInfo(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const { name, email, phone } = signupInfo;
      if (!name.trim() || !email.trim() || !phone.trim()) {
        return handleError("Please fill all fields in Step 1");
      }
      if (phone.trim().length !== 10) {
        return handleError("Phone number must be 10 digits");
      }
    }

    if (currentStep === 2) {
      const { state, city, area, pincode } = signupInfo;
      if (!state.trim() || !city.trim() || !area.trim() || !pincode.trim()) {
        return handleError("Please fill all fields in Step 2");
      }
      if (pincode.trim().length !== 6) {
        return handleError("Pincode must be 6 digits");
      }
    }

    if (currentStep < 3) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prevStep => prevStep - 1);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // If user pressed Enter on keyboard during Step 1 or Step 2, advance step instead of submitting
    if (currentStep < 3) {
      nextStep();
      return;
    }

    const { name, email, phone, state, city, area, pincode, password, confirmPassword } = signupInfo;
    
    if (!name || !email || !phone || !state || !city || !area || !pincode) {
      return handleError("Some earlier fields are missing. Please check Step 1 & 2.");
    }
    if (!password || !confirmPassword) {
      return handleError("Password and Confirm Password are required!");
    }
    if (password.length < 4) {
      return handleError("Password must be at least 4 characters long!");
    }
    if (password !== confirmPassword) {
      return handleError("Passwords do not match!");
    }

    try {
      const url = "http://localhost:9000/api/v1/auth/signup";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify(signupInfo)
      });
      const result = await response.json();
      const { success, message, error } = result;

      if (success) {
        localStorage.setItem("isLoggedIn", "true");
        window.dispatchEvent(new Event("storage"));
        handleSuccess(message || "Signup successful!");
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else if (error && error.details) {
        const details = error.details[0].message;
        handleError(details);
      } else {
        handleError(message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      handleError("Network error during signup. Please check server.");
    }
  };

  return (
    <SignupLayout>
      <form onSubmit={handleSignup}>
        {currentStep === 1 && (
          <>
            <h1>Start connecting!</h1>
            <ul className={styles.list}>
              <li>
                <div className={styles.eachList}>
                  <label>Name: </label>
                  <input className={styles.inputSpaces} type="text" placeholder="Full name" name="name" autoFocus onChange={handleChange} value={signupInfo.name}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Email: </label>
                  <input className={styles.inputSpaces} type="email" placeholder="Email address" name="email" onChange={handleChange} value={signupInfo.email}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Phone: </label>
                  <input className={styles.inputSpaces} type="text" placeholder="10-digit phone number" name="phone" onChange={handleChange} value={signupInfo.phone}/>
                </div>
              </li>
            </ul>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h1>Almost there!!</h1>
            <ul className={styles.list}>
              <li>
                <div className={styles.eachList}>
                  <label>State: </label>
                  <input className={styles.inputSpaces} type="text" placeholder="State" name="state" autoFocus onChange={handleChange} value={signupInfo.state}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>City: </label>
                  <input className={styles.inputSpaces} type="text" placeholder="City" name="city" onChange={handleChange} value={signupInfo.city}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Area: </label>
                  <input className={styles.inputSpaces} type="text" placeholder="Area / Locality" name="area" onChange={handleChange} value={signupInfo.area}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Pincode: </label>
                  <input className={styles.inputSpaces} type="text" placeholder="6-digit pincode" name="pincode" onChange={handleChange} value={signupInfo.pincode}/>
                </div>
              </li>
            </ul>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h1>One last step!!!</h1>

            <ul className={styles.list}>
              <li>
                <div className={styles.eachList}>
                  <label>Password: </label>
                  <input className={styles.inputSpaces} type="password" placeholder="Password (min 4 chars)" name="password" autoFocus onChange={handleChange} value={signupInfo.password}/>
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Confirm Password: </label>
                  <input className={styles.inputSpaces} type="password" placeholder="Confirm password" name="confirmPassword" onChange={handleChange} value={signupInfo.confirmPassword}/>
                </div>
              </li>
            </ul>
          </>
        )}

        <p className={styles.line}>
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <ToastContainer />

        {currentStep > 1 && (
          <button type="button" className={styles.button} onClick={prevStep}>Previous</button>
        )}
        {currentStep < 3 ? (
          <button type="button" className={styles.button} onClick={nextStep}>Next</button>
        ) : (
          <button type="submit" className={styles.button}>Submit</button>
        )}

      </form>
    </SignupLayout>
  );
}

export default SignupPage;
