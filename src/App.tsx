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
  X,
  ExternalLink,
  Settings,
  GitCompare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  isSimulated?: boolean;
}

const getRichPriceHistory = (tracker: Tracker, fetchedHistory: PricePoint[]): PricePoint[] => {
  if (fetchedHistory && fetchedHistory.length >= 3) {
    return fetchedHistory;
  }
  
  const basePrice = tracker.currentPrice;
  const simulatedHistory: PricePoint[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    let factor = 1.0;
    if (i === 6) factor = 1.08;
    else if (i === 5) factor = 1.05;
    else if (i === 4) factor = 1.06;
    else if (i === 3) factor = 0.96; // a price dip
    else if (i === 2) factor = 1.02;
    else if (i === 1) factor = 1.01;
    else factor = 1.0;
    
    const simPrice = Math.round(basePrice * factor);
    
    simulatedHistory.push({
      price: i === 0 ? basePrice : simPrice,
      recordedAt: date.toISOString(),
      isSimulated: i > 0
    });
  }
  return simulatedHistory;
};

interface AIReview {
  overallRating: number;
  categories: { name: string; score: number }[];
  pros: string[];
  cons: string[];
  recommendation: string;
  verdictSummary: string;
}

interface PriceComparisonItem {
  storeName: string;
  price: number;
  url: string;
  availability: string;
  deliveryTime: string;
}

interface PriceComparisonData {
  comparisons: PriceComparisonItem[];
  savingsVerdict: string;
  groundingSources?: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
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

  // Dashboard state
  const [currentView, setView] = useState<"new" | "my-trackers" | "trends" | "settings" | "oracle" | "compare">("new");
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

  // Settings State Toggles
  const [settingsWhatsAppAlerts, setSettingsWhatsAppAlerts] = useState(true);
  const [settingsTelegramAlerts, setSettingsTelegramAlerts] = useState(true);
  const [settingsEmailAlerts, setSettingsEmailAlerts] = useState(true);
  const [settingsWeeklySummary, setSettingsWeeklySummary] = useState(false);

  // Selected tracker for details & history
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [priceHistory, setHistory] = useState<PricePoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [aiReview, setAiReview] = useState<AIReview | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<PriceComparisonData | null>(null);

  // Compare Products Tab States
  const [compareUrl1, setCompareUrl1] = useState("");
  const [compareUrl2, setCompareUrl2] = useState("");
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [compareResult, setCompareResult] = useState<any | null>(null);

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

