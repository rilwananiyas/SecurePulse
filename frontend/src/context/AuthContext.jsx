import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // CHECK EXISTING SESSION
  // ==================================================

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token");

      console.log("=================================");
      console.log("AUTH CONTEXT STARTUP");
      console.log(
        "Startup token:",
        token ? "TOKEN FOUND" : "TOKEN NOT FOUND"
      );
      console.log("=================================");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();

        console.log("AUTH ME RESPONSE:", data);

        const currentUser =
          data?.user || data;

        if (currentUser) {
          setUser(currentUser);

          console.log(
            "SESSION RESTORED:",
            currentUser
          );

          console.log(
            "SESSION ROLE:",
            currentUser.role
          );
        } else {
          console.warn(
            "AUTH ME returned no user."
          );

          setUser(null);
        }
      } catch (error) {
        console.error(
          "AUTH ME SESSION ERROR:",
          error
        );

        console.log(
          "AUTH ME STATUS:",
          error?.response?.status
        );

        /*
         * IMPORTANT:
         * DO NOT REMOVE TOKEN HERE.
         *
         * We are keeping the token temporarily so
         * we can identify the actual authentication
         * problem.
         */

        const existingToken =
          localStorage.getItem("token");

        console.log(
          "TOKEN AFTER AUTH ME ERROR:",
          existingToken
            ? "TOKEN STILL EXISTS"
            : "TOKEN NOT FOUND"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ==================================================
  // REGISTER
  // ==================================================

  const register = async (userData) => {
    const data = await registerUser(userData);

    return data;
  };

  // ==================================================
  // LOGIN
  // ==================================================

  const login = async (userData) => {
    console.log("=================================");
    console.log("AUTH CONTEXT LOGIN STARTED");
    console.log("EMAIL:", userData.email);
    console.log("=================================");

    try {
      // ----------------------------------------------
      // CALL LOGIN API
      // ----------------------------------------------

      const data = await loginUser(userData);

      console.log(
        "AUTH CONTEXT LOGIN RESPONSE:",
        data
      );

      // ----------------------------------------------
      // CHECK TOKEN
      // ----------------------------------------------

      if (!data?.token) {
        console.error(
          "LOGIN RESPONSE DOES NOT CONTAIN TOKEN"
        );

        console.error(
          "FULL LOGIN RESPONSE:",
          data
        );

        throw new Error(
          "Login response does not contain a token."
        );
      }

      console.log(
        "LOGIN TOKEN RECEIVED"
      );

      // ----------------------------------------------
      // SAVE TOKEN
      // ----------------------------------------------

      localStorage.setItem(
        "token",
        data.token
      );

      console.log(
        "JWT TOKEN SAVED"
      );

      // ----------------------------------------------
      // VERIFY TOKEN EXISTS
      // ----------------------------------------------

      const savedToken =
        localStorage.getItem("token");

      console.log(
        "TOKEN AFTER SAVE:",
        savedToken
          ? "TOKEN FOUND"
          : "TOKEN NOT FOUND"
      );

      if (!savedToken) {
        throw new Error(
          "JWT token could not be saved to localStorage."
        );
      }

      // ----------------------------------------------
      // GET CURRENT USER
      // ----------------------------------------------

      try {
        const currentUserResponse =
          await getCurrentUser();

        console.log(
          "CURRENT USER RESPONSE:",
          currentUserResponse
        );

        const currentUser =
          currentUserResponse?.user ||
          currentUserResponse;

        if (currentUser) {
          setUser(currentUser);

          console.log(
            "AUTHENTICATED USER:",
            currentUser
          );

          console.log(
            "AUTHENTICATED ROLE:",
            currentUser.role
          );
        } else {
          console.warn(
            "CURRENT USER RESPONSE HAS NO USER"
          );
        }
      } catch (profileError) {
        /*
         * IMPORTANT:
         * Do NOT delete the token if /auth/me fails.
         */

        console.error(
          "CURRENT USER REQUEST FAILED:",
          profileError
        );

        console.log(
          "CURRENT USER STATUS:",
          profileError?.response?.status
        );

        const tokenStillExists =
          localStorage.getItem("token");

        console.log(
          "TOKEN AFTER CURRENT USER ERROR:",
          tokenStillExists
            ? "TOKEN STILL EXISTS"
            : "TOKEN NOT FOUND"
        );
      }

      // ----------------------------------------------
      // FINAL TOKEN CHECK
      // ----------------------------------------------

      const finalToken =
        localStorage.getItem("token");

      console.log("=================================");
      console.log(
        "FINAL TOKEN STATUS:",
        finalToken
          ? "TOKEN FOUND"
          : "TOKEN NOT FOUND"
      );
      console.log("LOGIN COMPLETED");
      console.log("=================================");

      return {
        ...data,
        user: data?.user || null,
      };
    } catch (error) {
      console.error(
        "AUTH CONTEXT LOGIN ERROR:",
        error
      );

      throw error;
    }
  };

  // ==================================================
  // LOGOUT
  // ==================================================

  const logout = () => {
    console.log(
      "LOGOUT - REMOVING TOKEN"
    );

    localStorage.removeItem("token");

    setUser(null);
  };

  // ==================================================
  // PROVIDER
  // ==================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==================================================
// USE AUTH
// ==================================================

export const useAuth = () => {
  return useContext(AuthContext);
};