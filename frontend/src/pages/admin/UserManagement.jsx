import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";
import "./Users.css";

const UserManagement = () => {
  // ============================================
  // STATE
  // ============================================

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  const [showTemporaryLock, setShowTemporaryLock] =
    useState(false);

  const [temporaryDuration, setTemporaryDuration] =
    useState("15");

  // ============================================
  // CURRENT ADMIN
  // ============================================

  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Unable to read current user:", error);
      return null;
    }
  };

  const currentUser = getCurrentUser();

  const currentUserId =
    currentUser?._id || currentUser?.id || "";

  // ============================================
  // GET USER ID
  // ============================================

  const getUserId = (user) => {
    return user?._id || user?.id || "";
  };

  // ============================================
  // GET USER NAME
  // ============================================

  const getUserName = (user) => {
    return (
      user?.name ||
      user?.fullName ||
      user?.username ||
      user?.email?.split("@")[0] ||
      "Unknown User"
    );
  };

  // ============================================
  // GET USER ROLE
  // ============================================

  const getUserRole = (user) => {
    return user?.role || "user";
  };

  // ============================================
  // CHECK TEMPORARY LOCK
  // ============================================

  const isTemporarilyLocked = (user) => {
    if (!user?.lockUntil) {
      return false;
    }

    const lockUntil = new Date(user.lockUntil);

    return (
      !Number.isNaN(lockUntil.getTime()) &&
      lockUntil.getTime() > Date.now()
    );
  };

  // ============================================
  // CHECK PERMANENT LOCK
  // ============================================

  const isPermanentlyLocked = (user) => {
    return (
      user?.isBlocked === true &&
      !isTemporarilyLocked(user)
    );
  };

  // ============================================
  // GET USER STATUS
  // ============================================

  const getUserStatus = (user) => {
    if (isTemporarilyLocked(user)) {
      return {
        text: "Temporarily Locked",
        className: "temporary-locked",
      };
    }

    if (isPermanentlyLocked(user)) {
      return {
        text: "Permanently Locked",
        className: "permanent-locked",
      };
    }

    return {
      text: "Active",
      className: "active",
    };
  };

  // ============================================
  // FORMAT DATE
  // ============================================

  const formatDate = (date) => {
    if (!date) {
      return "Never";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat("en-LK", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(parsedDate);
  };

  // ============================================
  // FETCH USERS
  // ============================================

  const fetchUsers = async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/users");

      console.log("Users response:", response.data);

      const data = response.data;

      let usersData = [];

      if (Array.isArray(data)) {
        usersData = data;
      } else if (Array.isArray(data.users)) {
        usersData = data.users;
      } else if (Array.isArray(data.data)) {
        usersData = data.data;
      } else if (Array.isArray(data.results)) {
        usersData = data.results;
      }

      setUsers(usersData);
    } catch (error) {
      console.error("Fetch users error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load users.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // ============================================
  // PERMANENT LOCK
  // ============================================

  const handlePermanentLock = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (userId === currentUserId) {
      alert("You cannot permanently lock your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Permanently block ${getUserName(
        user
      )}?\n\nThis user will remain blocked until an administrator unlocks the account.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/lock`);

      alert("User permanently blocked successfully.");

      await fetchUsers(true);
    } catch (error) {
      console.error("Permanent lock error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to permanently block user."
      );
    }
  };

  // ============================================
  // OPEN TEMPORARY LOCK MODAL
  // ============================================

  const openTemporaryLock = (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (userId === currentUserId) {
      alert("You cannot temporarily lock your own account.");
      return;
    }

    setSelectedUser(user);
    setTemporaryDuration("15");
    setShowTemporaryLock(true);
  };

  // ============================================
  // CLOSE TEMPORARY LOCK MODAL
  // ============================================

  const closeTemporaryLock = () => {
    setSelectedUser(null);
    setShowTemporaryLock(false);
    setTemporaryDuration("15");
  };

  // ============================================
  // APPLY TEMPORARY LOCK
  // ============================================

  const handleTemporaryLock = async () => {
    if (!selectedUser) {
      return;
    }

    const userId = getUserId(selectedUser);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    try {
      await api.patch(
        `/users/${userId}/temporary-lock`,
        {
          duration: Number(temporaryDuration),
        }
      );

      alert(
        `User temporarily locked for ${temporaryDuration} minutes.`
      );

      closeTemporaryLock();

      await fetchUsers(true);
    } catch (error) {
      console.error("Temporary lock error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to temporarily lock user."
      );
    }
  };

  // ============================================
  // REMOVE TEMPORARY LOCK
  // ============================================

  const handleRemoveTemporaryLock = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    try {
      await api.patch(
        `/users/${userId}/remove-temporary-lock`
      );

      alert("Temporary lock removed successfully.");

      await fetchUsers(true);
    } catch (error) {
      console.error(
        "Remove temporary lock error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to remove temporary lock."
      );
    }
  };

  // ============================================
  // PERMANENT UNLOCK
  // ============================================

  const handlePermanentUnlock = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    const confirmed = window.confirm(
      `Unlock ${getUserName(
        user
      )} and make the account active?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/lock`, {
        isBlocked: false,
      });

      alert("User unlocked successfully.");

      await fetchUsers(true);
    } catch (error) {
      console.error("Permanent unlock error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to unlock user."
      );
    }
  };

  // ============================================
  // CHANGE ROLE
  // ============================================

  const handleRoleChange = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (userId === currentUserId) {
      alert("You cannot change your own administrator role.");
      return;
    }

    const currentRole = getUserRole(user);

    const newRole =
      currentRole === "admin" ? "user" : "admin";

    const roleName =
      newRole === "admin" ? "Administrator" : "User";

    const confirmed = window.confirm(
      `Change ${getUserName(
        user
      )}'s role to ${roleName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/role`, {
        role: newRole,
      });

      alert(`User role changed to ${roleName}.`);

      await fetchUsers(true);
    } catch (error) {
      console.error("Role change error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to change user role."
      );
    }
  };

  // ============================================
  // DELETE USER
  // ============================================

  const handleDeleteUser = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (userId === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${getUserName(
        user
      )} permanently?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);

      alert("User deleted successfully.");

      await fetchUsers(true);
    } catch (error) {
      console.error("Delete user error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to delete user."
      );
    }
  };

  // ============================================
  // STATISTICS
  // ============================================

  const totalUsers = users.length;

  const adminUsers = users.filter(
    (user) => getUserRole(user) === "admin"
  ).length;

  const temporaryLockedUsers = users.filter(
    (user) => isTemporarilyLocked(user)
  ).length;

  const permanentLockedUsers = users.filter(
    (user) => isPermanentlyLocked(user)
  ).length;

  const activeUsers =
    totalUsers -
    temporaryLockedUsers -
    permanentLockedUsers;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="securepulse-admin-app">
      <Sidebar />

      <main className="admin-main-content">
        {/* ========================================
            HEADER
        ======================================== */}

        <header className="admin-header">
          <div>
            <p className="admin-breadcrumb">
              SECURITY CENTER / USERS
            </p>

            <h1>User Management</h1>

            <p>
              Manage accounts, roles and user security
              status.
            </p>
          </div>

          <div className="admin-status">
            <span></span>
            System Online
          </div>
        </header>

        {/* ========================================
            ERROR
        ======================================== */}

        {error && (
          <div className="admin-error" role="alert">
            <strong>Unable to load users</strong>
            <p>{error}</p>
          </div>
        )}

        {/* ========================================
            STATISTICS
        ======================================== */}

        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              👥
            </div>

            <div>
              <p>TOTAL USERS</p>
              <h3>
                {loading ? "..." : totalUsers}
              </h3>
              <span>Registered accounts</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              ✓
            </div>

            <div>
              <p>ACTIVE USERS</p>
              <h3>
                {loading ? "..." : activeUsers}
              </h3>
              <span>Active accounts</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon purple">
              🔐
            </div>

            <div>
              <p>ADMINISTRATORS</p>
              <h3>
                {loading ? "..." : adminUsers}
              </h3>
              <span>Admin accounts</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon orange">
              ⏱
            </div>

            <div>
              <p>TEMPORARY LOCKS</p>
              <h3>
                {loading
                  ? "..."
                  : temporaryLockedUsers}
              </h3>
              <span>Temporarily locked</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon red">
              🔒
            </div>

            <div>
              <p>PERMANENT LOCKS</p>
              <h3>
                {loading
                  ? "..."
                  : permanentLockedUsers}
              </h3>
              <span>Permanently blocked</span>
            </div>
          </div>
        </section>

        {/* ========================================
            USERS TABLE
        ======================================== */}

        <section className="events-card users-management-card">
          <div className="events-header">
            <div>
              <h2>All Users</h2>

              <p>
                Manage user accounts and security
                permissions.
              </p>
            </div>

            <button
              className="view-events-button"
              type="button"
              onClick={() => fetchUsers(true)}
              disabled={loading || refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          <div className="events-table-container">
            {loading ? (
              <div className="events-message">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="events-message">
                No users found.
              </div>
            ) : (
              <table className="events-table users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const userId = getUserId(user);

                    const status =
                      getUserStatus(user);

                    const isSelf =
                      userId === currentUserId;

                    const role = getUserRole(user);

                    return (
                      <tr key={userId}>
                        {/* USER */}
                        <td>
                          <div className="user-table-name">
                            <div className="user-avatar">
                              {getUserName(user)
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {getUserName(user)}
                              </strong>

                              {isSelf && (
                                <small>
                                  You
                                </small>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td>
                          {user.email || "Unknown"}
                        </td>

                        {/* ROLE */}
                        <td>
                          <span
                            className={`role-badge ${
                              role === "admin"
                                ? "admin-role"
                                : "user-role"
                            }`}
                          >
                            {role === "admin"
                              ? "Administrator"
                              : "User"}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={`user-status ${status.className}`}
                          >
                            <span></span>
                            {status.text}
                          </span>
                        </td>

                        {/* CREATED */}
                        <td>
                          {formatDate(
                            user.createdAt
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="user-actions">
                            {/* TEMPORARY UNLOCK */}
                            {isTemporarilyLocked(
                              user
                            ) && (
                              <button
                                type="button"
                                className="action-button unlock-button"
                                onClick={() =>
                                  handleRemoveTemporaryLock(
                                    user
                                  )
                                }
                              >
                                Unlock Temp
                              </button>
                            )}

                            {/* PERMANENT UNLOCK */}
                            {isPermanentlyLocked(
                              user
                            ) && (
                              <button
                                type="button"
                                className="action-button unlock-button"
                                onClick={() =>
                                  handlePermanentUnlock(
                                    user
                                  )
                                }
                              >
                                Unlock
                              </button>
                            )}

                            {/* TEMPORARY LOCK */}
                            {!isSelf &&
                              !isTemporarilyLocked(
                                user
                              ) &&
                              !isPermanentlyLocked(
                                user
                              ) && (
                                <button
                                  type="button"
                                  className="action-button temporary-lock-button"
                                  onClick={() =>
                                    openTemporaryLock(
                                      user
                                    )
                                  }
                                >
                                  Temp Lock
                                </button>
                              )}

                            {/* PERMANENT LOCK */}
                            {!isSelf &&
                              !isPermanentlyLocked(
                                user
                              ) && (
                                <button
                                  type="button"
                                  className="action-button permanent-lock-button"
                                  onClick={() =>
                                    handlePermanentLock(
                                      user
                                    )
                                  }
                                >
                                  Permanent Lock
                                </button>
                              )}

                            {/* ROLE */}
                            {!isSelf && (
                              <button
                                type="button"
                                className="action-button role-button"
                                onClick={() =>
                                  handleRoleChange(
                                    user
                                  )
                                }
                              >
                                {role === "admin"
                                  ? "Make User"
                                  : "Make Admin"}
                              </button>
                            )}

                            {/* DELETE */}
                            {!isSelf && (
                              <button
                                type="button"
                                className="action-button delete-button"
                                onClick={() =>
                                  handleDeleteUser(
                                    user
                                  )
                                }
                              >
                                Delete
                              </button>
                            )}

                            {/* SELF */}
                            {isSelf && (
                              <span className="self-label">
                                Your Account
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ========================================
            FOOTER
        ======================================== */}

        <footer className="admin-footer">
          <span>
            SecurePulse Security System
          </span>

          <span>
            User Management Active
          </span>
        </footer>
      </main>

      {/* ==========================================
          TEMPORARY LOCK MODAL
      ========================================== */}

      {showTemporaryLock && selectedUser && (
        <div
          className="lock-modal-overlay"
          onClick={closeTemporaryLock}
        >
          <div
            className="lock-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="lock-modal-header">
              <div>
                <h2>Temporary Lock</h2>

                <p>
                  Lock{" "}
                  <strong>
                    {getUserName(selectedUser)}
                  </strong>{" "}
                  temporarily.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeTemporaryLock}
              >
                ×
              </button>
            </div>

            <div className="lock-modal-body">
              <label htmlFor="temporaryDuration">
                Lock Duration
              </label>

              <select
                id="temporaryDuration"
                value={temporaryDuration}
                onChange={(event) =>
                  setTemporaryDuration(
                    event.target.value
                  )
                }
              >
                <option value="15">
                  15 Minutes
                </option>

                <option value="30">
                  30 Minutes
                </option>

                <option value="60">
                  1 Hour
                </option>

                <option value="360">
                  6 Hours
                </option>

                <option value="720">
                  12 Hours
                </option>

                <option value="1440">
                  24 Hours
                </option>
              </select>
            </div>

            <div className="lock-modal-actions">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={closeTemporaryLock}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-confirm-button"
                onClick={handleTemporaryLock}
              >
                Confirm Temporary Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;