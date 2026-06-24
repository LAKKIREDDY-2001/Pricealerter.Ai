import React, { useState, useEffect } from "react";
import { 
  Bell, 
  PlusCircle, 
  List, 
  LineChart, 
  Trash2, 
  Loader2, 
  LogOut, 
  Globe, 
  RefreshCw, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  ChevronRight, 
  CreditCard, 
  History, 
  User, 
  Lock, 
  Mail, 
  Search, 
  ArrowRight, 
  Sliders,
  Compass,
  Key,
  ShieldCheck,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  getIdToken, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

// --- TYPES ---
interface Tracker {
  id: string;
  url: string;
  productName: string;
  productImage?: string;
  currentPrice: number;
  targetPrice: number;
  currency: string;
  currencySymbol: string;
  status: string;
  lastCheckedAt: string;
  createdAt: string;
}

interface PricePoint {
  price: number;
  recordedAt: string;
}

interface AIReview {
  overallRating: number;
  categories: { name: string; score: number }[];
  pros: string[];
  cons: string[];
  recommendation: string;
  verdictSummary: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

interface AnalyticsData {
  totalTracked: number;
  reachedDeals: number;
  totalSavings: number;
  storeStats: { name: string; count: number }[];
}

export default function App() {
  const [authToken, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setUser] = useState<{ username: string; email: string; subscription: string; userCode?: string } | null>(null);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showGoogleFallback, setShowGoogleFallback] = useState(false);
  const [googleFallbackEmail, setGoogleFallbackEmail] = useState("MADHAVALR4321@gmail.com");
  const [googleFallbackUsername, setGoogleFallbackUsername] = useState("Madhav");

  // Dashboard state
  const [currentView, setView] = useState<"new" | "my-trackers" | "trends" | "subscription" | "oracle">("new");
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({ totalTracked: 0, reachedDeals: 0, totalSavings: 0, storeStats: [] });
  const [trackersLoading, setTrackersLoading] = useState(false);

  // Next Ball Oracle State Variables
  const [oracleFormat, setOracleFormat] = useState<"T20" | "ODI" | "Test">("T20");
  const [oracleBowlerType, setOracleBowlerType] = useState("Right-arm Fast");
  const [oracleBatsmanStyle, setOracleBatsmanStyle] = useState("Right-Handed Power-hitter");
  const [oracleCurrentOver, setOracleCurrentOver] = useState("");
  const [oracleRunsNeeded, setOracleRunsNeeded] = useState("");
  const [oracleMatchStage, setOracleMatchStage] = useState("Death Overs");
  const [oracleMatchSituation, setOracleMatchSituation] = useState("");
  const [oraclePredictionResult, setOraclePredictionResult] = useState<any>(null);
  const [oraclePredictionLoading, setOraclePredictionLoading] = useState(false);
  const [oracleHistoryList, setOracleHistoryList] = useState<any[]>([]);
  const [oracleHistoryLoading, setOracleHistoryLoading] = useState(false);


  // New Tracker input
  const [productUrl, setProductUrl] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [scrapedDetails, setScrapedDetails] = useState<{ price: number; productName: string; image: string } | null>(null);
  const [scraping, setScraping] = useState(false);
  const [creating, setCreating] = useState(false);
  const [trackerSuccess, setTrackerSuccess] = useState(false);
  const [sendingTestMail, setSendingTestMail] = useState(false);

  // Selected tracker for details & history
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [priceHistory, setHistory] = useState<PricePoint[]>([]);
  const [aiReview, setAiReview] = useState<AIReview | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Global Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Secure Payment / Checkout States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"Pro" | "Premium" | null>(null);
  const [checkoutPrice, setCheckoutPrice] = useState<number>(0);
  const [checkoutQrUrl, setCheckoutQrUrl] = useState("");
  const [checkoutUtr, setCheckoutUtr] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutVerifying, setCheckoutVerifying] = useState(false);

  // Listen to Firebase Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await getIdToken(firebaseUser);
          localStorage.setItem("token", token);
          setToken(token);
          
          // Fetch existing profile first
          const profileRes = await fetch("/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUser({
              username: profileData.username,
              email: profileData.email,
              subscription: profileData.subscription,
              userCode: profileData.userCode
            });
          } else {
            // Profile doesn't exist yet, perform sync
            const res = await fetch("/api/auth/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                username: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
                email: firebaseUser.email,
                phone: null
              })
            });
            
            if (res.ok) {
              const syncData = await res.json();
              setUser({
                username: syncData.user.username,
                email: syncData.user.email,
                subscription: syncData.user.subscription,
                userCode: syncData.user.userCode
              });
            }
          }
        } catch (err) {
          console.error("Firebase auth state listener error:", err);
        }
      } else {
        // Logged out or using local fallback auth
        const currentToken = localStorage.getItem("token");
        if (currentToken && currentToken.startsWith("local_")) {
          // Keep local session active
          return;
        }
        setToken(null);
        setUser(null);
        setTrackers([]);
        setActivityLogs([]);
        localStorage.removeItem("token");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch trackers, activity, and analytics when token is available
  useEffect(() => {
    if (authToken) {
      fetchProfile();
      fetchTrackers();
      fetchAnalytics();
      fetchActivityLogs();
      fetchOracleHistory();
    }
  }, [authToken]);

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrackers = async () => {
    setTrackersLoading(true);
    try {
      const res = await fetch("/api/trackers", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrackers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTrackersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await fetch("/api/activity", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOracleHistory = async () => {
    if (!authToken) return;
    setOracleHistoryLoading(true);
    try {
      const res = await fetch("/api/oracle/history", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOracleHistoryList(data);
      }
    } catch (err) {
      console.error("Error fetching oracle history:", err);
    } finally {
      setOracleHistoryLoading(false);
    }
  };

  const predictNextBall = async () => {
    if (!authToken) return;
    setOraclePredictionLoading(true);
    setOraclePredictionResult(null);
    try {
      const res = await fetch("/api/oracle/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          format: oracleFormat,
          bowlerType: oracleBowlerType,
          batsmanStyle: oracleBatsmanStyle,
          currentOver: oracleCurrentOver,
          runsNeeded: oracleRunsNeeded,
          matchStage: oracleMatchStage,
          matchSituation: oracleMatchSituation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOraclePredictionResult(data.prediction);
        showToast("The AI Cricket Oracle has predicted the future delivery!", "success");
        // Refresh history and activity logs
        fetchOracleHistory();
        fetchActivityLogs();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "The Oracle is currently clouded.", "error");
      }
    } catch (err) {
      console.error("Error run oracle prediction:", err);
      showToast("Network error trying to contact the Oracle.", "error");
    } finally {
      setOraclePredictionLoading(false);
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setTrackers([]);
      setActivityLogs([]);
      setView("new");
      showToast("Successfully logged out", "success");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      const token = await getIdToken(fbUser, true);
      
      // Perform immediate sync to Firestore profile
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: fbUser.displayName || fbUser.email?.split("@")[0],
          email: fbUser.email,
          phone: null
        })
      });
      
      if (res.ok) {
        const syncData = await res.json();
        localStorage.setItem("token", token);
        setToken(token);
        setUser({
          username: syncData.user.username,
          email: syncData.user.email,
          subscription: syncData.user.subscription,
          userCode: syncData.user.userCode
        });
        showToast("Logged in successfully via Google!", "success");
      } else {
        throw new Error("Failed to sync profile after Google sign-in.");
      }
    } catch (err: any) {
      console.warn("Firebase Google Login failed, opening Local Google Fallback:", err);
      let msg = "Google authentication failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "The login popup was closed before completing.";
      } else if (err.code === "auth/blocked-by-popup-triggerer") {
        msg = "Popup was blocked by your browser. Please allow popups.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "Google sign-in is not enabled in your Firebase Auth settings.";
      }
      setAuthError(msg);
      setShowGoogleFallback(true);
      showToast("Google Sign-In failed or was blocked. Opening developer fallback login.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/local-google-signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: googleFallbackEmail,
          username: googleFallbackUsername || googleFallbackEmail.split("@")[0]
        })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser({
          username: data.user.username,
          email: data.user.email,
          subscription: data.user.subscription,
          userCode: data.user.userCode
        });
        setShowGoogleFallback(false);
        showToast("Logged in successfully via local Google fallback!", "success");
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Local Google login failed.");
      }
    } catch (fallbackErr: any) {
      console.error("Local Google Sign-In fallback error:", fallbackErr);
      const msg = fallbackErr.message || "Failed to authenticate locally.";
      setAuthError(msg);
      showToast(msg, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    if (isLogin) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        const fbUser = userCredential.user;
        const token = await getIdToken(fbUser);
        
        // Ensure backend profile is synced
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            username: fbUser.displayName || fbUser.email?.split("@")[0],
            email: fbUser.email,
            phone: null
          })
        });
        
        if (res.ok) {
          const syncData = await res.json();
          localStorage.setItem("token", token);
          setToken(token);
          setUser({
            username: syncData.user.username,
            email: syncData.user.email,
            subscription: syncData.user.subscription,
            userCode: syncData.user.userCode
          });
          showToast("Logged in successfully!", "success");
        } else {
          throw new Error("Sync failed during login.");
        }
      } catch (err: any) {
        console.warn("Firebase Auth Login failed, attempting Local Auth Fallback...", err);
        // Fallback to local login
        try {
          const localRes = await fetch("/api/auth/local-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: authEmail,
              password: authPassword
            })
          });

          if (localRes.ok) {
            const localData = await localRes.json();
            localStorage.setItem("token", localData.token);
            setToken(localData.token);
            setUser({
              username: localData.user.username,
              email: localData.user.email,
              subscription: localData.user.subscription,
              userCode: localData.user.userCode
            });
            showToast("Logged in successfully via local server!", "success");
          } else {
            const errData = await localRes.json();
            throw new Error(errData.error || "Local authentication failed.");
          }
        } catch (fallbackErr: any) {
          console.error("Local Login fallback error:", fallbackErr);
          const msg = fallbackErr.message || "Authentication failed. Please check your credentials.";
          setAuthError(msg);
          showToast(msg, "error");
        }
      } finally {
        setAuthLoading(false);
      }
    } else {
      // Signup Flow
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const fbUser = userCredential.user;
        
        // Set displayName in Firebase Auth
        await updateProfile(fbUser, {
          displayName: authUsername || authEmail.split("@")[0]
        });
        
        // Force refresh token to include displayName in JWT
        const token = await getIdToken(fbUser, true);
        
        // Create Firestore profile immediately on signup
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            username: authUsername || authEmail.split("@")[0],
            email: authEmail,
            phone: authPhone || null
          })
        });
        
        if (res.ok) {
          const syncData = await res.json();
          localStorage.setItem("token", token);
          setToken(token);
          setUser({
            username: syncData.user.username,
            email: syncData.user.email,
            subscription: syncData.user.subscription,
            userCode: syncData.user.userCode
          });
          showToast("Account created successfully!", "success");
        } else {
          throw new Error("Sync failed during registration.");
        }
      } catch (err: any) {
        console.warn("Firebase Auth Signup failed, attempting Local Auth Fallback...", err);
        // Fallback to local signup
        try {
          const localRes = await fetch("/api/auth/local-signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              username: authUsername || authEmail.split("@")[0],
              email: authEmail,
              password: authPassword,
              phone: authPhone || null
            })
          });

          if (localRes.ok) {
            const localData = await localRes.json();
            localStorage.setItem("token", localData.token);
            setToken(localData.token);
            setUser({
              username: localData.user.username,
              email: localData.user.email,
              subscription: localData.user.subscription,
              userCode: localData.user.userCode
            });
            showToast("Account created successfully via local server!", "success");
          } else {
            const errData = await localRes.json();
            throw new Error(errData.error || "Local registration failed.");
          }
        } catch (fallbackErr: any) {
          console.error("Local Signup fallback error:", fallbackErr);
          const msg = fallbackErr.message || "Signup failed. Please try again.";
          setAuthError(msg);
          showToast(msg, "error");
        }
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Analyze URL for price
  const handleScrapeProduct = async () => {
    if (!productUrl.trim()) {
      showToast("Please paste a valid product link", "error");
      return;
    }
    setScraping(true);
    setScrapedDetails(null);
    setTrackerSuccess(false);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ url: productUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setScrapedDetails(data);
        setTargetPrice(Math.round(data.price * 0.9).toString()); // suggest 10% lower target
        showToast("Product analyzed successfully", "success");
      } else {
        showToast(data.error || "Could not analyze product details", "error");
      }
    } catch (err) {
      showToast("Scraping connection error", "error");
    } finally {
      setScraping(false);
    }
  };

  // Save new Price Tracker
  const handleCreateTracker = async () => {
    if (!productUrl.trim() || !targetPrice) {
      showToast("Please specify the target price", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ url: productUrl, targetPrice: parseFloat(targetPrice) })
      });
      const data = await res.json();
      if (res.ok) {
        setTrackerSuccess(true);
        setProductUrl("");
        setScrapedDetails(null);
        showToast("AI Alert created successfully!", "success");
        fetchTrackers();
        fetchAnalytics();
        fetchActivityLogs();
        setTimeout(() => setTrackerSuccess(false), 3000);
      } else {
        showToast(data.error || "Failed to create price alert", "error");
      }
    } catch (err) {
      showToast("Failed to connect to the server", "error");
    } finally {
      setCreating(false);
    }
  };

  // Refresh Single Tracker Price
  const handleRefreshTracker = async (trackerId: number) => {
    try {
      const tracker = trackers.find(t => t.id === trackerId);
      if (!tracker) return;
      showToast(`Refreshing price for ${tracker.productName.slice(0, 20)}...`, "success");
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ url: tracker.url })
      });
      const data = await res.json();
      if (res.ok) {
        // Submit put to update tracker state in db
        await fetch(`/api/trackers/${trackerId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ targetPrice: tracker.targetPrice, currentPrice: data.price })
        });
        showToast("Price updated successfully", "success");
        fetchTrackers();
        fetchAnalytics();
        fetchActivityLogs();
      } else {
        showToast("Could not update price", "error");
      }
    } catch (err) {
      showToast("Connection failed", "error");
    }
  };

  // Delete Tracker
  const handleDeleteTracker = async (trackerId: number) => {
    if (!confirm("Are you sure you want to remove this price tracker?")) return;
    try {
      const res = await fetch(`/api/trackers/${trackerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        showToast("Tracker removed", "success");
        fetchTrackers();
        fetchAnalytics();
        fetchActivityLogs();
      } else {
        showToast("Failed to delete tracker", "error");
      }
    } catch (err) {
      showToast("Server connection error", "error");
    }
  };

  // Select Tracker to view Price Trends & AI Review Analysis
  const handleSelectTrackerForTrends = async (tracker: Tracker) => {
    setSelectedTracker(tracker);
    setView("trends");
    setHistory([]);
    setAiReview(null);
    setLoadingReview(true);
    setLoadingHistory(true);

    try {
      // Fetch History
      const hRes = await fetch(`/api/trackers/${tracker.id}/history`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(hData.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }

    try {
      // Fetch AI Review
      const rRes = await fetch(`/api/ai/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ productName: tracker.productName })
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        setAiReview(rData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReview(false);
    }
  };

  // Upgrade Plan
  const handleUpgradeSubscription = async (plan: string) => {
    if (plan === "Free") {
      try {
        const res = await fetch("/api/subscription/upgrade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ plan })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Successfully moved to Free plan!`, "success");
          fetchProfile();
          fetchActivityLogs();
        } else {
          showToast("Plan update failed", "error");
        }
      } catch (err) {
        showToast("Connection error", "error");
      }
      return;
    }

    // Pro or Premium require secure payment
    setCheckoutLoading(true);
    setCheckoutPlan(plan as "Pro" | "Premium");
    setCheckoutUtr("");
    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (res.ok) {
        setCheckoutPrice(data.price);
        setCheckoutQrUrl(data.qrCodeUrl);
        setCheckoutModalOpen(true);
        showToast(`Secure payment session created for ${plan} Plan!`, "success");
      } else {
        showToast(data.error || "Failed to start checkout", "error");
      }
    } catch (err) {
      showToast("Payment checkout connection error", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Verify UTR Payment
  const handleVerifyCheckoutPayment = async () => {
    if (!checkoutUtr.trim()) {
      showToast("Please enter the 12-digit UPI UTR number", "error");
      return;
    }
    const cleanUtr = checkoutUtr.trim().replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanUtr)) {
      showToast("UTR number must be exactly 12 digits", "error");
      return;
    }

    setCheckoutVerifying(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ plan: checkoutPlan, utr: cleanUtr })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Payment Verified! Subscription upgraded to ${checkoutPlan}! 🎉`, "success");
        setCheckoutModalOpen(false);
        setCheckoutUtr("");
        fetchProfile();
        fetchActivityLogs();
        fetchAnalytics();
      } else {
        showToast(data.error || "Verification failed. Check your UTR.", "error");
      }
    } catch (err) {
      showToast("Verification connection error", "error");
    } finally {
      setCheckoutVerifying(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTestMail(true);
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Test email dispatched successfully!", "success");
      } else {
        showToast(data.error || "Failed to dispatch test email", "error");
      }
    } catch (err) {
      showToast("Test email connection error", "error");
    } finally {
      setSendingTestMail(false);
    }
  };

  // Detect which store is in URL
  const getStoreName = (url: string) => {
    const l = url.toLowerCase();
    if (l.includes("amazon")) return "Amazon";
    if (l.includes("flipkart")) return "Flipkart";
    if (l.includes("myntra")) return "Myntra";
    if (l.includes("ajio")) return "Ajio";
    if (l.includes("meesho")) return "Meesho";
    if (l.includes("snapdeal")) return "Snapdeal";
    if (l.includes("tatacliq")) return "Tata CLiQ";
    if (l.includes("reliance")) return "Reliance Digital";
    return "E-store";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${
              toastMessage.type === "success" 
                ? "bg-slate-800 border-emerald-500/30 text-emerald-400" 
                : "bg-slate-800 border-rose-500/30 text-rose-400"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- AUTHENTICATION FLOW --- */}
      {!authToken ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-3xl relative z-10"
          >
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/10">
                <Bell className="w-7 h-7 text-white animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Price Alert</h2>
              <p className="text-slate-400 text-sm mt-2">Smart AI-powered price drop tracking across 100+ stores</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={authUsername} 
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="Enter a cool username" 
                      className="w-full bg-slate-900/60 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type="email" 
                    required 
                    value={authEmail} 
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com" 
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Phone (Optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                    <input 
                      type="tel" 
                      value={authPhone} 
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+919876543210" 
                      className="w-full bg-slate-900/60 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type="password" 
                    required 
                    value={authPassword} 
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? "Sign In" : "Register Now"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800/40"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">or continue with</span>
                  <div className="flex-grow border-t border-slate-800/40"></div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span className="text-xs">Sign in with Google</span>
                </button>
              </div>
            </form>

            <div className="text-center mt-6 text-sm text-slate-400">
              {isLogin ? "New to AI Price Alert?" : "Already have an account?"}{" "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setAuthError(""); }}
                className="text-orange-400 hover:text-orange-300 font-semibold underline cursor-pointer"
              >
                {isLogin ? "Create an account" : "Log in here"}
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        
        // --- CORE APPLICATION WORKSPACE ---
        <div className="min-h-screen flex flex-col md:flex-row">
          
          {/* Dashboard Left Sidebar */}
          <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800/60 flex flex-col justify-between shrink-0 p-5">
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/10">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-extrabold text-lg text-white leading-tight tracking-tight">Price Alerter</h1>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">AI Copilot</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <button 
                  onClick={() => setView("new")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    currentView === "new" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>New Alert</span>
                </button>

                <button 
                  onClick={() => setView("my-trackers")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    currentView === "my-trackers" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <List className="w-5 h-5" />
                  <span>My Trackers</span>
                  {trackers.length > 0 && (
                    <span className="ml-auto bg-slate-800/80 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      {trackers.length}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setView("trends")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    currentView === "trends" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <LineChart className="w-5 h-5" />
                  <span>Price Trends</span>
                </button>

                <button 
                  onClick={() => setView("oracle")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    currentView === "oracle" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Next Ball Oracle</span>
                </button>

                <button 
                  onClick={() => setView("subscription")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    currentView === "subscription" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Subscription</span>
                  {currentUser && (
                    <span className="ml-auto bg-amber-500/10 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-500/20">
                      {currentUser.subscription}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar bottom profile */}
            <div className="border-t border-slate-800/60 pt-5 mt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center font-bold text-orange-400">
                    {currentUser?.username.slice(0, 2).toUpperCase() || "US"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{currentUser?.username || "User"}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser?.email || "user@example.com"}</p>
                    {currentUser?.userCode && (
                      <p className="text-[9px] text-orange-400 font-mono tracking-wide mt-0.5 font-bold">Code: {currentUser.userCode}</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main workspace */}
          <main className="flex-1 bg-slate-900 flex flex-col min-w-0">
            
            {/* Header / top bar */}
            <header className="h-16 border-b border-slate-800/60 px-8 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-sm">Dashboard</span>
                <ChevronRight className="w-4 h-4 text-slate-700" />
                <span className="text-white text-sm font-semibold capitalize">{currentView === "new" ? "New Price Alert" : currentView}</span>
              </div>

              {/* Ticker of latest action */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-800/40 px-4 py-1.5 rounded-full border border-slate-800/80 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-300 font-semibold">Live price check interval:</span>
                <span className="text-emerald-400 font-bold">10 min loop</span>
              </div>
            </header>

            {/* View Containers */}
            <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-8">
              
              {/* --- VIEW: ADD NEW ALERT --- */}
              {currentView === "new" && (
                <div className="max-w-2xl mx-auto py-12 space-y-12">
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">Paste Link. Save Money.</h2>
                    <p className="text-slate-400 max-w-md mx-auto">Track product prices on Amazon, Flipkart, Myntra, Ajio and get notified instantly the second they drop.</p>
                  </div>

                  <div className="bg-slate-950/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl space-y-6 relative">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Product URL</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          value={productUrl}
                          onChange={(e) => setProductUrl(e.target.value)}
                          placeholder="Paste e-commerce product page link here..."
                          className="flex-1 bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3.5 px-4 text-sm outline-none transition-all placeholder:text-slate-600"
                        />
                        <button 
                          onClick={handleScrapeProduct}
                          disabled={scraping || !productUrl.trim()}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-6 py-3.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {scraping ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Search className="w-4 h-4" />
                              <span>Analyze</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Scraped Info Panel */}
                    <AnimatePresence>
                      {scrapedDetails && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 overflow-hidden"
                        >
                          <div className="flex gap-4">
                            {scrapedDetails.image && (
                              <img src={scrapedDetails.image} alt="scraped preview" className="w-20 h-20 object-cover rounded-xl border border-slate-800/80 bg-white" />
                            )}
                            <div className="space-y-1">
                              <span className="text-[10px] bg-orange-500/10 text-orange-400 font-extrabold px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-wide">
                                {getStoreName(productUrl)}
                              </span>
                              <h4 className="font-bold text-white text-base leading-snug line-clamp-2">{scrapedDetails.productName}</h4>
                              <p className="text-emerald-400 font-extrabold text-lg">₹{scrapedDetails.price.toLocaleString("en-IN")}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Your Target Price (₹)</label>
                              <input 
                                type="number" 
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                placeholder="E.g., 12999"
                                className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3 px-4 text-sm outline-none transition-all"
                              />
                            </div>

                            <div className="flex items-end">
                              <button 
                                onClick={handleCreateTracker}
                                disabled={creating || !targetPrice}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                {creating ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <>
                                    <Bell className="w-4 h-4" />
                                    <span>Create Alert</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {trackerSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-semibold">AI price tracker successfully generated and verified! Check 'My Trackers' to view.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-8 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Global store crawling</span>
                    <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> SMS + Email dispatcher verified</span>
                  </div>
                </div>
              )}

              {/* --- VIEW: MY TRACKERS --- */}
              {currentView === "my-trackers" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">Active Price Trackers</h2>
                      <p className="text-slate-400 text-sm mt-1">Manage and refresh your active e-commerce alerts</p>
                    </div>
                  </div>

                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Active</p>
                        <p className="text-2xl font-black text-white mt-1">{analytics.totalTracked}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Deals Reached</p>
                        <p className="text-2xl font-black text-white mt-1">{analytics.reachedDeals}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                        <TrendingDown className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Savings</p>
                        <p className="text-2xl font-black text-white mt-1">₹{analytics.totalSavings.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trackers Grid */}
                  {trackersLoading ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                  ) : trackers.length === 0 ? (
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                      <PlusCircle className="w-12 h-12 text-slate-700 mx-auto" />
                      <h3 className="text-xl font-bold text-white">No Trackers Created</h3>
                      <p className="text-slate-500 text-sm">You haven't generated any price alerts yet. Head to the 'New Alert' tab to begin.</p>
                      <button onClick={() => setView("new")} className="bg-slate-800 text-white font-semibold py-2 px-4 rounded-xl border border-slate-700 text-sm hover:bg-slate-700 transition-all cursor-pointer">
                        Add alert
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {trackers.map((t) => {
                        const isReached = t.currentPrice <= t.targetPrice;
                        return (
                          <motion.div 
                            key={t.id}
                            layout
                            className={`rounded-2xl p-6 flex flex-col justify-between gap-6 transition-all shadow-xl border relative overflow-hidden ${
                              isReached 
                                ? "bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-950 border-emerald-500/40 shadow-emerald-500/5 hover:border-emerald-500/60" 
                                : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80"
                            }`}
                          >
                            {isReached && (
                              <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-[9px] font-black px-3.5 py-1 rounded-bl-xl border-l border-b border-emerald-400/20 tracking-wider uppercase animate-pulse">
                                Target Reached! 🎉
                              </div>
                            )}

                            <div className="flex gap-4">
                              {t.productImage && (
                                <img src={t.productImage} alt={t.productName} className="w-20 h-20 object-cover rounded-xl border border-slate-800/80 bg-white" />
                              )}
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] bg-slate-800 text-slate-300 font-extrabold px-2 py-0.5 rounded border border-slate-700 uppercase tracking-wide">
                                    {getStoreName(t.url)}
                                  </span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide ${
                                    isReached 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                      : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  }`}>
                                    {isReached ? "Deal Reached!" : "Active Tracking"}
                                  </span>
                                </div>
                                <h3 className="font-bold text-white text-base leading-snug truncate pr-4">{t.productName}</h3>
                                <p className="text-[10px] text-slate-500 truncate">{t.url}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-3.5 px-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Price</p>
                                <p className={`text-base font-extrabold mt-0.5 ${isReached ? "text-emerald-400" : "text-white"}`}>
                                  ₹{t.currentPrice.toLocaleString("en-IN")}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Price</p>
                                <p className="text-base font-extrabold text-orange-400 mt-0.5">₹{t.targetPrice.toLocaleString("en-IN")}</p>
                              </div>
                            </div>

                            {isReached && (
                              <a 
                                href={t.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                              >
                                <span>Buy Now on Store</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-500">Checked: {new Date(t.lastCheckedAt).toLocaleTimeString()}</span>
                                {t.trackerCode && (
                                  <span className="text-[9px] text-orange-400 font-mono font-bold uppercase tracking-wider">{t.trackerCode}</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleSelectTrackerForTrends(t)}
                                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                                  title="Price Trends & AI Review"
                                >
                                  <LineChart className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleRefreshTracker(t.id)}
                                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                                  title="Refresh Price"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTracker(t.id)}
                                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Activity Logs & Audit Timeline */}
                  {activityLogs.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-slate-800/60">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-slate-400" />
                        <span>Real-time Engagement Logs</span>
                      </h3>
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="flex justify-between items-start text-xs border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                            <div className="space-y-1">
                              <span className="font-extrabold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-[10px]">
                                {log.action}
                              </span>
                              <p className="text-slate-300 font-medium">{log.details}</p>
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- VIEW: PRICE TRENDS & ANALYTICS --- */}
              {currentView === "trends" && (
                <div className="space-y-8">
                  {selectedTracker ? (
                    <div className="space-y-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-3xl font-extrabold text-white tracking-tight">{selectedTracker.productName}</h2>
                          <p className="text-slate-400 text-sm mt-1">{selectedTracker.url}</p>
                        </div>
                        <button onClick={() => setView("my-trackers")} className="bg-slate-800 text-slate-300 px-4 py-2 border border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-700 cursor-pointer">
                          Back to list
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Price History Line Graph */}
                        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 space-y-6">
                          <h3 className="text-base font-bold text-white">Historical Price Movement</h3>
                          
                          {loadingHistory ? (
                            <div className="flex justify-center py-20">
                              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            </div>
                          ) : priceHistory.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-sm">
                              No history points recorded yet. We record prices daily.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Responsive SVG Line Graph fallback for guaranteed 100% stable presentation */}
                              <div className="h-64 w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 relative">
                                <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                                  <defs>
                                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.2"/>
                                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.0"/>
                                    </linearGradient>
                                  </defs>
                                  {/* Draw area under path */}
                                  <path 
                                    d={`M 0 200 ${priceHistory.map((h, i) => {
                                      const x = (i / (priceHistory.length - 1)) * 500;
                                      const maxPrice = Math.max(...priceHistory.map(p => p.price));
                                      const minPrice = Math.min(...priceHistory.map(p => p.price));
                                      const range = maxPrice - minPrice || 1;
                                      const y = 170 - ((h.price - minPrice) / range) * 140;
                                      return `L ${x} ${y}`;
                                    }).join(" ")} L 500 200 Z`}
                                    fill="url(#gradient)"
                                  />
                                  {/* Draw line */}
                                  <path 
                                    d={priceHistory.map((h, i) => {
                                      const x = (i / (priceHistory.length - 1)) * 500;
                                      const maxPrice = Math.max(...priceHistory.map(p => p.price));
                                      const minPrice = Math.min(...priceHistory.map(p => p.price));
                                      const range = maxPrice - minPrice || 1;
                                      const y = 170 - ((h.price - minPrice) / range) * 140;
                                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                                    }).join(" ")}
                                    fill="none"
                                    stroke="#f97316"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                
                                <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[10px] text-slate-500 font-bold">
                                  <span>{new Date(priceHistory[0].recordedAt).toLocaleDateString()}</span>
                                  <span>{new Date(priceHistory[priceHistory.length - 1].recordedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex justify-around text-xs text-slate-400">
                                <span>Min Price: ₹{Math.min(...priceHistory.map(p => p.price))}</span>
                                <span>Max Price: ₹{Math.max(...priceHistory.map(p => p.price))}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Visual 5/5 Sentiment Review Rating */}
                        <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 space-y-6">
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <span>AI Product Sentiment Analysis</span>
                          </h3>

                          {loadingReview ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-3">
                              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                              <span className="text-xs text-slate-500 font-bold animate-pulse">Gemini analyzing ratings & reviews...</span>
                            </div>
                          ) : aiReview ? (
                            <div className="space-y-6">
                              <div className="text-center space-y-1">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Overall Sentiment</span>
                                <div className="text-5xl font-black text-amber-400">{aiReview.overallRating.toFixed(1)} <span className="text-xl text-slate-500">/ 5</span></div>
                                <div className="flex justify-center text-amber-400 text-lg">
                                  {"★".repeat(Math.round(aiReview.overallRating))}
                                  {"☆".repeat(5 - Math.round(aiReview.overallRating))}
                                </div>
                              </div>

                              <div className="space-y-3 pt-2">
                                {aiReview.categories.map((c, i) => (
                                  <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                      <span className="text-slate-300">{c.name}</span>
                                      <span className="text-amber-400">{c.score.toFixed(1)} / 5</span>
                                    </div>
                                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                      <div className="bg-amber-400 h-full" style={{ width: `${(c.score / 5) * 100}%` }}></div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pros</h4>
                                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                                    {aiReview.pros.map((p, i) => <li key={i}>{p}</li>)}
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Cons</h4>
                                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                                    {aiReview.cons.map((c, i) => <li key={i}>{c}</li>)}
                                  </ul>
                                </div>
                              </div>

                              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-400 uppercase">AI Verdict</span>
                                  <span className="text-xs font-extrabold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                                    {aiReview.recommendation}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">{aiReview.verdictSummary}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 text-slate-500 text-sm">
                              No review available.
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                      <Compass className="w-12 h-12 text-slate-700 mx-auto" />
                      <h3 className="text-xl font-bold text-white">No Product Selected</h3>
                      <p className="text-slate-500 text-sm">Please head to the 'My Trackers' tab and click on the trend icon for any active price alert to analyze historical trends.</p>
                      <button onClick={() => setView("my-trackers")} className="bg-slate-800 text-white font-semibold py-2 px-4 rounded-xl border border-slate-700 text-sm hover:bg-slate-700 transition-all cursor-pointer">
                        Select a Tracker
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* --- VIEW: SUBSCRIPTION MANAGER --- */}
              {currentView === "subscription" && (
                <div className="space-y-8">
                  <div className="text-center space-y-4">
                    <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Premium Upgrades
                    </span>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Unlock Premium Speed & Capabilities</h2>
                    <p className="text-slate-400 max-w-lg mx-auto text-sm">
                      Get instant 5-second tracking intervals, premium email dispatches, and full access to our predictive AI Cricket Oracle.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 max-w-5xl mx-auto">
                    
                    {/* Free Card */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-8 flex flex-col justify-between space-y-8 relative">
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Tier</span>
                        <h3 className="text-3xl font-black text-white">₹0 <span className="text-sm font-semibold text-slate-500">/ month</span></h3>
                        <p className="text-xs text-slate-400 leading-relaxed">Perfect for getting started with basic price tracking alert rules.</p>
                        <ul className="space-y-2.5 pt-4 text-xs text-slate-300">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" /> <span>Up to 5 Active Trackers</span></li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" /> <span>Standard Check Interval</span></li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" /> <span>Basic Price History Chart</span></li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => handleUpgradeSubscription("Free")}
                        className={`w-full font-bold py-3 rounded-xl text-sm transition-all cursor-pointer ${
                          currentUser?.subscription === "Free" 
                            ? "bg-slate-800 text-slate-300 border border-slate-700/80 cursor-default" 
                            : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
                        }`}
                        disabled={currentUser?.subscription === "Free" || checkoutLoading}
                      >
                        {currentUser?.subscription === "Free" ? "Current Plan" : "Downgrade"}
                      </button>
                    </div>

                    {/* Pro Card */}
                    <div className="bg-slate-950/80 border border-orange-500/30 rounded-2xl p-8 flex flex-col justify-between relative shadow-xl shadow-orange-500/5">
                      <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full border border-orange-400/20 tracking-wide">
                        RECOMMENDED
                      </div>
                      <div className="space-y-8">
                        <div>
                          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Pro Plan</span>
                          <h3 className="text-3xl font-extrabold text-white mt-1">₹20 <span className="text-xs text-slate-400">/ month</span></h3>
                          <p className="text-slate-400 text-xs mt-2">Best for active shoppers looking for instant, blazing-fast alerts</p>
                        </div>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-orange-400" />
                            <span>Up to 50 active trackers</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-orange-400" />
                            <span className="font-semibold text-white">Ultra-fast 5-second interval</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-orange-400" />
                            <span>Instant Email notifications</span>
                          </li>
                          <div className="border-t border-slate-800/60 my-2"></div>
                          <li className="flex items-center gap-3 text-sm text-slate-300 font-semibold">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>AI Price Sentiment Analysis</span>
                          </li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => handleUpgradeSubscription("Pro")}
                        disabled={currentUser?.subscription === "Pro" || checkoutLoading}
                        className={`w-full mt-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          currentUser?.subscription === "Pro"
                            ? "bg-slate-900 border border-slate-800 text-slate-400 cursor-default"
                            : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 active:scale-[0.98]"
                        }`}
                      >
                        {checkoutLoading && checkoutPlan === "Pro" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        <span>{currentUser?.subscription === "Pro" ? "Current Plan" : "Upgrade to Pro (₹20)"}</span>
                      </button>
                    </div>

                    {/* Premium Card */}
                    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-8 flex flex-col justify-between relative">
                      <div className="space-y-8">
                        <div>
                          <span className="text-xs font-bold text-indigo-400 tracking-wide uppercase">Premium Plan</span>
                          <h3 className="text-3xl font-extrabold text-white tracking-tight mt-1">₹50 <span className="text-slate-500 text-sm">/ month</span></h3>
                          <p className="text-slate-400 text-xs mt-2">Unlimited tracking power with full Predictive Cricket Oracle access</p>
                        </div>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-orange-400" />
                            <span>Unlimited price trackers</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-orange-400" />
                            <span className="font-semibold text-white">Ultra-fast 5-second interval</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-300 font-semibold">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>AI Cricket Next-Ball Oracle</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-orange-400" />
                            <span>Priority AI support & alerts</span>
                          </li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => handleUpgradeSubscription("Premium")}
                        disabled={currentUser?.subscription === "Premium" || checkoutLoading}
                        className={`w-full mt-6 py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          currentUser?.subscription === "Premium"
                            ? "bg-slate-900 text-slate-500 border-slate-800 cursor-default"
                            : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {checkoutLoading && checkoutPlan === "Premium" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        <span>{currentUser?.subscription === "Premium" ? "Current Plan" : "Get Premium (₹50)"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Email & Notification Verification Console */}
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-3xl p-8 max-w-5xl mx-auto mt-12 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Mail className="w-5 h-5 text-orange-400" />
                          <span>Email Notification & Alerts Center</span>
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                          Verify and test your Gmail SMTP notification channels. Clicking the button below sends a beautifully designed transaction email to <strong className="text-slate-200">{currentUser?.email}</strong> using the configured server SMTP transporter.
                        </p>
                      </div>
                      <button
                        onClick={handleSendTestEmail}
                        disabled={sendingTestMail}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-6 rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-center shadow-lg shadow-orange-500/10"
                      >
                        {sendingTestMail ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending Test Mail...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Test Email</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              )}

              {/* --- VIEW: NEXT BALL ORACLE --- */}
              {currentView === "oracle" && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  
                  {/* Glowing header card */}
                  <div className="relative bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-500/15 rounded-3xl p-8 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-gradient-to-tr from-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-extrabold px-3.5 py-1.5 rounded-full tracking-wider uppercase shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Predictive AI Engine</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">AI Cricket Next-Ball Oracle</h2>
                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                          Harness the power of game-theoretic modeling and situational analysis to divine the fate of the next delivery. Configure your match scenario below and let the oracle compute the probabilities.
                        </p>
                      </div>
                      
                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center border border-amber-500/25 text-amber-400">
                          <Compass className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Oracle Connection</p>
                          <p className="text-xs text-emerald-400 font-bold font-mono">● FIREBASE & GEMINI SYNCED</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Panel: Scenario Configurator */}
                    <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 lg:p-8 space-y-6 flex flex-col justify-between">
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
                          <Sliders className="w-5 h-5 text-amber-500" />
                          <span>Configure Match Scenario</span>
                        </h3>

                        {/* Match Format */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Match Format</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["T20", "ODI", "Test"] as const).map((fmt) => (
                              <button
                                key={fmt}
                                onClick={() => setOracleFormat(fmt)}
                                className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                                  oracleFormat === fmt
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500/20 shadow-md"
                                    : "bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white"
                                }`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Stage of the Match */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Match Stage</label>
                          <select
                            value={oracleMatchStage}
                            onChange={(e) => setOracleMatchStage(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-xs font-medium focus:border-amber-500 transition-all outline-none"
                          >
                            <option value="Powerplay">Powerplay (Aggressive bat, tight fields)</option>
                            <option value="Middle Overs">Middle Overs (Strike rotation, spin choke)</option>
                            <option value="Death Overs">Death Overs (Maximum risk, slogging, yorkers)</option>
                            <option value="First Session">First Session - Test (Fresh pitch, swing)</option>
                            <option value="Last Day Pitch">Last Day Pitch - Test (Cracks, high spin)</option>
                          </select>
                        </div>

                        {/* Bowler and Batsman Matchup */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Bowler Type</label>
                            <select
                              value={oracleBowlerType}
                              onChange={(e) => setOracleBowlerType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-3 text-xs font-medium focus:border-amber-500 transition-all outline-none"
                            >
                              <option value="Right-arm Fast">Right-arm Fast/Medium</option>
                              <option value="Left-arm Fast">Left-arm Fast</option>
                              <option value="Right-arm Off-Spin">Right-arm Off-Spin</option>
                              <option value="Leg-Spin">Leg-Spin / Wrist spin</option>
                              <option value="Left-arm Orthodox">Left-arm Orthodox</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Batsman Style</label>
                            <select
                              value={oracleBatsmanStyle}
                              onChange={(e) => setOracleBatsmanStyle(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-3 text-xs font-medium focus:border-amber-500 transition-all outline-none"
                            >
                              <option value="Right-Handed Power-hitter">RHB Power-hitter</option>
                              <option value="Right-Handed Anchor">RHB Technical Anchor</option>
                              <option value="Left-Handed Power-hitter">LHB Power-hitter</option>
                              <option value="Left-Handed Anchor">LHB Technical Anchor</option>
                              <option value="Tailender">Tailender / Lower Order</option>
                            </select>
                          </div>
                        </div>

                        {/* Current Over & Runs Needed */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overs & Ball (e.g. 19.2)</label>
                            <input
                              type="text"
                              placeholder="e.g. 19.2"
                              value={oracleCurrentOver}
                              onChange={(e) => setOracleCurrentOver(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-xs focus:border-amber-500 transition-all outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Required Run Rate / Context</label>
                            <input
                              type="text"
                              placeholder="e.g. 12 runs off 5 balls"
                              value={oracleRunsNeeded}
                              onChange={(e) => setOracleRunsNeeded(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-xs focus:border-amber-500 transition-all outline-none"
                            />
                          </div>
                        </div>

                        {/* Custom Match Situation Description */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Match Situation / Additional Context</label>
                          <textarea
                            placeholder="Describe bowler's recent form, batsman's weakness, pitch conditions, boundaries dimensions, or any dynamic play details..."
                            value={oracleMatchSituation}
                            onChange={(e) => setOracleMatchSituation(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-xs focus:border-amber-500 transition-all outline-none resize-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={predictNextBall}
                        disabled={oraclePredictionLoading}
                        className="w-full mt-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/10 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 text-sm"
                      >
                        {oraclePredictionLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Consulting Celestial Spheres...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 text-amber-200" />
                            <span>Divine Next Delivery 🔮</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right Panel: Prediction Results */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      
                      {oraclePredictionLoading ? (
                        <div className="flex-1 min-h-[400px] bg-slate-950/40 border border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-white font-extrabold text-lg">The Oracle is Computing</h4>
                            <p className="text-slate-500 text-xs max-w-sm">Parsing bowler release angles, match pressure indicators, batting trigger movements, and historical ground analytics...</p>
                          </div>
                        </div>
                      ) : oraclePredictionResult ? (
                        <div className="space-y-6">
                          
                          {/* Prediction Callout Card */}
                          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 p-4">
                              <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-mono text-[10px] font-bold">
                                CONFIDENCE: {oraclePredictionResult.confidence}%
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Oracle Prediction Outcome</span>
                                <h4 className="text-3xl font-black text-amber-400 tracking-tight mt-1">
                                  {oraclePredictionResult.nextBallPrediction}
                                </h4>
                              </div>

                              <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl relative">
                                <span className="absolute -top-2 left-4 px-2 bg-slate-950 text-[8px] font-bold text-slate-500 uppercase font-mono tracking-wider">Commentator's Voice</span>
                                <p className="text-slate-300 italic text-sm font-mono leading-relaxed pl-1 pt-1">
                                  "{oraclePredictionResult.narrative}"
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Matchup Probabilities & Analysis Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Probabilities */}
                            <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                              <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-900 pb-2">Outcome Distribution</h4>
                              <div className="space-y-3 pt-1">
                                {oraclePredictionResult.probabilities?.map((prob: any, idx: number) => {
                                  const isTop = prob.outcome === oraclePredictionResult.nextBallPrediction;
                                  return (
                                    <div key={idx} className="space-y-1">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className={`font-semibold ${isTop ? "text-amber-400" : "text-slate-400"}`}>
                                          {prob.outcome}
                                        </span>
                                        <span className={`font-mono font-bold ${isTop ? "text-amber-400" : "text-slate-500"}`}>
                                          {prob.value}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${isTop ? "bg-gradient-to-r from-orange-500 to-amber-500" : "bg-slate-700"}`}
                                          style={{ width: `${prob.value}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Technical key factors */}
                            <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-900 pb-2">Technical Analysis</h4>
                                <ul className="space-y-3 pt-1">
                                  {oraclePredictionResult.keyFactors?.map((factor: string, idx: number) => (
                                    <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 leading-relaxed">
                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                                      <span>{factor}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-[10px] text-amber-400/80 leading-relaxed mt-4">
                                <strong>Clairvoyant disclaimer:</strong> AI predictions are probabilistic and generated dynamically based on statistical trends and match context.
                              </div>
                            </div>
                          </div>

                          {/* Tactical suggestions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-5 space-y-2">
                              <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest font-mono">Bowler's Tactical Blueprint</span>
                              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                                {oraclePredictionResult.tacticsBowler}
                              </p>
                            </div>

                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-5 space-y-2">
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Batsman's Response Blueprint</span>
                              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                                {oraclePredictionResult.tacticsBatsman}
                              </p>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="flex-1 min-h-[400px] bg-slate-950/20 border border-slate-800/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-14 h-14 bg-slate-900/80 rounded-2xl flex items-center justify-center border border-slate-800">
                            <Sparkles className="w-6 h-6 text-amber-500/60" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-slate-400 font-extrabold text-base">Oracle Manifestation Awaiting</h4>
                            <p className="text-slate-500 text-xs max-w-sm">Configure your specific bowler/batsman matchups and match formats, then tap 'Divine Next Delivery' to unveil the outcome prediction.</p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Prediction History Table */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 lg:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <History className="w-5 h-5 text-amber-500" />
                          <span>Oracle Consultation Log</span>
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">Your past cricket delivery predictions persisted on Firebase.</p>
                      </div>
                      
                      {oracleHistoryLoading && (
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      )}
                    </div>

                    {oracleHistoryList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-500 uppercase tracking-wider font-bold border-b border-slate-900">
                              <th className="py-3 px-4">Scenario Details</th>
                              <th className="py-3 px-4">Match Format</th>
                              <th className="py-3 px-4">Match Stage</th>
                              <th className="py-3 px-4">AI Predicted Outcome</th>
                              <th className="py-3 px-4 text-right">Confidence</th>
                              <th className="py-3 px-4 text-right">Consultation Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {oracleHistoryList.map((hist, idx) => (
                              <tr 
                                key={idx} 
                                onClick={() => {
                                  setOraclePredictionResult(hist.prediction);
                                  setOracleFormat(hist.scenario.format);
                                  setOracleBowlerType(hist.scenario.bowlerType);
                                  setOracleBatsmanStyle(hist.scenario.batsmanStyle);
                                  setOracleCurrentOver(hist.scenario.currentOver || "");
                                  setOracleRunsNeeded(hist.scenario.runsNeeded || "");
                                  setOracleMatchStage(hist.scenario.matchStage);
                                  setOracleMatchSituation(hist.scenario.matchSituation || "");
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="hover:bg-slate-900/40 cursor-pointer transition-colors"
                              >
                                <td className="py-4 px-4 font-medium text-slate-300">
                                  <div className="font-bold text-white">{hist.scenario.bowlerType} vs {hist.scenario.batsmanStyle}</div>
                                  <div className="text-[10px] text-slate-500 truncate max-w-xs">{hist.scenario.matchSituation || "No additional context"}</div>
                                </td>
                                <td className="py-4 px-4 text-slate-400 font-semibold">{hist.scenario.format}</td>
                                <td className="py-4 px-4 text-slate-400">{hist.scenario.matchStage}</td>
                                <td className="py-4 px-4">
                                  <span className="font-extrabold text-amber-400">{hist.prediction?.nextBallPrediction}</span>
                                </td>
                                <td className="py-4 px-4 text-right font-mono font-bold text-slate-300">{hist.prediction?.confidence}%</td>
                                <td className="py-4 px-4 text-right text-slate-500">{new Date(hist.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        No previous oracle consultations found. Start predicting delivery outcomes to build your logs!
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* SECURE CHECKOUT / UPI PAYMENT MODAL */}
      <AnimatePresence>
        {checkoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 md:p-8 space-y-6">
                
                {/* Header info */}
                <div className="text-center space-y-2 pb-2 border-b border-slate-800/60">
                  <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    🔒 SECURE MERCHANT PAYMENTS
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Upgrade to {checkoutPlan} Plan</h3>
                  <p className="text-xs text-slate-400">Scan and complete the transaction securely below to upgrade instantly.</p>
                </div>

                {/* Pricing / Gateway Badge */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gateway Operator</p>
                    <p className="text-sm font-bold text-slate-300">Secure UPI Portal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Charge</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono">₹{checkoutPrice}.00</p>
                  </div>
                </div>

                {/* QR Code Segment */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200">
                    {checkoutQrUrl ? (
                      <img 
                        src={checkoutQrUrl} 
                        alt="Secure UPI Merchant QR Code" 
                        className="w-48 h-48 block"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center space-y-1 max-w-sm">
                    <p className="text-xs text-slate-300 font-bold">Scan using GPay, PhonePe, Paytm, or BHIM</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      This QR securely routes your payment directly to our support registry. Your personal bank details and phone numbers are completely masked and private.
                    </p>
                  </div>
                </div>

                {/* UTR Verification Field */}
                <div className="space-y-2 border-t border-slate-800/60 pt-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Enter 12-Digit UPI Ref No. / UTR / Txn ID
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. 312456789012"
                      maxLength={12}
                      value={checkoutUtr}
                      onChange={(e) => setCheckoutUtr(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl pl-4 pr-32 py-3 text-sm focus:border-emerald-500 transition-all outline-none font-mono"
                    />
                    
                    <button
                      onClick={handleVerifyCheckoutPayment}
                      disabled={checkoutVerifying}
                      className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs px-4 rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {checkoutVerifying ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify</span>
                          <Check className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Enter the standard 12-digit reference number from your payment receipt to instantly verify and unlock premium access.
                  </p>
                </div>

                {/* Privacy Assurance Banner */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                    <strong>Zero-disclosure privacy protocol active:</strong> We never share your account, credentials, or payment details. Transactions are verified completely anonymously on the server-side.
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- GOOGLE FALLBACK AUTH MODAL --- */}
      <AnimatePresence>
        {showGoogleFallback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoogleFallback(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>Google Auth Fallback</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Google Sign-In was blocked or is not supported in the sandbox iframe. Use this local developer bypass to sign in or register instantly.
                  </p>
                </div>
                <button 
                  onClick={() => setShowGoogleFallback(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGoogleFallbackSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Google Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required 
                      value={googleFallbackEmail} 
                      onChange={(e) => setGoogleFallbackEmail(e.target.value)}
                      placeholder="your.email@gmail.com" 
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={googleFallbackUsername} 
                      onChange={(e) => setGoogleFallbackUsername(e.target.value)}
                      placeholder="Google User Name" 
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-700 text-white"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowGoogleFallback(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                  >
                    {authLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