  useEffect(() => {
    if (currentView === "trends" && !selectedTracker && trackers.length > 0) {
      handleSelectTrackerForTrends(trackers[0]);
    }
  }, [currentView, selectedTracker, trackers]);

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
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setTrackers([]);
    setActivityLogs([]);
    setView("new");
    showToast("Successfully logged out", "success");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    if (isLogin) {
      try {
        const res = await fetch("/api/auth/local-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword
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
          showToast("Logged in successfully!", "success");
        } else {
          const errData = await res.json();
          throw new Error(errData.error || "Authentication failed.");
        }
      } catch (err: any) {
        console.error("Login error:", err);
        const msg = err.message || "Invalid email or password.";
        setAuthError(msg);
        showToast(msg, "error");
      } finally {
        setAuthLoading(false);
      }
    } else {
      try {
        const res = await fetch("/api/auth/local-signup", {
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
          showToast("Account created successfully!", "success");
        } else {
          const errData = await res.json();
          throw new Error(errData.error || "Registration failed.");
        }
      } catch (err: any) {
        console.error("Signup error:", err);
        const msg = err.message || "Failed to create account. Please try again.";
        setAuthError(msg);
        showToast(msg, "error");
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
        body: JSON.stringify({ 
          url: productUrl, 
          targetPrice: parseFloat(targetPrice),
          currentPrice: scrapedDetails ? scrapedDetails.price : undefined,
          productName: scrapedDetails ? scrapedDetails.productName : undefined,
          productImage: scrapedDetails ? scrapedDetails.image : undefined
        })
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

  // Compare Two Products
  const handleCompareProducts = async () => {
    if (!compareUrl1.trim() || !compareUrl2.trim()) {
      setCompareError("Please enter both product links to run comparison");
      return;
    }
    setCompareLoading(true);
    setCompareError("");
    setCompareResult(null);

    try {
      const res = await fetch("/api/ai/compare-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ url1: compareUrl1, url2: compareUrl2 })
      });
      const data = await res.json();
      if (res.ok) {
        setCompareResult(data);
        showToast("Products compared successfully!", "success");
      } else {
        setCompareError(data.error || "Could not analyze product comparison");
        showToast(data.error || "Comparison analysis failed", "error");
      }
    } catch (err) {
      setCompareError("Failed to connect to the comparison engine.");
      showToast("Comparison server connection error", "error");
    } finally {
      setCompareLoading(false);
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
    setComparisonData(null);
    setLoadingReview(true);
    setLoadingHistory(true);
    setLoadingComparison(true);

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

    try {
      // Fetch Price Comparison Data
      const cRes = await fetch(`/api/ai/compare-prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          productName: tracker.productName,
          currentPrice: tracker.currentPrice,
          url: tracker.url
        })
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setComparisonData(cData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleSimulateDrop = () => {
    if (!selectedTracker) return;
    const currentPrices = getRichPriceHistory(selectedTracker, priceHistory);
    if (currentPrices.length === 0) return;
    
    const target = selectedTracker.targetPrice;
    const newPrice = Math.round(target * 0.92); // drops below target
    
    const newPoint: PricePoint = {
      price: newPrice,
      recordedAt: new Date().toISOString(),
      isSimulated: true
    };
    
    const updatedHistory = [...currentPrices, newPoint];
    setHistory(updatedHistory);
    
    // Also update selected tracker in the UI
    setSelectedTracker({
      ...selectedTracker,
      currentPrice: newPrice
    });
    
    showToast(`Simulated direct price drop to ₹${newPrice.toLocaleString("en-IN")}! Target reached!`, "success");
  };

  const handleGenerateDenseHistory = () => {
    if (!selectedTracker) return;
    const basePrice = selectedTracker.currentPrice;
    const simulated: PricePoint[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const randomFactor = 1.05 + Math.sin(i / 2) * 0.05 - (i * 0.001);
      const simPrice = Math.round(basePrice * randomFactor);
      simulated.push({
        price: i === 0 ? basePrice : simPrice,
        recordedAt: date.toISOString(),
        isSimulated: i > 0
      });
    }
    setHistory(simulated);
    showToast("Generated dense 30-day historical chart diagram!", "success");
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
                  <span className="flex-1">{authError}</span>
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
                  onClick={() => setView("compare")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    currentView === "compare" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <GitCompare className="w-5 h-5" />
                  <span>Compare Products</span>
                  <span className="ml-auto bg-orange-500/10 text-orange-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-orange-500/20">
                    AI Duel
                  </span>
                </button>

                <button 
                  onClick={() => setView("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    currentView === "settings" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                  <span className="ml-auto bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/20">
                    Channels
                  </span>
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
                <span className="text-emerald-400 font-bold">5-second loop</span>
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
                          <div className="flex flex-col sm:flex-row gap-4">
                            {scrapedDetails.image && (
                              <img src={scrapedDetails.image} alt="scraped preview" className="w-20 h-20 object-cover rounded-xl border border-slate-800/80 bg-white mx-auto sm:mx-0" />
                            )}
                            <div className="space-y-3 flex-1">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[10px] bg-orange-500/10 text-orange-400 font-extrabold px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-wide">
                                  {getStoreName(productUrl)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Analysis Override</span>
                              </div>

                              {/* Product Name Input */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Product Title</label>
                                <input 
                                  type="text" 
                                  value={scrapedDetails.productName}
                                  onChange={(e) => setScrapedDetails({ ...scrapedDetails, productName: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2 px-3 text-xs text-white outline-none transition-all font-semibold"
                                  placeholder="Product Name"
                                />
                              </div>

                              {/* Current Price Input */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Price (₹)</label>
                                <input 
                                  type="number" 
                                  value={scrapedDetails.price}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setScrapedDetails({ ...scrapedDetails, price: val });
                                    setTargetPrice(Math.round(val * 0.9).toString());
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2 px-3 text-xs text-emerald-400 outline-none transition-all font-bold"
                                  placeholder="Current Price"
                                />
                              </div>
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
                      {trackers.map((t, idx) => {
                        const isReached = t.currentPrice <= t.targetPrice;
                        return (
                          <motion.div 
                            key={`${t.id || idx}-${idx}`}
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
                                  <span className="text-[9px] bg-slate-800 text-slate-300 font-extrabold px-2 py-0.5 rounded border border-slate-700 uppercase tracking-wide flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5" />
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
                                <a 
                                  href={t.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-white text-base leading-snug hover:text-orange-400 hover:underline transition-colors flex items-center gap-1.5 min-w-0 pr-4 group cursor-pointer"
                                  title="Open Product in New Tab"
                                >
                                  <span className="truncate">{t.productName}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 flex-shrink-0" />
                                </a>
                                <a 
                                  href={t.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-slate-500 hover:text-slate-300 hover:underline truncate block cursor-pointer"
                                  title={t.url}
                                >
                                  {t.url}
                                </a>
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

                            <a 
                              href={t.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`w-full text-xs font-bold py-2.5 px-4 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isReached 
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white shadow-lg shadow-emerald-500/10" 
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                              }`}
                            >
                              <span>{isReached ? "Deal Reached! Buy Now" : "Visit Product Page"}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

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
                        {activityLogs.map((log, idx) => (
                          <div key={`${log.id || idx}-${idx}`} className="flex justify-between items-start text-xs border-b border-slate-900 pb-3 last:border-0 last:pb-0">
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
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-5 border border-slate-800/80 rounded-2xl">
                        <div className="space-y-1.5 flex-1 w-full">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Active Tracker</span>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <select 
                              value={selectedTracker.id} 
                              onChange={(e) => {
                                const found = trackers.find(t => String(t.id) === e.target.value);
                                if (found) handleSelectTrackerForTrends(found);
                              }}
                              className="bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none w-full sm:max-w-md font-semibold cursor-pointer shadow-inner"
                            >
                              {trackers.map((t, idx) => (
                                <option key={`${t.id || idx}-${idx}`} value={t.id}>{t.productName} ({getStoreName(t.url)})</option>
                              ))}
                            </select>
                            
                            <a 
                              href={selectedTracker.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:brightness-110 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/10 transition-all self-stretch sm:self-center"
                              title="Go to original store website"
                            >
                              <span>Visit Store Page</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        <button onClick={() => setView("my-trackers")} className="bg-slate-800 text-slate-300 px-4 py-2.5 border border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer w-full md:w-auto transition-all">
                          Back to Trackers
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Price History Line Graph */}
                        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-base font-bold text-white">Interactive Price Diagram</h3>
                              <p className="text-xs text-slate-500">Hover coordinates to inspect checked price points, targets, and simulated price drop alerts.</p>
                            </div>
                            
                            {/* Interactive control buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button 
                                onClick={handleSimulateDrop}
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                title="Simulate a sudden price drop to trigger email alerts"
                              >
                                <span>Simulate Drop 📉</span>
                              </button>
                              <button 
                                onClick={handleGenerateDenseHistory}
                                className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                title="Populate realistic 30-day volatility walk"
                              >
                                <span>30D History 📊</span>
                              </button>
                            </div>
                          </div>
                          
                          {loadingHistory ? (
                            <div className="flex justify-center py-20">
                              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Responsive SVG Line Graph Diagram */}
                              {(() => {
                                const activeHistory = getRichPriceHistory(selectedTracker, priceHistory);
                                if (activeHistory.length === 0) {
                                  return (
                                    <div className="text-center py-12 text-slate-500 text-sm">
                                      No history points recorded yet.
                                    </div>
                                  );
                                }

                                const maxPrice = Math.max(...activeHistory.map(p => p.price), selectedTracker.targetPrice, selectedTracker.currentPrice);
                                const minPrice = Math.min(...activeHistory.map(p => p.price), selectedTracker.targetPrice, selectedTracker.currentPrice);
                                const priceBuffer = (maxPrice - minPrice) * 0.15 || 100;
                                const chartMax = maxPrice + priceBuffer;
                                const chartMin = Math.max(0, minPrice - priceBuffer);
                                const priceRange = chartMax - chartMin || 1;

                                const getX = (index: number) => {
                                  if (activeHistory.length <= 1) return 55 + 420 / 2;
                                  return 55 + (index / (activeHistory.length - 1)) * 420;
                                };

                                const getY = (price: number) => {
                                  return 25 + (1 - (price - chartMin) / priceRange) * 180;
                                };

                                const linePath = activeHistory.map((h, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(h.price)}`).join(" ");
                                const areaPath = activeHistory.length > 0 
                                  ? `${linePath} L ${getX(activeHistory.length - 1)} ${205} L ${getX(0)} ${205} Z`
                                  : "";

                                const targetY = getY(selectedTracker.targetPrice);
                                const currentY = getY(selectedTracker.currentPrice);

                                return (
                                  <div className="h-72 w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 relative overflow-visible">
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 240" preserveAspectRatio="none">
                                      <defs>
                                        <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25"/>
                                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.0"/>
                                        </linearGradient>
                                        <linearGradient id="target-glow" x1="0" y1="0" x2="1" y2="0">
                                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"/>
                                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0"/>
                                        </linearGradient>
                                      </defs>

                                      {/* Grid lines Y-axis */}
                                      {[0.25, 0.5, 0.75].map((ratio, index) => {
                                        const value = chartMin + priceRange * ratio;
                                        const y = getY(value);
                                        return (
                                          <g key={index}>
                                            <line 
                                              x1={55} 
                                              y1={y} 
                                              x2={475} 
                                              y2={y} 
                                              stroke="#334155" 
                                              strokeWidth="1" 
                                              strokeDasharray="4 4" 
                                              opacity="0.3" 
                                            />
                                            <text 
                                              x={45} 
                                              y={y + 3} 
                                              fill="#64748b" 
                                              fontSize="8" 
                                              fontWeight="bold" 
                                              textAnchor="end"
                                            >
                                              ₹{Math.round(value).toLocaleString("en-IN")}
                                            </text>
                                          </g>
                                        );
                                      })}

                                      {/* Vertical grid lines X-axis for checked times */}
                                      {activeHistory.map((h, i) => {
                                        const x = getX(i);
                                        return (
                                          <line 
                                            key={i} 
                                            x1={x} 
                                            y1={25} 
                                            x2={x} 
                                            y2={205} 
                                            stroke="#334155" 
                                            strokeWidth="1" 
                                            strokeDasharray="4 4" 
                                            opacity="0.2" 
                                          />
                                        );
                                      })}

                                      {/* Horizontal Target Price Line with indicator badge */}
                                      <line 
                                        x1={55} 
                                        y1={targetY} 
                                        x2={475} 
                                        y2={targetY} 
                                        stroke="#f97316" 
                                        strokeWidth="1.5" 
                                        strokeDasharray="5 5" 
                                        className="animate-pulse"
                                      />
                                      <text 
                                        x={475} 
                                        y={targetY - 5} 
                                        fill="#f97316" 
                                        fontSize="9" 
                                        fontWeight="black" 
                                        textAnchor="end"
                                        className="uppercase tracking-wider"
                                      >
                                        Target: ₹{selectedTracker.targetPrice.toLocaleString("en-IN")}
                                      </text>

                                      {/* Horizontal Current Price Line */}
                                      <line 
                                        x1={55} 
                                        y1={currentY} 
                                        x2={475} 
                                        y2={currentY} 
                                        stroke="#10b981" 
                                        strokeWidth="1.5" 
                                        strokeDasharray="5 5" 
                                      />
                                      <text 
                                        x={475} 
                                        y={currentY - 5} 
                                        fill="#10b981" 
                                        fontSize="9" 
                                        fontWeight="black" 
                                        textAnchor="end"
                                        className="uppercase tracking-wider"
                                      >
                                        Current: ₹{selectedTracker.currentPrice.toLocaleString("en-IN")}
                                      </text>

                                      {/* Area chart filled gradient */}
                                      <path d={areaPath} fill="url(#gradient-area)" />

                                      {/* Price trend stroke path line */}
                                      <path 
                                        d={linePath} 
                                        fill="none" 
                                        stroke="#f97316" 
                                        strokeWidth="3.5" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                      />

                                      {/* Hover indicator vertical bar line */}
                                      {hoveredIndex !== null && hoveredPoint && (
                                        <g>
                                          <line 
                                            x1={getX(hoveredIndex)} 
                                            y1={25} 
                                            x2={getX(hoveredIndex)} 
                                            y2={205} 
                                            stroke="#f8fafc" 
                                            strokeWidth="1.5" 
                                            strokeDasharray="3 3" 
                                          />
                                          <circle 
                                            cx={getX(hoveredIndex)} 
                                            cy={getY(hoveredPoint.price)} 
                                            r="7" 
                                            fill="#f97316" 
                                            stroke="#ffffff" 
                                            strokeWidth="2.5" 
                                          />
                                        </g>
                                      )}

                                      {/* Individual price markers / coordinates */}
                                      {activeHistory.map((h, i) => (
                                        <g key={i}>
                                          <circle 
                                            cx={getX(i)} 
                                            cy={getY(h.price)} 
                                            r="3.5" 
                                            fill="#0f172a" 
                                            stroke="#f97316" 
                                            strokeWidth="2" 
                                          />
                                          {/* Hidden wider interactive hover hit area target */}
                                          <circle 
                                            cx={getX(i)} 
                                            cy={getY(h.price)} 
                                            r="14" 
                                            fill="transparent" 
                                            className="cursor-crosshair"
                                            onMouseEnter={() => {
                                              setHoveredPoint(h);
                                              setHoveredIndex(i);
                                            }}
                                            onMouseLeave={() => {
                                              setHoveredPoint(null);
                                              setHoveredIndex(null);
                                            }}
                                          />
                                        </g>
                                      ))}
                                    </svg>

                                    {/* X-axis date endpoints labels */}
                                    <div className="absolute bottom-2 left-14 right-8 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      <span>{new Date(activeHistory[0].recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                                      {activeHistory.length > 2 && (
                                        <span>{new Date(activeHistory[Math.floor(activeHistory.length / 2)].recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                                      )}
                                      <span>{new Date(activeHistory[activeHistory.length - 1].recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                                    </div>

                                    {/* Absolute Interactive Tooltip Display inside SVG Chart */}
                                    {hoveredPoint && hoveredIndex !== null && (
                                      <div 
                                        className="absolute bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-[11px] pointer-events-none z-10 space-y-1 backdrop-blur-md"
                                        style={{
                                          left: `${Math.min(68, Math.max(12, (getX(hoveredIndex) / 500) * 100 - 15))}%`,
                                          top: "35px",
                                          width: "155px"
                                        }}
                                      >
                                        <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                          {new Date(hoveredPoint.recordedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-white text-sm font-black">₹{hoveredPoint.price.toLocaleString("en-IN")}</span>
                                          {hoveredPoint.isSimulated && (
                                            <span className="text-[8px] bg-orange-500/20 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded font-black uppercase tracking-wide">Demo</span>
                                          )}
                                        </div>
                                        <div className="border-t border-slate-800/80 pt-1.5 mt-1.5">
                                          {hoveredPoint.price <= selectedTracker.targetPrice ? (
                                            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                              🎉 Reached Target!
                                            </span>
                                          ) : (
                                            <span className="text-slate-400 font-semibold">
                                              ₹{(hoveredPoint.price - selectedTracker.targetPrice).toLocaleString("en-IN")} above target
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Live chart stats / key */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-900/30 border border-slate-800/40 rounded-xl text-center">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Min Recorded</span>
                                  <span className="text-sm font-bold text-emerald-400">
                                    ₹{Math.min(...getRichPriceHistory(selectedTracker, priceHistory).map(p => p.price)).toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Max Recorded</span>
                                  <span className="text-sm font-bold text-rose-400">
                                    ₹{Math.max(...getRichPriceHistory(selectedTracker, priceHistory).map(p => p.price)).toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Fluctuation</span>
                                  <span className="text-sm font-bold text-slate-300">
                                    {(() => {
                                      const h = getRichPriceHistory(selectedTracker, priceHistory);
                                      const min = Math.min(...h.map(p => p.price));
                                      const max = Math.max(...h.map(p => p.price));
                                      return `${(((max - min) / (min || 1)) * 100).toFixed(1)}%`;
                                    })()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Data Source</span>
                                  <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">
                                    {getStoreName(selectedTracker.url)}
                                  </span>
                                </div>
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

                      {/* Live Price Comparison Bento Card */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Search className="w-5 h-5 text-orange-500 animate-pulse" />
                              <span>Google Search Price Comparison</span>
                            </h3>
                            <p className="text-xs text-slate-500">Live internet scanning powered by Gemini Google Search grounding across top retail stores.</p>
                          </div>
                          
                          {/* Verification badge / source count */}
                          {comparisonData?.groundingSources && comparisonData.groundingSources.length > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400 uppercase tracking-wider self-start sm:self-center">
                              <ExternalLink className="w-3 h-3" />
                              <span>Verified by {comparisonData.groundingSources.length} Web Sources</span>
                            </div>
                          )}
                        </div>

                        {loadingComparison ? (
                          <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            <span className="text-xs text-slate-500 font-bold animate-pulse">Scanning Indian e-commerce landscape via Google Search...</span>
                          </div>
                        ) : comparisonData ? (
                          <div className="space-y-6">
                            
                            {/* Price Comparison Table */}
                            <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-slate-900/10">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="p-4">Store</th>
                                    <th className="p-4">Compare Price</th>
                                    <th className="p-4">Difference</th>
                                    <th className="p-4">Availability</th>
                                    <th className="p-4">Est. Delivery</th>
                                    <th className="p-4 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                  {/* Include current tracked store first as context */}
                                  <tr className="bg-orange-500/5 border-l-2 border-l-orange-500">
                                    <td className="p-4 font-bold flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                      <span>{getStoreName(selectedTracker.url)} (Current)</span>
                                    </td>
                                    <td className="p-4 font-black text-white">₹{selectedTracker.currentPrice.toLocaleString("en-IN")}</td>
                                    <td className="p-4 text-slate-500 font-medium">—</td>
                                    <td className="p-4">
                                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">Tracking</span>
                                    </td>
                                    <td className="p-4 text-slate-500">—</td>
                                    <td className="p-4 text-right">
                                      <a href={selectedTracker.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-bold hover:underline inline-flex items-center gap-1">
                                        <span>View Item</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </td>
                                  </tr>

                                  {/* Scanned comparisons */}
                                  {comparisonData.comparisons.map((item, idx) => {
                                    const diff = item.price - selectedTracker.currentPrice;
                                    const isCheaper = diff < 0;
                                    const diffPct = ((Math.abs(diff) / selectedTracker.currentPrice) * 100).toFixed(1);

                                    return (
                                      <tr key={idx} className="hover:bg-slate-900/30 transition-all">
                                        <td className="p-4 font-bold text-slate-200">{item.storeName}</td>
                                        <td className="p-4 font-extrabold text-white">₹{item.price.toLocaleString("en-IN")}</td>
                                        <td className="p-4 font-semibold">
                                          {diff === 0 ? (
                                            <span className="text-slate-400">Same Price</span>
                                          ) : isCheaper ? (
                                            <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                                              📉 Save {diffPct}% (-₹{Math.abs(diff).toLocaleString("en-IN")})
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">
                                              +{diffPct}% (+₹{diff.toLocaleString("en-IN")})
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-4">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            item.availability?.toLowerCase().includes("in stock") 
                                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                          }`}>
                                            {item.availability || "In Stock"}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-400 font-medium">{item.deliveryTime || "2-3 Days"}</td>
                                        <td className="p-4 text-right">
                                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-bold hover:underline inline-flex items-center gap-1">
                                            <span>Shop Deal</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Verdict & Savings Commentary Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">AI Savings Commentary</h4>
                                  <p className="text-xs text-slate-200 leading-relaxed font-medium">{comparisonData.savingsVerdict}</p>
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-2xl flex flex-col justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider">Recommended Move</h4>
                                  <span className="text-xl font-black text-white block">
                                    {(() => {
                                      const cheapest = Math.min(...comparisonData.comparisons.map(c => c.price));
                                      if (cheapest < selectedTracker.currentPrice) {
                                        return "🛍️ Buy from Partner";
                                      }
                                      return "⏳ Stay Tracked";
                                    })()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                  {(() => {
                                    const cheapest = Math.min(...comparisonData.comparisons.map(c => c.price));
                                    const savings = selectedTracker.currentPrice - cheapest;
                                    if (savings > 0) {
                                      return `You can save up to ₹${savings.toLocaleString("en-IN")} right now by switching store platforms.`;
                                    }
                                    return "Current store remains the cheapest option. Keep alert active for target price drops.";
                                  })()}
                                </p>
                              </div>
                            </div>

                            {/* Web Verification Sources Links list */}
                            {comparisonData.groundingSources && comparisonData.groundingSources.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-slate-800/50">
                                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Search Grounding Sources:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {comparisonData.groundingSources.map((source, i) => {
                                    if (!source.web) return null;
                                    return (
                                      <a 
                                        key={i} 
                                        href={source.web.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 text-slate-400 hover:text-slate-300 py-1 px-2.5 rounded-lg transition-all inline-flex items-center gap-1 font-semibold"
                                      >
                                        <span>{source.web.title || "Web Source"}</span>
                                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>
                        ) : (
                          <div className="text-center py-12 text-slate-500 text-sm">
                            No comparison data available. Click on trend icon for any tracker in 'My Trackers' to fetch.
                          </div>
                        )}
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

              {/* --- VIEW: SETTINGS & INTEGRATIONS --- */}
              {currentView === "settings" && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  
                  {/* Settings Page Header */}
                  <div className="relative bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800/60 rounded-3xl p-8 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-400 border border-orange-500/20 text-xs font-extrabold px-3.5 py-1.5 rounded-full tracking-wider uppercase shadow-sm">
                          <Settings className="w-3.5 h-3.5" />
                          <span>Preferences & Integrations</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Settings & Channels</h2>
                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                          Configure your system preferences, test notification delivery channels, and connect to our official Telegram and WhatsApp channels for premium instant price alerts.
                        </p>
                      </div>
                      
                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/25 text-emerald-400">
                          <ShieldCheck className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">System Security</p>
                          <p className="text-xs text-emerald-400 font-bold font-mono">● LIVE SECURED INTEGRATION</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Channel Integration Section */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-orange-400" />
                            <span>Instant Push Alert Channels</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Follow our official communication streams to receive real-time lightning-fast notifications for every price decrease.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* WhatsApp Channel */}
                          <div className="bg-slate-950/80 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 shadow-lg group">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-all">
                                  {/* Custom SVG WhatsApp Logo */}
                                  <svg className="w-7 h-7 text-emerald-400 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.012 2C6.485 2 2 6.485 2 12.012c0 1.914.537 3.699 1.471 5.214L2 22l4.914-1.413c1.45.836 3.13 1.313 4.914 1.313 5.527 0 10.012-4.485 10.012-10.012C21.84 6.485 17.54 2 12.012 2zm5.728 13.5c-.244.681-1.42 1.251-1.954 1.293-.483.038-.957.191-3.084-.644-2.722-1.07-4.469-3.843-4.605-4.024-.136-.181-1.107-1.472-1.107-2.812 0-1.34 1.012-2.011 1.082-2.152.07-.141.181-.223.272-.223.09 0 .181.011.261.022.09.011.181-.034.283.215.113.272.714 1.737.771 1.85.057.113.09.249.011.396-.079.147-.113.249-.226.385-.113.136-.238.272-.34.396-.113.113-.238.238-.102.476.136.238.6 1.002 1.293 1.618.893.793 1.64 1.042 1.878 1.155.238.113.373.09.51-.068.136-.158.588-.681.747-.917.158-.238.317-.193.532-.113.215.079 1.36.644 1.595.759.238.113.396.17.453.272.057.102.057.588-.181 1.272z" />
                                  </svg>
                                </div>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                                  Official
                                </span>
                              </div>
                              
                              <div className="space-y-1.5">
                                <h4 className="text-base font-bold text-white">WhatsApp Feed</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  Receive daily premium deal summaries and instant push messages directly in WhatsApp.
                                </p>
                              </div>
                            </div>

                            <a 
                              href="https://whatsapp.com/channel/0029Vb7dBD5GpLHLcWWGq40q" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <span>Join WhatsApp Channel</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Telegram Channel */}
                          <div className="bg-slate-950/80 border border-sky-500/20 hover:border-sky-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 shadow-lg group">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-all">
                                  {/* Custom SVG Telegram Logo */}
                                  <svg className="w-7 h-7 text-sky-400 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.74 3.88-1.69 6.46-2.8 7.74-3.32 3.68-1.5 4.44-1.76 4.94-1.77.11 0 .36.03.52.16.14.11.18.27.2.39.02.13.03.38.01.69z"/>
                                  </svg>
                                </div>
                                <span className="text-[10px] bg-sky-500/10 text-sky-400 font-extrabold px-2.5 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider">
                                  Official
                                </span>
                              </div>
                              
                              <div className="space-y-1.5">
                                <h4 className="text-base font-bold text-white">Telegram Broadcast</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  Never miss an update. Join our vibrant Telegram community for direct webhook pings.
                                </p>
                              </div>
                            </div>

                            <a 
                              href="https://t.me/+M7D2ZetGU5hiODE1" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <span>Join Telegram Channel</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                        </div>
                      </div>

                      {/* Interactive Preference Controls */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-orange-400" />
                            <span>Notification Tuning Preferences</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Fine-tune which communication channels are actively dispatched during price alerts.
                          </p>
                        </div>

                        <div className="space-y-4">
                          
                          {/* Toggle WhatsApp Alerts */}
                          <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-white">WhatsApp Feed Synchronization</p>
                              <p className="text-xs text-slate-500">Route active drops to WhatsApp companion feed</p>
                            </div>
                            <button 
                              onClick={() => setSettingsWhatsAppAlerts(!settingsWhatsAppAlerts)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settingsWhatsAppAlerts ? "bg-emerald-500" : "bg-slate-800"}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settingsWhatsAppAlerts ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                          </div>

                          {/* Toggle Telegram Alerts */}
                          <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-white">Telegram Broadcast Webhooks</p>
                              <p className="text-xs text-slate-500">Allow system hooks to notify active Telegram streams</p>
                            </div>
                            <button 
                              onClick={() => setSettingsTelegramAlerts(!settingsTelegramAlerts)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settingsTelegramAlerts ? "bg-sky-500" : "bg-slate-800"}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settingsTelegramAlerts ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                          </div>

                          {/* Toggle Email Alerts */}
                          <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-white">Direct Email Dispatch</p>
                              <p className="text-xs text-slate-500">Send custom transactional emails upon deal threshold trigger</p>
                            </div>
                            <button 
                              onClick={() => setSettingsEmailAlerts(!settingsEmailAlerts)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settingsEmailAlerts ? "bg-orange-500" : "bg-slate-800"}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settingsEmailAlerts ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                          </div>

                          {/* Toggle Weekly Summary */}
                          <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-white">Weekly Savings Digest</p>
                              <p className="text-xs text-slate-500">Receive consolidated historical summary of tracking actions</p>
                            </div>
                            <button 
                              onClick={() => setSettingsWeeklySummary(!settingsWeeklySummary)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settingsWeeklySummary ? "bg-orange-500" : "bg-slate-800"}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settingsWeeklySummary ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                          </div>

                        </div>
                      </div>

                    </div>

                    {/* Right Hand: Test Center & Profile Details */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* SMTP Test Console */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-orange-400" />
                            <span>SMTP Alert Dispatcher</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Verify and test your Gmail SMTP server notifications instantly.
                          </p>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5 space-y-4">
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Sends a beautifully designed sample transaction notification email to your verified address <strong className="text-slate-200 font-mono text-[11px]">{currentUser?.email}</strong>.
                          </p>

                          <button
                            onClick={handleSendTestEmail}
                            disabled={sendingTestMail}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {sendingTestMail ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Sending Dispatch Test...</span>
                              </>
                            ) : (
                              <>
                                <span>Send Test Email Alert</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Personal Security Credentials */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-orange-400" />
                            <span>Personal Profile & Security</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Read-only details associated with your verified cloud-synced account.
                          </p>
                        </div>

                        <div className="space-y-4 text-xs">
                          
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-900">
                            <span className="text-slate-500 font-semibold">Username</span>
                            <span className="text-slate-200 font-bold">{currentUser?.username || "N/A"}</span>
                          </div>

                          <div className="flex justify-between items-center py-2.5 border-b border-slate-900">
                            <span className="text-slate-500 font-semibold">Email Link</span>
                            <span className="text-slate-200 font-bold truncate max-w-[200px]">{currentUser?.email || "N/A"}</span>
                          </div>

                          <div className="flex justify-between items-center py-2.5 border-b border-slate-900">
                            <span className="text-slate-500 font-semibold">Account Tier</span>
                            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-extrabold uppercase text-[9px] tracking-wide">
                              {currentUser?.subscription || "Free Tier"}
                            </span>
                          </div>

                          {currentUser?.userCode && (
                            <div className="flex justify-between items-center py-2.5 border-b border-slate-900">
                              <span className="text-slate-500 font-semibold">Verification Key</span>
                              <span className="text-orange-400 font-mono font-bold tracking-wide">{currentUser.userCode}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center py-2.5">
                            <span className="text-slate-500 font-semibold">Server Integration Status</span>
                            <span className="text-emerald-400 font-bold font-mono">● SECURED DIRECT VIA FIRESTORE</span>
                          </div>

                        </div>
                      </div>

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

              {/* --- VIEW: COMPARE PRODUCTS --- */}
              {currentView === "compare" && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-extrabold px-3.5 py-1.5 rounded-full tracking-wider uppercase">
                      <GitCompare className="w-4 h-4 text-orange-500" />
                      <span>Product Duel Arena</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">AI Dual-Product Comparer</h2>
                    <p className="text-slate-400 max-w-xl mx-auto text-sm">Paste any two Indian e-commerce links (Amazon, Flipkart, Myntra, Croma, etc.) to scan, align features, and calculate score recommendations side-by-side.</p>
                  </div>

                  {/* Dual Inputs Grid */}
                  <div className="bg-slate-950/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl space-y-6 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Product Link 1 */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[10px] text-orange-400 font-extrabold">1</span>
                          <span>First Product URL</span>
                        </label>
                        <input 
                          type="text"
                          value={compareUrl1}
                          onChange={(e) => setCompareUrl1(e.target.value)}
                          placeholder="Paste Amazon, Flipkart, or Myntra link..."
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3.5 px-4 text-sm outline-none transition-all placeholder:text-slate-600 text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setCompareUrl1("https://www.amazon.in/dp/B0CHX5R3XY")} 
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-800/80 transition-all cursor-pointer"
                          >
                            + Use iPhone Example
                          </button>
                          <button 
                            type="button"
                            onClick={() => setCompareUrl1("https://www.amazon.in/dp/B0CY5JGFSK")} 
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-800/80 transition-all cursor-pointer"
                          >
                            + Use MacBook Example
                          </button>
                        </div>
                      </div>

                      {/* Product Link 2 */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] text-amber-400 font-extrabold">2</span>
                          <span>Second Product URL</span>
                        </label>
                        <input 
                          type="text"
                          value={compareUrl2}
                          onChange={(e) => setCompareUrl2(e.target.value)}
                          placeholder="Paste alternative e-commerce store product link..."
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-3.5 px-4 text-sm outline-none transition-all placeholder:text-slate-600 text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setCompareUrl2("https://www.flipkart.com/apple-iphone-15-pro-black-titanium-128-gb/p/itm4b0ab4098")} 
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-800/80 transition-all cursor-pointer"
                          >
                            + Use Pro Mobile Example
                          </button>
                          <button 
                            type="button"
                            onClick={() => setCompareUrl2("https://www.flipkart.com/hp-pavilion-intel-core-i5-16gb/p/itm53")} 
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-800/80 transition-all cursor-pointer"
                          >
                            + Use Laptop Example
                          </button>
                        </div>
                      </div>
                    </div>

                    {compareError && (
                      <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-bold">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{compareError}</span>
                      </div>
                    )}

                    <div className="flex justify-center pt-4">
                      <button 
                        onClick={handleCompareProducts}
                        disabled={compareLoading || !compareUrl1.trim() || !compareUrl2.trim()}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-orange-500/15 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {compareLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Aligning Specifications...</span>
                          </>
                        ) : (
                          <>
                            <GitCompare className="w-5 h-5" />
                            <span>Initiate AI Product Duel</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* LOADING PLACEHOLDER */}
                  {compareLoading && (
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="relative animate-pulse">
                        <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
                        <GitCompare className="w-6 h-6 text-orange-400 absolute inset-0 m-auto" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-white">Comparing Products & Scraping Live Specs</h4>
                        <p className="text-xs text-slate-500 max-w-sm">Fetching and aligning product features, extracting matching parameters, and computing wise score recommendations via Gemini 3.5-flash...</p>
                      </div>
                      <div className="flex flex-col space-y-2 text-[10px] font-mono text-slate-400 max-w-xs w-full bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">✔</span>
                          <span>Scraping URL 1 specs & details...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">✔</span>
                          <span>Scraping URL 2 specs & details...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 animate-pulse">●</span>
                          <span>Aligning spec parameters side-by-side...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">○</span>
                          <span>Generating definitive value scoring...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMPARISON RESULTS */}
                  {compareResult && (
                    <div className="space-y-8">
                      {/* Product Duel Cards (Side-by-side) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Product 1 Card */}
                        <div className={`bg-slate-950/60 border rounded-3xl p-6 relative overflow-hidden transition-all ${
                          compareResult.product1Score >= compareResult.product2Score 
                            ? "border-orange-500/40 shadow-xl shadow-orange-500/5 bg-gradient-to-b from-orange-500/5 to-transparent" 
                            : "border-slate-800/80"
                        }`}>
                          {compareResult.product1Score >= compareResult.product2Score && (
                            <span className="absolute top-4 right-4 bg-orange-500 text-white font-black text-[10px] uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-md">
                              <Sparkles className="w-3 h-3" />
                              <span>AI Recommended Pick</span>
                            </span>
                          )}
                          
                          <div className="flex gap-4 items-start">
                            {compareResult.product1.image && (
                              <img 
                                src={compareResult.product1.image} 
                                alt={compareResult.product1.name} 
                                className="w-20 h-20 object-cover rounded-xl border border-slate-800 bg-white"
                              />
                            )}
                            <div className="space-y-2 flex-1">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                {compareResult.product1.store || "Store A"}
                              </span>
                              <h3 className="text-lg font-bold text-white leading-tight">{compareResult.product1.name}</h3>
                              <p className="text-2xl font-black text-orange-400">₹{compareResult.product1.price.toLocaleString("en-IN")}</p>
                            </div>
                          </div>

                          <div className="mt-6 border-t border-slate-800/60 pt-6 flex items-center justify-between gap-6">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Value & Spec Score</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black text-white">{compareResult.product1Score}</span>
                                <span className="text-xs text-slate-500 font-bold">/ 100</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed flex-1 bg-slate-900/40 p-3 rounded-xl border border-slate-900 font-medium">
                              {compareResult.product1ScoreBreakdown}
                            </p>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <a 
                              href={compareResult.product1.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center gap-1"
                            >
                              <span>View Store Offer</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Product 2 Card */}
                        <div className={`bg-slate-950/60 border rounded-3xl p-6 relative overflow-hidden transition-all ${
                          compareResult.product2Score >= compareResult.product1Score 
                            ? "border-orange-500/40 shadow-xl shadow-orange-500/5 bg-gradient-to-b from-orange-500/5 to-transparent" 
                            : "border-slate-800/80"
                        }`}>
                          {compareResult.product2Score >= compareResult.product1Score && (
                            <span className="absolute top-4 right-4 bg-orange-500 text-white font-black text-[10px] uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-md">
                              <Sparkles className="w-3 h-3" />
                              <span>AI Recommended Pick</span>
                            </span>
                          )}
                          
                          <div className="flex gap-4 items-start">
                            {compareResult.product2.image && (
                              <img 
                                src={compareResult.product2.image} 
                                alt={compareResult.product2.name} 
                                className="w-20 h-20 object-cover rounded-xl border border-slate-800 bg-white"
                              />
                            )}
                            <div className="space-y-2 flex-1">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                {compareResult.product2.store || "Store B"}
                              </span>
                              <h3 className="text-lg font-bold text-white leading-tight">{compareResult.product2.name}</h3>
                              <p className="text-2xl font-black text-orange-400">₹{compareResult.product2.price.toLocaleString("en-IN")}</p>
                            </div>
                          </div>

                          <div className="mt-6 border-t border-slate-800/60 pt-6 flex items-center justify-between gap-6">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Value & Spec Score</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black text-white">{compareResult.product2Score}</span>
                                <span className="text-xs text-slate-500 font-bold">/ 100</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed flex-1 bg-slate-900/40 p-3 rounded-xl border border-slate-900 font-medium">
                              {compareResult.product2ScoreBreakdown}
                            </p>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <a 
                              href={compareResult.product2.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center gap-1"
                            >
                              <span>View Store Offer</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Definitive Verdict Dashboard */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-6 flex gap-4 items-start">
                          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6 text-orange-400" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">AI Definitive Verdict</h4>
                            <p className="text-sm text-slate-200 leading-relaxed font-semibold">{compareResult.overallVerdict}</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/25 rounded-2xl p-6 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Feature Match Summary</h4>
                            <p className="text-xs text-slate-300 leading-relaxed mt-2 font-medium">
                              {compareResult.matchingFeaturesSummary}
                            </p>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-4">
                            Matching stats calibrated thoroughly
                          </div>
                        </div>
                      </div>

                      {/* Feature Alignment Table */}
                      <div className="bg-slate-950/60 border border-slate-800/60 rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-slate-800/60 bg-slate-950 flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Sliders className="w-5 h-5 text-orange-500" />
                              <span>Specs Alignment Battle</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Direct specification comparison highlighting parameter matching and category winners.</p>
                          </div>
                          <span className="bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px] px-3 py-1 rounded-full font-bold">
                            {compareResult.features.length} Features Scanned
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800/60 bg-slate-900/30 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                                <th className="p-4 w-1/4">Specification category</th>
                                <th className="p-4 w-1/3 truncate max-w-xs">{compareResult.product1.name}</th>
                                <th className="p-4 w-1/3 truncate max-w-xs">{compareResult.product2.name}</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Spec Winner</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-slate-300">
                              {compareResult.features.map((feat: any, idx: number) => {
                                return (
                                  <tr key={idx} className="hover:bg-slate-900/20 transition-all">
                                    <td className="p-4 font-bold text-slate-400">{feat.featureName}</td>
                                    
                                    <td className={`p-4 font-medium ${feat.winner === "product1" ? "text-emerald-400 font-semibold" : "text-slate-300"}`}>
                                      {feat.product1Value}
                                    </td>
                                    
                                    <td className={`p-4 font-medium ${feat.winner === "product2" ? "text-emerald-400 font-semibold" : "text-slate-300"}`}>
                                      {feat.product2Value}
                                    </td>
                                    
                                    <td className="p-4 text-center">
                                      {feat.match ? (
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                                          Match
                                        </span>
                                      ) : (
                                        <span className="bg-slate-800 text-slate-500 border border-slate-700/50 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                                          Differs
                                        </span>
                                      )}
                                    </td>

                                    <td className="p-4 text-right font-black">
                                      {feat.winner === "product1" ? (
                                        <span className="text-orange-400">🏆 Product 1</span>
                                      ) : feat.winner === "product2" ? (
                                        <span className="text-orange-400">🏆 Product 2</span>
                                      ) : (
                                        <span className="text-slate-500">Tie / Equal</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

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


    </div>
  );
}
