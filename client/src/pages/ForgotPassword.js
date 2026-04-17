import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const recoverySteps = [
  {
    title: "Step 1",
    heading: "Confirm your South African ID",
    description:
      "Enter the 13-digit ID number linked to your NexBank profile so we can verify your identity."
  },
  {
    title: "Step 2",
    heading: "Verify your cellphone number",
    description:
      "We send a one-time PIN to the cellphone number on your account before you can continue."
  },
  {
    title: "Step 3",
    heading: "Verify your email address",
    description:
      "A second code is sent to your registered email for added account protection."
  },
  {
    title: "Step 4",
    heading: "Confirm your bank card",
    description:
      "Enter the last 4 digits of your NexBank card so we know it is really you."
  },
  {
    title: "Step 5",
    heading: "Create your new password",
    description:
      "Choose a strong new password, confirm it, and return to login securely."
  }
];

function ForgotPassword() {
  const [step, setStep] = useState(0);

  return (
    <div className="auth-shell auth-shell--forgot container-fluid">
      <div className="row g-0 min-vh-100">
        <div className="col-lg-6 auth-brand-panel">
          <div className="auth-brand-inner">
            <div className="auth-brand-lockup">
              <img
                src="/NexBank-logo.png"
                alt="NexBank"
                className="auth-brand-logo"
              />
              <div className="auth-brand-lockup-copy">
                <span className="auth-brand-name">NexBank</span>
                <span className="auth-brand-slogan">Your money simplified</span>
              </div>
            </div>
            <span className="auth-brand-chip">Password Recovery</span>
            <h1 className="auth-brand-title">Recover access with guided security checks.</h1>
            <p className="auth-brand-copy">
              Each step protects the account before a new password is created.
            </p>

            <div className="auth-brand-steps">
              {recoverySteps.map((item) => (
                <div className="auth-brand-step" key={item.title}>
                  <span className="auth-brand-step-tag">{item.title}</span>
                  <div>
                    <h3>{item.heading}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-6 auth-form-panel">
          <div className="auth-panel-frame">
            <div className="auth-panel-glow" />
            <div className="auth-card auth-card--compact">
              <div className="auth-switcher" role="tablist" aria-label="Authentication pages">
                <Link className="auth-switcher-link" to="/login">
                  Login
                </Link>
                <Link className="auth-switcher-link" to="/register">
                  Register
                </Link>
              </div>
              {step === 0 && <ForgotPasswordGuide onStart={() => setStep(1)} />}
              {step === 1 && <StepID next={() => setStep(2)} />}
              {step === 2 && <StepPhone next={() => setStep(3)} />}
              {step === 3 && <StepEmail next={() => setStep(4)} />}
              {step === 4 && <StepCard next={() => setStep(5)} />}
              {step === 5 && <StepPassword reset={() => setStep(0)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordGuide({ onStart }) {
  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Before you begin</span>
        <h2 className="auth-card-title">Follow these steps to reset your password.</h2>
        <p className="auth-card-copy">
          Keep your ID number, cellphone, email, and card nearby so the process is quick.
        </p>
      </div>

      <div className="auth-instruction-list">
        {recoverySteps.map((item) => (
          <div className="auth-instruction-item" key={item.title}>
            <span className="auth-instruction-badge">{item.title}</span>
            <div>
              <h3>{item.heading}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="btn auth-primary-btn w-100" type="button" onClick={onStart}>
        Continue to Recovery
      </button>

      <p className="auth-footnote text-center mb-0">
        Remembered your password? <Link to="/login">Back to login</Link>
      </p>
    </>
  );
}

function StepID({ next }) {
  const [id, setId] = useState("");

  const handleNext = () => {
    if (id.length !== 13 || Number.isNaN(Number(id))) {
      alert("SA ID must be exactly 13 digits.");
      return;
    }
    next();
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 1 of 5</span>
        <h2 className="auth-card-title">Verify your South African ID</h2>
        <p className="auth-card-copy">Use the ID number linked to your NexBank profile.</p>
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="forgot-id">
          SA ID Number
        </label>
        <input
          id="forgot-id"
          className="form-control auth-control"
          placeholder="Enter your 13-digit ID number"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
      </div>

      <button className="btn auth-primary-btn w-100" type="button" onClick={handleNext}>
        Next Step
      </button>
    </>
  );
}

function StepPhone({ next }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const sendOTP = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid cellphone number.");
      return;
    }
    alert(`OTP sent to ${phoneNumber} (simulation).`);
    setOtpSent(true);
  };

  const handleVerify = () => {
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }
    next();
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 2 of 5</span>
        <h2 className="auth-card-title">Verify your cellphone number</h2>
        <p className="auth-card-copy">We will send a one-time PIN to your registered number.</p>
      </div>

      {!otpSent ? (
        <>
          <div className="mb-3">
            <label className="form-label auth-label" htmlFor="forgot-phone">
              Cellphone Number
            </label>
            <input
              id="forgot-phone"
              className="form-control auth-control"
              type="tel"
              placeholder="Enter your cellphone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <button className="btn auth-primary-btn w-100" type="button" onClick={sendOTP}>
            Send OTP
          </button>
        </>
      ) : (
        <>
          <p className="auth-status-note">OTP sent to {phoneNumber}</p>
          <div className="mb-3">
            <label className="form-label auth-label" htmlFor="forgot-phone-otp">
              One-Time PIN
            </label>
            <input
              id="forgot-phone-otp"
              className="form-control auth-control"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <button className="btn auth-primary-btn w-100" type="button" onClick={handleVerify}>
            Verify Number
          </button>
        </>
      )}
    </>
  );
}

function StepEmail({ next }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const sendOTP = () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    alert(`OTP sent to ${email} (simulation).`);
    setOtpSent(true);
  };

  const handleVerify = () => {
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }
    next();
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 3 of 5</span>
        <h2 className="auth-card-title">Verify your email address</h2>
        <p className="auth-card-copy">A second code keeps the recovery process secure.</p>
      </div>

      {!otpSent ? (
        <>
          <div className="mb-3">
            <label className="form-label auth-label" htmlFor="forgot-email">
              Email Address
            </label>
            <input
              id="forgot-email"
              className="form-control auth-control"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button className="btn auth-primary-btn w-100" type="button" onClick={sendOTP}>
            Send Email OTP
          </button>
        </>
      ) : (
        <>
          <p className="auth-status-note">OTP sent to {email}</p>
          <div className="mb-3">
            <label className="form-label auth-label" htmlFor="forgot-email-otp">
              One-Time PIN
            </label>
            <input
              id="forgot-email-otp"
              className="form-control auth-control"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <button className="btn auth-primary-btn w-100" type="button" onClick={handleVerify}>
            Verify Email
          </button>
        </>
      )}
    </>
  );
}

function StepCard({ next }) {
  const [card, setCard] = useState("");

  const handleNext = () => {
    if (card.length !== 4 || Number.isNaN(Number(card))) {
      alert("Enter the last 4 digits of your card.");
      return;
    }
    next();
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 4 of 5</span>
        <h2 className="auth-card-title">Confirm your bank card</h2>
        <p className="auth-card-copy">Use the last four digits of your NexBank card.</p>
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="forgot-card">
          Card Digits
        </label>
        <input
          id="forgot-card"
          className="form-control auth-control"
          placeholder="Last 4 digits of your card"
          maxLength="4"
          value={card}
          onChange={(e) => setCard(e.target.value)}
        />
      </div>

      <button className="btn auth-primary-btn w-100" type="button" onClick={handleNext}>
        Next Step
      </button>
    </>
  );
}

function StepPassword({ reset }) {
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleReset = () => {
    if (pass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (pass !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    alert("Password reset successful. Please login with your new password.");
    reset();
    navigate("/login");
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 5 of 5</span>
        <h2 className="auth-card-title">Create your new password</h2>
        <p className="auth-card-copy">Make it strong and confirm it before returning to login.</p>
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="forgot-pass">
          New Password
        </label>
        <input
          id="forgot-pass"
          className="form-control auth-control"
          type="password"
          placeholder="New password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="forgot-confirm">
          Confirm Password
        </label>
        <input
          id="forgot-confirm"
          className="form-control auth-control"
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <button className="btn auth-primary-btn w-100" type="button" onClick={handleReset}>
        Reset Password
      </button>
    </>
  );
}

export default ForgotPassword;
