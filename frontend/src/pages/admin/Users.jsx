import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import "./Users.css";

const Users = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [lockType, setLockType] = useState("temporary");
  const [lockDuration, setLockDuration] = useState("15");
  const [lockLoading, setLockLoading] = useState(false);

  // =========================================================
  // AUTH
  // =========================================================

  const token = localStorage.getItem("token");

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    currentUser = null;
  }

  // =========================================================
  // GET USER ID
  // =========================================================

  const getUserId = (user) => {
    return user?.id || user?._id;
  };

  // =========================================================
  // NORMALIZE ROLE
  // =========================================================

  const normalizeRole = (role) => {
    if (!role) return "user";

    return String(role).toLowerCase() === "admin"
      ? "admin"
      : "user";
  };

  // =========================================================
  // GET USER STATUS
  // =========================================================

  const getUserStatus = (user) => {
    // Use backend status if available
    if (user?.status) {
      const status = String(user.status).toLowerCase();

      if (
        status.includes("temporary") ||
        status.includes("temp")
      ) {
        return "temporary";
      }

      if (
        status.includes("permanent") ||
        status.includes("blocked")
      ) {
        return "permanent";
      }

      if (status.includes("active")) {
        return "active";
      }
    }

    // Permanent block
    if (user?.isBlocked === true && !user?.lockUntil) {
      return "permanent";
    }

    // Temporary block
    if (
      user?.lockUntil &&
      new Date(user.lockUntil).getTime() > Date.now()
    ) {
      return "temporary";
    }

    return "active";
  };

  // =========================================================
  // CHECK CURRENT USER
  // =========================================================

  const isCurrentUser = (user) => {
    const currentId =
      currentUser?.id || currentUser?._id;

    const userId = getUserId(user);

    return (
      currentId &&
      userId &&
      String(currentId) === String(userId)
    );
  };

  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch users."
        );
      }

      const userList = Array.isArray(data)
        ? data
        : data?.users || [];

      setUsers(userList);
    } catch (err) {
      console.error("Fetch users error:", err);

      setError(
        err.message ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================================================
  // ROLE COUNTS
  // =========================================================

  const totalAdmins = users.filter(
    (user) => normalizeRole(user.role) === "admin"
  ).length;

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => getUserStatus(user) === "active"
  ).length;

  const lockedUsers = users.filter((user) => {
    const status = getUserStatus(user);

    return (
      status === "temporary" ||
      status === "permanent"
    );
  }).length;

  // =========================================================
  // CHANGE ROLE
  // =========================================================

  const handleRoleChange = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    // Cannot change locked user's role
    if (getUserStatus(user) !== "active") {
      alert(
        "Locked users cannot have their role changed."
      );
      return;
    }

    // Cannot change own role
    if (isCurrentUser(user)) {
      alert("You cannot change your own role.");
      return;
    }

    const currentRole = normalizeRole(user.role);

    const newRole =
      currentRole === "admin"
        ? "user"
        : "admin";

    // Cannot demote the last admin
    if (
      currentRole === "admin" &&
      totalAdmins <= 1
    ) {
      alert(
        "The last administrator cannot be demoted."
      );
      return;
    }

    const actionText =
      newRole === "admin"
        ? "make this user an administrator"
        : "change this administrator to a normal user";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to change user role."
        );
      }

      alert(
        newRole === "admin"
          ? "User is now an administrator."
          : "Administrator changed to normal user."
      );

      await fetchUsers();
    } catch (err) {
      console.error("Role change error:", err);

      alert(
        err.message ||
          "Unable to change user role."
      );
    }
  };

  // =========================================================
  // OPEN LOCK MODAL
  // =========================================================

  const openLockModal = (user) => {
    if (!user) return;

    if (isCurrentUser(user)) {
      alert("You cannot lock your own account.");
      return;
    }

    if (getUserStatus(user) !== "active") {
      alert("This user is already locked.");
      return;
    }

    setSelectedUser(user);
    setLockType("temporary");
    setLockDuration("15");
    setShowLockModal(true);
  };

  // =========================================================
  // CLOSE LOCK MODAL
  // =========================================================

  const closeLockModal = () => {
    if (lockLoading) return;

    setShowLockModal(false);
    setSelectedUser(null);
    setLockType("temporary");
    setLockDuration("15");
  };

  // =========================================================
  // APPLY LOCK
  // =========================================================

  const handleLockUser = async () => {
    if (!selectedUser) return;

    const userId = getUserId(selectedUser);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (isCurrentUser(selectedUser)) {
      alert("You cannot lock your own account.");
      return;
    }

    try {
      setLockLoading(true);
      setError("");

      let endpoint = "";
      let body = {};

      // -----------------------------------------------------
      // TEMPORARY LOCK
      // -----------------------------------------------------

      if (lockType === "temporary") {
        endpoint = `/temporary-lock`;

        body = {
          minutes: Number(lockDuration),
        };
      }

      // -----------------------------------------------------
      // PERMANENT LOCK
      // -----------------------------------------------------

      if (lockType === "permanent") {
        endpoint = `/lock`;

        body = {};
      }

      const response = await fetch(
        `http://localhost:5000/api/users/${userId}${endpoint}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to lock user."
        );
      }

      alert(
        lockType === "temporary"
          ? "User has been temporarily locked."
          : "User has been permanently locked."
      );

      closeLockModal();

      await fetchUsers();
    } catch (err) {
      console.error("Lock user error:", err);

      alert(
        err.message ||
          "Unable to lock this user."
      );
    } finally {
      setLockLoading(false);
    }
  };

  // =========================================================
  // REMOVE TEMPORARY LOCK
  // =========================================================

  const handleRemoveTemporaryLock = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (isCurrentUser(user)) {
      alert(
        "You cannot change your own account status."
      );
      return;
    }

    const confirmed = window.confirm(
      "Remove the temporary lock from this user?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}/remove-temporary-lock`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to remove temporary lock."
        );
      }

      alert("Temporary lock removed.");

      await fetchUsers();
    } catch (err) {
      console.error(
        "Remove temporary lock error:",
        err
      );

      alert(
        err.message ||
          "Unable to remove temporary lock."
      );
    }
  };

  // =========================================================
  // REMOVE PERMANENT LOCK
  // =========================================================

  const handleUnlockPermanent = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (isCurrentUser(user)) {
      alert(
        "You cannot change your own account status."
      );
      return;
    }

    const confirmed = window.confirm(
      "Unlock this permanently blocked user?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}/lock`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unlock: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to unlock user."
        );
      }

      alert("Permanent lock removed.");

      await fetchUsers();
    } catch (err) {
      console.error(
        "Permanent unlock error:",
        err
      );

      alert(
        err.message ||
          "Unable to unlock this user."
      );
    }
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDeleteUser = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      alert("User ID not found.");
      return;
    }

    if (isCurrentUser(user)) {
      alert("You cannot delete your own account.");
      return;
    }

    if (getUserStatus(user) !== "active") {
      alert(
        "Locked users cannot be deleted. Unlock the user first."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        user.name || user.email || "this user"
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete user."
        );
      }

      alert("User deleted successfully.");

      await fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);

      alert(
        err.message ||
          "Unable to delete this user."
      );
    }
  };

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = (status) => {
    if (status === "temporary") {
      return "Temporarily Locked";
    }

    if (status === "permanent") {
      return "Permanently Locked";
    }

    return "Active";
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "temporary") {
      return "temporary-locked";
    }

    if (status === "permanent") {
      return "permanent-locked";
    }

    return "active";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AdminLayout>
      <div className="users-page">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="admin-header">

          <div>
            <p className="admin-breadcrumb">
              ADMINISTRATION / USER MANAGEMENT
            </p>

            <h1>User Management</h1>

            <p>
              Manage user accounts, roles and account
              security status.
            </p>
          </div>

          <div className="admin-status">
            <span></span>
            System Secure
          </div>

        </header>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="admin-error">
            <strong>Something went wrong</strong>

            <p>{error}</p>
          </div>
        )}


        {/* ===================================================
            STATISTICS
        =================================================== */}

        <section className="admin-stats-grid">

          {/* TOTAL USERS */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon blue">
              👥
            </div>

            <div>
              <p>TOTAL USERS</p>

              <h3>{totalUsers}</h3>

              <span>Registered accounts</span>
            </div>

          </div>


          {/* ADMINISTRATORS */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon purple">
              🛡
            </div>

            <div>
              <p>ADMINISTRATORS</p>

              <h3>{totalAdmins}</h3>

              <span>Admin accounts</span>
            </div>

          </div>


          {/* ACTIVE */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon green">
              ✓
            </div>

            <div>
              <p>ACTIVE USERS</p>

              <h3>{activeUsers}</h3>

              <span>Currently active</span>
            </div>

          </div>


          {/* LOCKED */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon red">
              🔒
            </div>

            <div>
              <p>LOCKED USERS</p>

              <h3>{lockedUsers}</h3>

              <span>Temporary or permanent</span>
            </div>

          </div>


          {/* USER ACCOUNTS */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon orange">
              👤
            </div>

            <div>
              <p>NORMAL USERS</p>

              <h3>
                {totalUsers - totalAdmins}
              </h3>

              <span>Standard accounts</span>
            </div>

          </div>

        </section>


        {/* ===================================================
            USERS MANAGEMENT CARD
        =================================================== */}

        <section className="users-management-card">

          <div className="events-header">

            <div>
              <h2>All Users</h2>

              <p>
                View and manage registered SecurePulse
                accounts.
              </p>
            </div>

            <button
              type="button"
              className="view-events-button"
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

          </div>


          {/* =================================================
              TABLE
          ================================================= */}

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
              <table className="users-table">

                <thead>
                  <tr>
                    <th>USER</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>CREATED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>

                  {users.map((user) => {

                    const userId = getUserId(user);

                    const role =
                      normalizeRole(user.role);

                    const status =
                      getUserStatus(user);

                    const self =
                      isCurrentUser(user);

                    return (
                      <tr key={userId || user.email}>

                        {/* USER */}

                        <td>

                          <div className="user-table-name">

                            <div className="user-avatar">
                              {(
                                user.name ||
                                user.email ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {user.name ||
                                  "Unnamed User"}
                              </strong>

                              {self && (
                                <small>
                                  Your Account
                                </small>
                              )}

                            </div>

                          </div>

                        </td>


                        {/* EMAIL */}

                        <td>
                          {user.email || "—"}
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
                            className={`user-status ${getStatusClass(
                              status
                            )}`}
                          >
                            <span></span>

                            {getStatusLabel(status)}
                          </span>

                        </td>


                        {/* CREATED */}

                        <td>
                          {user.createdAt
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>


                        {/* ACTIONS */}

                        <td>

                          {self ? (
                            <span className="self-label">
                              No actions
                            </span>
                          ) : (
                            <div className="user-actions">

                              {/* =================================
                                  TEMPORARY LOCKED
                              ================================= */}

                              {status ===
                                "temporary" && (
                                <button
                                  type="button"
                                  className="action-button unlock-button"
                                  onClick={() =>
                                    handleRemoveTemporaryLock(
                                      user
                                    )
                                  }
                                >
                                  Remove Lock
                                </button>
                              )}


                              {/* =================================
                                  PERMANENTLY LOCKED
                              ================================= */}

                              {status ===
                                "permanent" && (
                                <button
                                  type="button"
                                  className="action-button unlock-button"
                                  onClick={() =>
                                    handleUnlockPermanent(
                                      user
                                    )
                                  }
                                >
                                  Unlock
                                </button>
                              )}


                              {/* =================================
                                  ACTIVE USER
                              ================================= */}

                              {status === "active" && (
                                <>
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

                                  <button
                                    type="button"
                                    className="action-button temporary-lock-button"
                                    onClick={() =>
                                      openLockModal(
                                        user
                                      )
                                    }
                                  >
                                    Lock
                                  </button>

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
                                </>
                              )}

                            </div>
                          )}

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>
            )}

          </div>

        </section>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="admin-footer">

          <span>
            SecurePulse Security Center
          </span>

          <span>
            User Management
          </span>

        </footer>


        {/* ===================================================
            LOCK MODAL
        =================================================== */}

        {showLockModal && selectedUser && (
          <div
            className="lock-modal-overlay"
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeLockModal();
              }
            }}
          >

            <div className="lock-modal">

              {/* MODAL HEADER */}

              <div className="lock-modal-header">

                <div>

                  <h2>
                    {lockType === "temporary"
                      ? "Temporary Lock"
                      : "Permanent Lock"}
                  </h2>

                  <p>
                    Lock account:{" "}
                    <strong>
                      {selectedUser.name ||
                        selectedUser.email}
                    </strong>
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close-button"
                  onClick={closeLockModal}
                  disabled={lockLoading}
                  aria-label="Close"
                >
                  ×
                </button>

              </div>


              {/* MODAL BODY */}

              <div className="lock-modal-body">

                <label>
                  Lock Type
                </label>

                <select
                  value={lockType}
                  onChange={(event) =>
                    setLockType(
                      event.target.value
                    )
                  }
                  disabled={lockLoading}
                >
                  <option value="temporary">
                    Temporary Lock
                  </option>

                  <option value="permanent">
                    Permanent Lock
                  </option>
                </select>


                {/* TEMPORARY DURATION */}

                {lockType === "temporary" && (
                  <div
                    style={{
                      marginTop: "18px",
                    }}
                  >

                    <label>
                      Lock Duration
                    </label>

                    <select
                      value={lockDuration}
                      onChange={(event) =>
                        setLockDuration(
                          event.target.value
                        )
                      }
                      disabled={lockLoading}
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
                )}


                {/* PERMANENT WARNING */}

                {lockType === "permanent" && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: "10px",
                      color: "#9f1239",
                      fontSize: "12px",
                      lineHeight: "1.5",
                    }}
                  >
                    <strong>
                      Permanent Lock
                    </strong>

                    <br />

                    This account will remain blocked
                    until an administrator manually
                    unlocks it.
                  </div>
                )}

              </div>


              {/* MODAL ACTIONS */}

              <div className="lock-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={closeLockModal}
                  disabled={lockLoading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="modal-confirm-button"
                  onClick={handleLockUser}
                  disabled={lockLoading}
                >
                  {lockLoading
                    ? "Processing..."
                    : lockType === "temporary"
                    ? "Temporarily Lock"
                    : "Permanently Lock"}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Users;