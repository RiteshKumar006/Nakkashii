import { createContext, useContext, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

function loadSaved() {
    try {
        return JSON.parse(localStorage.getItem("auth")) || { token: null, user: null };
    } catch {
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(loadSaved);

    async function loginAs(email) {
        const data = await api("/auth/dev-login", { method: "POST", body: { email } });
        setAuth(data);
        localStorage.setItem("auth", JSON.stringify(data));
    }

    function logout() {
        setAuth({ token: null, user: null });
        localStorage.removeItem("auth");
    }

    return (
        <AuthContext.Provider value={{ ...auth, loginAs, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
