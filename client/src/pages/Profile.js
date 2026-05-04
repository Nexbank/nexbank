import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/global.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useAccount } from "../context/AccountContext";

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const Profile = ({ search, setSearch, searchResults }) => {
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/profile/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserInfo(res.data);
        setEditForm({
          email: res.data.email || "",
          phone: res.data.phone || "",
          location: res.data.location || "",
        });
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);
  const navigate = useNavigate();
  const { accounts, selectedAccount } = useAccount();

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
  const activeAccounts = accounts.filter(
    (account) => account && account.status !== "closed" && account.isActive !== false
  );
  // 🔹 UI Consistency
  // Profile separates customer membership from banking products by reading the live active-account state from AccountContext.
  const primaryAccount = selectedAccount || activeAccounts[0] || null;
  const primaryAccountName = primaryAccount?.name || "No active banking account yet.";
  const primaryAccountType = primaryAccount?.accountType
    ? humanizeValue(primaryAccount.accountType)
    : "—";
  const activeProductsCount = activeAccounts.length;

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
  try {
    const token = localStorage.getItem("token");

    // Include email in the update
    const res = await axios.put(
      "http://localhost:5000/api/profile/update",
      {
        email: editForm.email,     // Add this
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
    setEditForm({
      email: res.data.user.email,
      phone: res.data.user.phone,
      location: res.data.user.location,
    });

    // Update localStorage with new user data
    localStorage.setItem("user", JSON.stringify(res.data.user));
    
    // Also update token if email changed (if your token includes email)
    // You might need to re-login or refresh token here

    setIsEditing(false);
    alert("Profile updated successfully!");
  } catch (error) {
    console.error(error);
    alert(error.response?.data?.error || "Update failed");
  }
};

  const handleCancel = () => {
    setEditForm({
      email: userInfo.email || "",
      phone: userInfo.phone || "",
      location: userInfo.location || "",
    });
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
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} />

        <div className="content">
          <div className="profile-container">
            <div className="profile-header">
              <button
                onClick={handleBackToDashboard}
                className="back-btn"
              >
                Back
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

                <div className="profile-subtext">
                  <p>Customer tier: Premium Member</p>
                  <p>Primary account: {primaryAccountName}</p>
                  <p>Account type: {primaryAccountType}</p>
                  <p>Active products: {activeProductsCount}</p>
                </div>
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

              <div className="profile-section">
                <h2>Account Preferences</h2>

                <div className="profile-preference">
                  <div className="preference-info">
                    <span className="preference-name">
                      Two-Factor Authentication
                    </span>
                    <span
                      className={`preference-status ${
                        preferences.twoFactor ? "enabled" : "disabled"
                      }`}
                    >
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
                    <span
                      className={`preference-status ${
                        preferences.pushNotifications ? "enabled" : "disabled"
                      }`}
                    >
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
