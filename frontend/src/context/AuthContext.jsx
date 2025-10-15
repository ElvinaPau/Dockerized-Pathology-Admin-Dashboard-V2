import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Always send cookies with requests
  axios.defaults.withCredentials = true;

  // ========================
  // Auto attach token to axios
  // ========================
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchCurrentAdmin();
    } else {
      delete axios.defaults.headers.common["Authorization"];
      setLoading(false);
    }
  }, [token]);

  // ========================
  // Axios Response Interceptor - THIS IS THE NEW PART
  // ========================
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // handle both 401 and 403
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          if (isRefreshing) {
            return new Promise((resolve) => {
              const checkRefresh = setInterval(() => {
                if (!isRefreshing) {
                  clearInterval(checkRefresh);
                  originalRequest.headers[
                    "Authorization"
                  ] = `Bearer ${localStorage.getItem("token")}`;
                  resolve(axios(originalRequest));
                }
              }, 100);
            });
          }

          setIsRefreshing(true);

          try {
            // include withCredentials
            const res = await axios.post(
              "http://localhost:5001/api/admins/refresh",
              {},
              { withCredentials: true }
            );

            if (res.data.token) {
              const newToken = res.data.token;
              localStorage.setItem("token", newToken);
              setToken(newToken);
              axios.defaults.headers.common[
                "Authorization"
              ] = `Bearer ${newToken}`;
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            }

            await fetchCurrentAdmin(newToken);

            setIsRefreshing(false);
            return axios(originalRequest); // retry original request
          } catch (refreshError) {
            setIsRefreshing(false);
            console.warn("Refresh token expired or invalid");
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isRefreshing]);
  // Re-create interceptor if isRefreshing changes

  // ========================
  // Fetch current admin info
  // ========================
  const fetchCurrentAdmin = async (jwtToken) => {
    try {
      const res = await axios.get("http://localhost:5001/api/admins/me", {
        headers: {
          Authorization: `Bearer ${jwtToken || token}`,
        },
      });
      setAdmin(res.data);
    } catch (err) {
      console.error("Error fetching admin:", err);
      // Don't manually refresh here - the interceptor will handle it
    } finally {
      setLoading(false);
    }
  };
  // ========================
  // Manual refresh access token (for periodic refresh)
  // ========================
  const handleTokenRefresh = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/admins/refresh",
        {}, // empty body
        { withCredentials: true } // ensures refreshToken cookie is sent
      );

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${res.data.token}`;
      }
    } catch (err) {
      console.warn("Refresh token expired or invalid");
      logout();
    }
  };

  // ========================
  // Login
  // ========================
  const login = (jwtToken) => {
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);
    fetchCurrentAdmin(jwtToken);
  };

  // ========================
  // Logout
  // ========================
  const logout = async () => {
    try {
      await axios.post("http://localhost:5001/api/admins/logout");
    } catch (err) {
      console.error("Logout error:", err.message);
    }
    localStorage.removeItem("token");
    setToken(null);
    setAdmin(null);
  };

  // Update global admin data
  const updateAdmin = (updatedData) => {
    setAdmin((prev) => ({ ...prev, ...updatedData }));
  };

  // ========================
  // Auto refresh every 55 minutes (before 1h token expires)
  // ========================
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(() => {
      handleTokenRefresh();
    }, 55 * 60 * 1000); // every 55 min

    return () => clearInterval(refreshInterval);
  }, [token]);

  // ========================
  // Auto logout after 10 hours
  // ========================
  useEffect(() => {
    if (!token) return;

    const logoutTimer = setTimeout(() => {
      logout();
    }, 10 * 60 * 60 * 1000); // 10 hours

    return () => clearTimeout(logoutTimer);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        currentUser: admin,
        token,
        login,
        logout,
        loading,
        updateAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
