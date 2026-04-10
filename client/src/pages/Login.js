import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Login() {
  const [step, setStep] = useState(0);

  return (
    <div className="auth-wrapper">
      {/* LEFT SIDE */}
      <div className="auth-left">
        <h1>Welcome to NexBank</h1>
        <p>Your Money Simplified</p>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">
        {step === 0 && <LoginForm goToForgot={() => setStep(1)} />}
        {step === 1 && <StepID next={() => setStep(2)} />}
        {step === 2 && <StepPhone next={() => setStep(3)} />}
        {step === 3 && <StepEmail next={() => setStep(4)} />}
        {step === 4 && <StepCard next={() => setStep(5)} />}
        {step === 5 && <StepPassword reset={() => setStep(0)} />}
      </div>
    </div>
  );
}

export default Login;

//////////////////////////////////////////////////
// LOGIN FORM (REAL API)
//////////////////////////////////////////////////

function LoginForm({ goToForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      alert("Invalid login details");
    }
  };

  return (
    <>
      <h2>Login</h2>

      <input
        className="auth-input"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <p className="auth-link" onClick={goToForgot}>
        Forgot password?
      </p>

      <button className="auth-button" onClick={handleLogin}>
        Login
      </button>

      <p>
        Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
      </p>
    </>
  );
}

//////////////////////////////////////////////////
// STEP 1 – SA ID
//////////////////////////////////////////////////

function StepID({ next }) {
  const [id, setId] = useState("");

  const handleNext = () => {
    if (id.length !== 13 || isNaN(id)) {
      alert("SA ID must be exactly 13 digits");
      return;
    }
    next();
  };

  return (
    <>
      <h3>Verify SA ID</h3>
      <input
        className="auth-input"
        placeholder="Enter 13-digit SA ID"
        onChange={(e) => setId(e.target.value)}
      />
      <button className="auth-button" onClick={handleNext}>Next</button>
    </>
  );
}

//////////////////////////////////////////////////
// STEP 2 – PHONE OTP (FIXED - user enters phone number first)
//////////////////////////////////////////////////

function StepPhone({ next }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const sendOTP = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid cellphone number");
      return;
    }
    alert(`OTP sent to ${phoneNumber} (simulation)`);
    setOtpSent(true);
  };

  const handleVerify = () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }
    alert("Phone verified successfully!");
    next();
  };

  return (
    <>
      <h3>Phone Verification</h3>
      
      {!otpSent ? (
        <>
          <input
            className="auth-input"
            type="tel"
            placeholder="Enter Cellphone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button className="auth-button" onClick={sendOTP}>Send OTP</button>
        </>
      ) : (
        <>
          <p className="text-muted">OTP sent to {phoneNumber}</p>
          <input
            className="auth-input"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="auth-button" onClick={handleVerify}>Verify</button>
        </>
      )}
    </>
  );
}

//////////////////////////////////////////////////
// STEP 3 – EMAIL OTP (FIXED - user enters email first)
//////////////////////////////////////////////////

function StepEmail({ next }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const sendOTP = () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }
    alert(`OTP sent to ${email} (simulation)`);
    setOtpSent(true);
  };

  const handleVerify = () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }
    alert("Email verified successfully!");
    next();
  };

  return (
    <>
      <h3>Email Verification</h3>
      
      {!otpSent ? (
        <>
          <input
            className="auth-input"
            type="email"
            placeholder="Enter Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="auth-button" onClick={sendOTP}>Send OTP</button>
        </>
      ) : (
        <>
          <p className="text-muted">OTP sent to {email}</p>
          <input
            className="auth-input"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="auth-button" onClick={handleVerify}>Verify</button>
        </>
      )}
    </>
  );
}

//////////////////////////////////////////////////
// STEP 4 – CARD
//////////////////////////////////////////////////

function StepCard({ next }) {
  const [card, setCard] = useState("");

  const handleNext = () => {
    if (card.length !== 4 || isNaN(card)) {
      alert("Enter last 4 digits of your card");
      return;
    }
    next();
  };

  return (
    <>
      <h3>Card Verification</h3>
      <input
        className="auth-input"
        placeholder="Last 4 digits of your card"
        maxLength="4"
        onChange={(e) => setCard(e.target.value)}
      />
      <button className="auth-button" onClick={handleNext}>Next</button>
    </>
  );
}

//////////////////////////////////////////////////
// STEP 5 – RESET PASSWORD
//////////////////////////////////////////////////

function StepPassword({ reset }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleReset = () => {
    if (pass.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    
    if (pass !== confirm) {
      alert("Passwords do not match");
      return;
    }

    alert("Password reset successful! Please login with your new password.");
    reset();
  };

  return (
    <>
      <h3>Reset Password</h3>

      <input
        className="auth-input"
        type="password"
        placeholder="New Password"
        onChange={(e) => setPass(e.target.value)}
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Confirm Password"
        onChange={(e) => setConfirm(e.target.value)}
      />

      <button className="auth-button" onClick={handleReset}>Reset Password</button>
    </>
  );
}