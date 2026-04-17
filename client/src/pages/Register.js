import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const authHeroImage =
  "https://images.generated.photos/TXD6gLmPduzmrbN6tendPXyeY1zz9CJNLlDQh2suDnk/g:no/rs:fill:256:384/czM6Ly9ncGhvdG9zLXByb2QtaHVtYW4tZ2FsbGVyeS80NDcxLzBiZjYwN2I2LTBjYzEtNGQxYi1iMDBjLTFhNGMyODAzMzI3Ni0wLmpwZw.jpg";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = () => {
    if (!form.firstname || !form.surname || !form.id || !form.email || !form.phone || !form.password) {
      alert("Please fill all required fields");
      return;
    }

    if (form.id.length !== 13 || isNaN(form.id)) {
      alert("SA ID must be exactly 13 digits");
      return;
    }

    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }

    alert("Registration successful! Please login.");
    navigate("/");
  };

  return (
    <div className="auth-wrapper auth-shell container-fluid">
      <div className="row g-4 align-items-stretch justify-content-center w-100 m-0">
        <div className="col-12 col-lg-6 d-flex">
          <div className="auth-left auth-showcase auth-card-soft w-100">
            <div className="auth-copy">
              <span className="auth-eyebrow">Open your account</span>
              <h1>Create NexBank Account</h1>
              <p>
                Join NexBank with a cleaner registration flow that feels modern,
                warm, and easy to complete.
              </p>

              <div className="auth-showcase-photo card border-0 shadow-sm">
                <img
                  src={authHeroImage}
                  alt="AI-generated happy person excited to use NexBank"
                  className="img-fluid"
                />
                <div className="card-body">
                  <h3 className="auth-showcase-title">A friendly first impression</h3>
                  <p className="mb-0">
                    Clear steps, softer visuals, and the same trusted NexBank color
                    palette your team is already using.
                  </p>
                </div>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-sm-6">
                  <div className="auth-note-card h-100">Balanced two-column layout.</div>
                </div>
                <div className="col-sm-6">
                  <div className="auth-note-card h-100">Cleaner form sizing with Bootstrap spacing.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5 d-flex">
          <div className="auth-right auth-card-soft w-100">
            <div className="auth-form-shell d-flex justify-content-center align-items-center w-100">
              <div className="auth-form-panel card border-0 shadow-sm w-100">
                <div className="form-header">
                  <span className="auth-section-tag">Register</span>
                  <h2>Open your profile</h2>
                  <p className="form-subtitle">Fill in your details to create your NexBank account.</p>
                </div>

                <div className="auth-grid">
                  <input
                    className="auth-input"
                    name="firstname"
                    placeholder="First Name"
                    onChange={handleChange}
                  />
                  <input
                    className="auth-input"
                    name="surname"
                    placeholder="Surname"
                    onChange={handleChange}
                  />
                </div>

                <input
                  className="auth-input"
                  name="id"
                  placeholder="SA ID Number (13 digits)"
                  onChange={handleChange}
                />
                <input
                  className="auth-input"
                  name="email"
                  placeholder="Email Address"
                  onChange={handleChange}
                />
                <input
                  className="auth-input"
                  name="phone"
                  placeholder="Cellphone Number"
                  onChange={handleChange}
                />
                <input
                  className="auth-input"
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                />
                <input
                  className="auth-input"
                  type="password"
                  name="confirm"
                  placeholder="Confirm Password"
                  onChange={handleChange}
                />

                <button className="auth-button" onClick={handleRegister}>
                  Register
                </button>

                <p className="auth-inline-note auth-inline-note-center">
                  Already have an account? <Link to="/" className="auth-link">Login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
