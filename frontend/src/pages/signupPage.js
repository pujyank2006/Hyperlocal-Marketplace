import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { handleError, handleSuccess, fetchPincodeCoordinates } from '../utils';

import styles from "../styles/authPages.module.css";
import SignupLayout from "../Components/signupLayout";

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const confirmPasswordRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    area: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    latitude: null,
    longitude: null,
    isPincodeFallback: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!signupInfo.confirmPassword) {
        e.preventDefault();
        confirmPasswordRef.current?.focus();
      }
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      return handleError("Geolocation is not supported by your browser");
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSignupInfo(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          isPincodeFallback: false
        }));

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setSignupInfo(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              isPincodeFallback: false,
              state: addr.state || addr.region || prev.state,
              city: addr.city || addr.town || addr.village || addr.county || prev.city,
              area: addr.suburb || addr.neighbourhood || addr.residential || addr.road || prev.area,
              pincode: addr.postcode || prev.pincode
            }));
          }
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
        } finally {
          setIsDetectingLocation(false);
          handleSuccess("📍 Precise GPS coordinates captured!");
        }
      },
      (err) => {
        console.warn("GPS Access Error:", err);
        setIsDetectingLocation(false);
        handleError("Location access denied or unavailable. Falling back to pincode-based map view.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePincodeBlur = async (e) => {
    const val = (e.target.value || '').trim();
    if (val.length === 6 && (!signupInfo.latitude || signupInfo.isPincodeFallback)) {
      setIsDetectingLocation(true);
      const coords = await fetchPincodeCoordinates(val);
      setIsDetectingLocation(false);
      if (coords) {
        setSignupInfo(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
          isPincodeFallback: true
        }));
      }
    }
  };

  const nextStep = async () => {
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

      // If user did not use GPS, automatically resolve pincode centroid
      if (!signupInfo.latitude || !signupInfo.longitude || signupInfo.isPincodeFallback) {
        setIsDetectingLocation(true);
        const coords = await fetchPincodeCoordinates(pincode.trim());
        setIsDetectingLocation(false);
        if (coords) {
          setSignupInfo(prev => ({
            ...prev,
            latitude: coords.latitude,
            longitude: coords.longitude,
            isPincodeFallback: true
          }));
        }
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
      setIsSubmitting(true);
      let payload = { ...signupInfo };
      if (!payload.latitude && payload.pincode && payload.pincode.trim().length === 6) {
        const coords = await fetchPincodeCoordinates(payload.pincode.trim());
        if (coords) {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
        }
      }
      delete payload.isPincodeFallback;
      const result = await signup(payload);
      if (result.success) {
        handleSuccess(result.message || "Signup successful!");
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        handleError(result.message || "Signup failed");
      }
    } catch (error) {
      handleError(error.message || "Network error during signup");
    } finally {
      setIsSubmitting(false);
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

            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
              >
                {isDetectingLocation ? "⏳ Detecting GPS Location..." : "📍 Use My Current Location (GPS)"}
              </button>
              {signupInfo.latitude && signupInfo.longitude ? (
                <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600', marginTop: '6px' }}>
                  {signupInfo.isPincodeFallback ? "📍 Pincode Centroid Active" : "✅ GPS Captured"}: ({signupInfo.latitude.toFixed(4)}, {signupInfo.longitude.toFixed(4)})
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  ℹ️ If GPS location is not used, coordinates will automatically fall back to your pincode center.
                </div>
              )}
            </div>

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
                  <input className={styles.inputSpaces} type="text" placeholder="6-digit pincode" name="pincode" onChange={handleChange} onBlur={handlePincodeBlur} value={signupInfo.pincode}/>
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
                  <input
                    className={styles.inputSpaces}
                    type="password"
                    placeholder="Password (min 4 chars)"
                    name="password"
                    autoFocus
                    onChange={handleChange}
                    onKeyDown={handlePasswordKeyDown}
                    value={signupInfo.password}
                  />
                </div>
              </li>

              <li>
                <div className={styles.eachList}>
                  <label>Confirm Password: </label>
                  <input
                    ref={confirmPasswordRef}
                    className={styles.inputSpaces}
                    type="password"
                    placeholder="Confirm password"
                    name="confirmPassword"
                    onChange={handleChange}
                    value={signupInfo.confirmPassword}
                  />
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
          <button key="prev-btn" type="button" className={styles.button} onClick={prevStep} disabled={isSubmitting}>Previous</button>
        )}
        {currentStep < 3 ? (
          <button key="next-btn" type="button" className={styles.button} onClick={nextStep} disabled={isSubmitting}>Next</button>
        ) : (
          <button key="submit-btn" type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Submit"}
          </button>
        )}

      </form>
    </SignupLayout>
  );
}

export default SignupPage;
