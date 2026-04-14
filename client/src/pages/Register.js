import { useState } from "react";
import { useNavigate } from "react-router-dom";  // 👈 ADD THIS IMPORT

function Register() {
  const navigate = useNavigate();  // 👈 ADD THIS FOR NAVIGATION
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
    navigate("/");  // 👈 REDIRECT TO LOGIN PAGE (route "/")
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <h1>Create NexBank Account</h1>
        <p>Your Money Simplified</p>
      </div>

      <div className="auth-right">
        <h2>Sign Up</h2>

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

        {/* 👈 OPTIONAL: Add a link back to login */}
        <p style={{ marginTop: "20px", textAlign: "center" }}>
          Already have an account? <a href="/" className="auth-link">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;