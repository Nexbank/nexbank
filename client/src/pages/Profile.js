import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useNotification } from "../components/Notification";

const Profile = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [userInfo, setUserInfo] = useState({
    email: "nicholatenozwole@gmail.com",
    phone: "+27 82 123 4567",
    location: "Johannesburg, South Africa",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: userInfo.email,
    phone: userInfo.phone,
    location: userInfo.location,
  });

  const [preferences, setPreferences] = useState({
    twoFactor: true,
    pushNotifications: true,
    language: "English (ZA)",
  });

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleEditClick = () => {
    setEditForm({ ...userInfo });
    setIsEditing(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setUserInfo({ ...editForm });
    setIsEditing(false);
    showNotification("success", "Profile information updated successfully.", {
      title: "Profile Updated",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    showNotification("info", "Profile changes were discarded.", {
      title: "Edit Cancelled",
      duration: 3200,
    });
  };

  const toggleTwoFactor = () => {
    setPreferences((prev) => {
      const nextValue = !prev.twoFactor;

      showNotification(
        nextValue ? "warning" : "info",
        nextValue
          ? "Two-factor authentication has been enabled for stronger account protection."
          : "Two-factor authentication has been disabled. Your account is less protected.",
        {
          title: nextValue ? "Security Upgraded" : "Security Changed",
          duration: 6500,
        }
      );

      return {
        ...prev,
        twoFactor: nextValue,
      };
    });
  };

  const toggleNotifications = () => {
    setPreferences((prev) => {
      const nextValue = !prev.pushNotifications;

      showNotification(
        nextValue ? "success" : "info",
        nextValue
          ? "Push notifications are enabled. You will receive account alerts again."
          : "Push notifications are paused. Critical security alerts should still be reviewed regularly.",
        {
          title: nextValue ? "Notifications Enabled" : "Notifications Paused",
        }
      );

      return {
        ...prev,
        pushNotifications: nextValue,
      };
    });
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
    const nextLanguage = languages[nextIndex];

    setPreferences((prev) => ({
      ...prev,
      language: nextLanguage,
    }));

    showNotification("info", `App language switched to ${nextLanguage}.`, {
      title: "Language Updated",
    });
  };

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <div className="profile-container">
            <div className="profile-header">
              <button
                onClick={handleBackToDashboard}
                className="profile-back-btn"
              >
                Back
              </button>

              <div className="profile-avatar">
                <span>N</span>
              </div>

              <div className="profile-user-info">
                <h1>Hi, Nozwelo</h1>
                <p className="profile-badge">
                  Premium Member since 2024
                </p>
              </div>
            </div>

            <div className="profile-content">
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
                        value={editForm.email}
                        onChange={handleInputChange}
                        className="profile-input"
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
