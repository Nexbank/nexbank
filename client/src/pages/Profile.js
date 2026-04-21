import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const Profile = () => {
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/profile/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserInfo(res.data);

        // also sync edit form
        setEditForm({
          email: res.data.email,
          phone: res.data.phone,
          location: res.data.location,
        });

      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);
  const navigate = useNavigate();

  // State for user information
  const [userInfo, setUserInfo] = useState({});
  const [editForm, setEditForm] = useState({
    email: "",
    phone: "",
    location: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // State for preferences
  const [preferences, setPreferences] = useState({
    twoFactor: true,
    pushNotifications: true,
    language: "English (ZA)",
  });

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleEditClick = () => {
    setEditForm({
      email: userInfo.email || "",
      phone: userInfo.phone || "",
      location: userInfo.location || "",
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        "http://localhost:5000/api/profile/update",
        {
          phone: editForm.phone,
          location: editForm.location,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUserInfo(res.data.user);
      setEditForm(res.data.user);

      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const toggleTwoFactor = () => {
    setPreferences((prev) => ({
      ...prev,
      twoFactor: !prev.twoFactor,
    }));
  };

  const toggleNotifications = () => {
    setPreferences((prev) => ({
      ...prev,
      pushNotifications: !prev.pushNotifications,
    }));
  };

  const handleLanguageChange = () => {
    const languages = [
      "English (ZA)",
      "English (US)",
      "English (UK)",
      "Afrikaans",
      "Zulu",
    ];
    const currentIndex = languages.indexOf(preferences.language);
    const nextIndex = (currentIndex + 1) % languages.length;

    setPreferences((prev) => ({
      ...prev,
      language: languages[nextIndex],
    }));
  };
  // 

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Navbar />

        {/* 🔥 THIS FIXES YOUR SCROLL ISSUE */}
        <div className="content">
          <div className="profile-container">

            {/* Header */}
            <div className="profile-header">
              <button
                onClick={handleBackToDashboard}
                className="profile-back-btn"
              >
                ←
              </button>

              <div className="profile-avatar">
                <span>N</span>
              </div>

              <div className="profile-user-info">
                <h1>
                  Hi, {userInfo?.displayName || userInfo?.email || "User"}
                </h1>

                <p className="profile-badge">
                  Member since{" "}
                  {userInfo?.createdAt
                    ? new Date(userInfo.createdAt).getFullYear()
                    : "2024"}
                </p>

                <p className="profile-subtext">
                  your account is: Basic Account
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="profile-content">

              {/* Personal Info */}
              <div className="profile-section">
                <h2>Personal Information</h2>

                {!isEditing ? (
                  <>
                    <div className="profile-field">
                      <label>Email Address:</label>
                      <p>{userInfo.email}</p>
                    </div>

                    <div className="profile-field">
                      <label>Phone Number:</label>
                      <p>{userInfo.phone}</p>
                    </div>

                    <div className="profile-field">
                      <label>Location:</label>
                      <p>{userInfo.location}</p>
                    </div>

                    <button
                      onClick={handleEditClick}
                      className="profile-edit-btn"
                    >
                      Edit Information
                    </button>
                  </>
                ) : (
                  <>
                    <div className="profile-field">
                      <label>Email Address:</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email || ""}
                        onChange={handleInputChange}
                        className="profile-input"
                      />
                    </div>

                    <div className="profile-field">
                      <label>Phone Number:</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone || ""}
                        onChange={handleInputChange}
                        className="profile-input"
                      />
                    </div>

                    <div className="profile-field">
                      <label>Location:</label>
                      <input
                        type="text"
                        name="location"
                        value={editForm.location || ""}
                        onChange={handleInputChange}
                        className="profile-input"
                      />
                    </div>

                    <div className="profile-edit-actions">
                      <button
                        onClick={handleSave}
                        className="profile-save-btn"
                      >
                        Save Changes
                      </button>

                      <button
                        onClick={handleCancel}
                        className="profile-cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Preferences */}
              <div className="profile-section">
                <h2>Account Preferences</h2>

                <div className="profile-preference">
                  <div className="preference-info">
                    <span className="preference-name">
                      Two-Factor Authentication
                    </span>
                    <span className={`preference-status ${preferences.twoFactor ? "enabled" : "disabled"}`}>
                      {preferences.twoFactor ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <button
                    onClick={toggleTwoFactor}
                    className="preference-toggle"
                  >
                    Toggle
                  </button>
                </div>

                <div className="profile-preference">
                  <div className="preference-info">
                    <span className="preference-name">
                      Push Notifications
                    </span>
                    <span className={`preference-status ${preferences.pushNotifications ? "enabled" : "disabled"}`}>
                      {preferences.pushNotifications ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <button
                    onClick={toggleNotifications}
                    className="preference-toggle"
                  >
                    Toggle
                  </button>
                </div>

                <div className="profile-preference">
                  <div className="preference-info">
                    <span className="preference-name">Language</span>
                    <span className="preference-value">
                      {preferences.language}
                    </span>
                  </div>
                  <button
                    onClick={handleLanguageChange}
                    className="preference-toggle"
                  >
                    Change
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;