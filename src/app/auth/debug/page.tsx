"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function DebugPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function testDbConnection() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch("/api/test-db");
      const data = await response.json();
      
      setResult({
        endpoint: "/api/test-db",
        data
      });
    } catch (err) {
      setError(`DB Test Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function testDirectSignIn() {
    try {
      if (!email || !password) {
        setError("Email and password are required");
        return;
      }
      
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch("/api/auth/debug-signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      setResult({
        endpoint: "/api/auth/debug-signin",
        data
      });
      
      if (data.success) {
        // Store token in localStorage for testing
        localStorage.setItem("debug-auth-token", data.token);
      }
    } catch (err) {
      setError(`Sign-in Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function testUserSchema() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch("/api/test-db/user-schema");
      const data = await response.json();
      
      setResult({
        endpoint: "/api/test-db/user-schema",
        data
      });
    } catch (err) {
      setError(`User Schema Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function testNextAuthSignIn() {
    try {
      if (!email || !password) {
        setError("Email and password are required");
        return;
      }
      
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false
      });
      
      setResult({
        endpoint: "NextAuth sign-in",
        data: response
      });
    } catch (err) {
      setError(`NextAuth Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Test Database Connection</h2>
        <div className="flex gap-2">
          <button 
            onClick={testDbConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test DB Connection"}
          </button>
          
          <button 
            onClick={testUserSchema}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Check User Schema"}
          </button>
        </div>
      </div>
      
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Direct Sign-in Test</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={testDirectSignIn}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Test Direct Sign-in"}
            </button>
            
            <button
              onClick={testNextAuthSignIn}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Test NextAuth Sign-in"}
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}
      
      {result && (
        <div className="p-4 border rounded bg-gray-50">
          <h3 className="font-medium mb-2">Result from {result.endpoint}</h3>
          <pre className="bg-black text-green-400 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 