import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const authHeroImage =
  "https://images.generated.photos/TXD6gLmPduzmrbN6tendPXyeY1zz9CJNLlDQh2suDnk/g:no/rs:fill:256:384/czM6Ly9ncGhvdG9zLXByb2QtaHVtYW4tZ2FsbGVyeS80NDcxLzBiZjYwN2I2LTBjYzEtNGQxYi1iMDBjLTFhNGMyODAzMzI3Ni0wLmpwZw.jpg";

function Login() {
  const [step, setStep] = useState(0);

  return (
    <div className="auth-wrapper auth-shell container-fluid">
      <div className="row g-4 align-items-stretch justify-content-center w-100 m-0">
        <div className="col-12 col-lg-6 d-flex">
          <div className="auth-left auth-showcase auth-card-soft w-100">
            <div className="auth-copy">
              <span className="auth-eyebrow">Secure digital banking</span>
              <h1>Welcome to NexBank</h1>
              <p>
                Friendly banking that feels clear, calm, and easy to trust from the
                moment you sign in.
              </p>

              <div className="auth-showcase-photo card border-0 shadow-sm">
                <img
                  src={authHeroImage}
                  alt="AI-generated happy person enjoying NexBank"
                  className="img-fluid"
                />
                <div className="card-body">
                  <h3 className="auth-showcase-title">Happy to bank smarter</h3>
                  <p className="mb-0">
                    A cleaner NexBank experience with quick access, guided recovery,
                    and a more welcoming feel.
                  </p>
                </div>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-sm-6">
                  <div className="auth-note-card h-100">Fast login with less clutter.</div>
                </div>
                <div className="col-sm-6">
                  <div className="auth-note-card h-100">Guided password help before recovery starts.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5 d-flex">
          <div className="auth-right auth-card-soft w-100">
            {step === 0 && <LoginForm goToForgot={() => setStep(1)} />}
            {step === 1 && <ForgotPasswordIntro next={() => setStep(2)} back={() => setStep(0)} />}
            {step === 2 && <StepID next={() => setStep(3)} back={() => setStep(1)} />}
            {step === 3 && <StepPhone next={() => setStep(4)} back={() => setStep(2)} />}
            {step === 4 && <StepEmail next={() => setStep(5)} back={() => setStep(3)} />}
            {step === 5 && <StepCard next={() => setStep(6)} back={() => setStep(4)} />}
            {step === 6 && <StepPassword reset={() => setStep(0)} back={() => setStep(5)} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

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
    <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
      <div className="auth-form-panel card border-0 shadow-sm w-100">
        <div className="form-header">
          <span className="auth-section-tag">Login</span>
          <h2>Access your account</h2>
          <p className="form-subtitle">Securely continue to your NexBank dashboard.</p>
        </div>

        <div className="input-group">
          <label>Email or Access Card</label>
          <input
            className="auth-input"
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input type="checkbox" /> Remember me
          </label>
          <button type="button" className="auth-link auth-link-button" onClick={goToForgot}>
            Forgot password?
          </button>
        </div>

        <button className="auth-button" onClick={handleLogin}>
          Login
        </button>

        <div className="register-link">
          <p>
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>

        <div className="contact-support">
          <p>Need to talk to us directly? <span className="contact-link">Contact us -&gt;</span></p>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordIntro({ next, back }) {
  return (
    <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
      <div className="auth-form-panel card border-0 shadow-sm w-100">
        <div className="form-header">
          <span className="auth-section-tag">Password help</span>
          <h2>Before we reset anything</h2>
          <p className="form-subtitle">
            Here is how recovery works so you know what to expect before entering details.
          </p>
        </div>

        <div className="auth-step-preview">
          <div className="auth-step-preview-item">
            <span>1</span>
            <p>Confirm your South African ID number.</p>
          </div>
          <div className="auth-step-preview-item">
            <span>2</span>
            <p>Verify your cellphone and email with one-time pins.</p>
          </div>
          <div className="auth-step-preview-item">
            <span>3</span>
            <p>Confirm your card details, then create a new password.</p>
          </div>
        </div>

        <div className="auth-actions-row">
          <button className="auth-button auth-button-secondary" onClick={back}>
            Back to login
          </button>
          <button className="auth-button" onClick={next}>
            Start recovery
          </button>
        </div>
      </div>
    </div>
  );
}

function StepID({ next, back }) {
  const [id, setId] = useState("");

  const handleNext = () => {
    if (id.length !== 13 || isNaN(id)) {
      alert("SA ID must be exactly 13 digits");
      return;
    }
    next();
  };

  return (
    <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
      <div className="auth-form-panel card border-0 shadow-sm w-100">
        <div className="form-header">
          <span className="auth-section-tag">Step 1 of 4</span>
          <h3>Verify SA ID</h3>
          <p className="form-subtitle">Enter the 13-digit ID linked to your account.</p>
        </div>

        <input
          className="auth-input"
          placeholder="Enter 13-digit SA ID"
          onChange={(e) => setId(e.target.value)}
        />

        <div className="auth-actions-row">
          <button className="auth-button auth-button-secondary" onClick={back}>Back</button>
          <button className="auth-button" onClick={handleNext}>Next</button>
        </div>
      </div>
    </div>
  );
}

function StepPhone({ next, back }) {
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
    <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
      <div className="auth-form-panel card border-0 shadow-sm w-100">
        <div className="form-header">
          <span className="auth-section-tag">Step 2 of 4</span>
          <h3>Phone verification</h3>
          <p className="form-subtitle">We will send a one-time pin to your registered number.</p>
        </div>

        {!otpSent ? (
          <>
            <input
              className="auth-input"
              type="tel"
              placeholder="Enter Cellphone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <div className="auth-actions-row">
              <button className="auth-button auth-button-secondary" onClick={back}>Back</button>
              <button className="auth-button" onClick={sendOTP}>Send OTP</button>
            </div>
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
            <div className="auth-actions-row">
              <button className="auth-button auth-button-secondary" onClick={back}>Back</button>
              <button className="auth-button" onClick={handleVerify}>Verify</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepEmail({ next, back }) {
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
    <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
      <div className="auth-form-panel card border-0 shadow-sm w-100">
        <div className="form-header">
          <span className="auth-section-tag">Step 3 of 4</span>
          <h3>Email verification</h3>
          <p className="form-subtitle">Confirm your email so we know the request is really yours.</p>
        </div>

        {!otpSent ? (
          <>
            <input
              className="auth-input"
              type="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="auth-actions-row">
              <button className="auth-button auth-button-secondary" onClick={back}>Back</button>
              <button className="auth-button" onClick={sendOTP}>Send OTP</button>
            </div>
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
            <div className="auth-actions-row">
              <button className="auth-button auth-button-secondary" onClick={back}>Back</button>
              <button className="auth-button" onClick={handleVerify}>Verify</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepCard({ next, back }) {
  const [card, setCard] = useState("");

  const handleNext = () => {
    if (card.length !== 4 || isNaN(card)) {
      alert("Enter last 4 digits of your card");
      return;
    }
    next();
  };

  return (
    <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
      <div className="auth-form-panel card border-0 shadow-sm w-100">
        <div className="form-header">
          <span className="auth-section-tag">Step 4 of 4</span>
          <h3>Card verification</h3>
          <p className="form-subtitle">Use the final four digits of the card linked to this account.</p>
        </div>

        <input
          className="auth-input"
          placeholder="Last 4 digits of your card"
          maxLength="4"
          onChange={(e) => setCard(e.target.value)}
        />

        <div className="auth-actions-row">
          <button className="auth-button auth-button-secondary" onClick={back}>Back</button>
          <button className="auth-button" onClick={handleNext}>Finish verification</button>
        </div>
      </div>
    </div>
  );
}

function StepPassword({ reset, back }) {
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
    <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
      <div className="auth-form-panel card border-0 shadow-sm w-100">
        <div className="form-header">
          <span className="auth-section-tag">Create new password</span>
          <h3>Reset password</h3>
          <p className="form-subtitle">Your new password should be easy for you and hard for anyone else.</p>
        </div>

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

        <div className="auth-actions-row">
          <button className="auth-button auth-button-secondary" onClick={back}>Back</button>
          <button className="auth-button" onClick={handleReset}>Reset Password</button>
        </div>
      </div>
    </div>
  );
}
