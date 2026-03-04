"use client";

import { useAuthStore } from "../../stores/auth-store";
import api from "../../lib/api";
import { useState } from "react";

export default function TestPage() {
  const { user, token, login, logout, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post("/auth/dev-login", {
        email: "admin@quiznow.com",
      });

      const { access_token } = response.data;

      // Mock user data (in real app, this would come from the API)
      const mockUser = {
        id: "c1234567890abcdef1234567890abcdef",
        email: "admin@quiznow.com",
        name: "Super Admin",
        role: "ADMIN" as const,
      };

      login(mockUser, access_token);
      setMessage("✅ Login successful!");
    } catch (error) {
      setMessage("❌ Login failed: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await api.get("/tests");
      setMessage(`✅ API call successful! Found ${response.data.length} tests`);
    } catch (error) {
      setMessage("❌ API call failed: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">QuizNow Foundation Test</h1>

        {/* Auth Status */}
        <div className="bg-card p-6 rounded-lg border mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
            </p>
            {user && (
              <>
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> {user.role}
                </p>
              </>
            )}
            <p>
              <strong>Token:</strong>{" "}
              {token ? `${token.substring(0, 20)}...` : "None"}
            </p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-4">
          <button
            onClick={testLogin}
            disabled={loading || isAuthenticated}
            className="w-full bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : isAuthenticated
                ? "Already Logged In"
                : "Test Login"}
          </button>

          <button
            onClick={testAPI}
            disabled={loading || !isAuthenticated}
            className="w-full bg-secondary text-secondary-foreground p-3 rounded-lg hover:bg-secondary/90 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : !isAuthenticated
                ? "Login First"
                : "Test API Call"}
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="w-full bg-destructive text-destructive-foreground p-3 rounded-lg hover:bg-destructive/90"
            >
              Logout
            </button>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
