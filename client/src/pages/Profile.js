import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";

const Profile = () => {
  const navigate = useNavigate();

  // State for user information
  const [userInfo, setUserInfo] = useState({
    email: "nicholatenozwole@gmail.com",
    phone: "+27 82 123 4567",
    location: "Johannesburg, South Africa",
  });

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Temporary state for form inputs while editing
  const [editForm, setEditForm] = useState({
    email: userInfo.email,
    phone: userInfo.phone,
    location: userInfo.location,
  });

  // State for preferences
  const [preferences, setPreferences] = useState({
    twoFactor: true,
    pushNotifications: true,
    language: "English (ZA)",
  });

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Handle edit button click
  const handleEditClick = () => {
    setEditForm({
      email: userInfo.email,
      phone: userInfo.phone,
      location: userInfo.location,
    });
    setIsEditing(true);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save edited information
  const handleSave = () => {
    setUserInfo({
      email: editForm.email,
      phone: editForm.phone,
      location: editForm.location,
    });
    setIsEditing(false);
    alert("Profile information updated successfully!");
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
  };

  // Toggle preferences
  const toggleTwoFactor = () => {
    setPreferences((prev) => ({
      ...prev,
      twoFactor: !prev.twoFactor,
    }));
    alert(
      `Two-Factor Authentication ${!preferences.twoFactor ? "Enabled" : "Disabled"}`,
    );
  };

  const toggleNotifications = () => {
    setPreferences((prev) => ({
      ...prev,
      pushNotifications: !prev.pushNotifications,
    }));
    alert(
      `Push Notifications ${!preferences.pushNotifications ? "Enabled" : "Disabled"}`,
    );
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
    alert(`Language changed to ${languages[nextIndex]}`);
  };

  return (
    <div className="profile-container">
      {/* Header with Back Arrow and User Info */}
      <div className="profile-header">
        <button
          onClick={handleBackToDashboard}
          className="profile-back-btn"
          aria-label="Back to Dashboard"
        >
          ←
        </button>
        <div className="profile-avatar">
          <span>N</span>
        </div>
        <div className="profile-user-info">
          <h1>Hi, Nozwelo</h1>
          <p className="profile-badge">Premium Member since 2024</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Personal Information Section */}
        <div className="profile-section">
          <h2>Personal Information</h2>

          {!isEditing ? (
            // Display mode
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
              <button onClick={handleEditClick} className="profile-edit-btn">
                Edit Information
              </button>
            </>
          ) : (
            // Edit mode
            <>
              <div className="profile-field">
                <label>Email Address:</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Enter email"
                />
              </div>
              <div className="profile-field">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="profile-field">
                <label>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Enter location"
                />
              </div>
              <div className="profile-edit-actions">
                <button onClick={handleSave} className="profile-save-btn">
                  Save Changes
                </button>
                <button onClick={handleCancel} className="profile-cancel-btn">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* Account Preferences Section */}
        <div className="profile-section">
          <h2>Account Preferences</h2>

          <div className="profile-preference">
            <div className="preference-info">
              <span className="preference-name">Two-Factor Authentication</span>
              <span
                className={`preference-status ${preferences.twoFactor ? "enabled" : "disabled"}`}
              >
                {preferences.twoFactor ? "Enabled" : "Disabled"}
              </span>
            </div>
            <button onClick={toggleTwoFactor} className="preference-toggle">
              {preferences.twoFactor ? "Disable" : "Enable"}
            </button>
          </div>

          <div className="profile-preference">
            <div className="preference-info">
              <span className="preference-name">Push Notifications</span>
              <span
                className={`preference-status ${preferences.pushNotifications ? "enabled" : "disabled"}`}
              >
                {preferences.pushNotifications ? "Enabled" : "Disabled"}
              </span>
            </div>
            <button onClick={toggleNotifications} className="preference-toggle">
              {preferences.pushNotifications ? "Disable" : "Enable"}
            </button>
          </div>

          <div className="profile-preference">
            <div className="preference-info">
              <span className="preference-name">Language</span>
              <span className="preference-value">{preferences.language}</span>
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
  );
};

export default Profile;
