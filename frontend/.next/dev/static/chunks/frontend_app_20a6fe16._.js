(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/app/config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Frontend API Configuration
// This file manages the backend URL for all API calls
// IMPORTANT: Use environment variable for production deployments
// Set NEXT_PUBLIC_API_URL in environment variables
__turbopack_context__.s([
    "API_URL",
    ()=>API_URL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_URL = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || '';
// Validate URL format
if ("TURBOPACK compile-time truthy", 1) {
    console.log('🔗 Backend API URL:', API_URL);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/app/reports/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Reports
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/app/config.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function Reports() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // --- HELPERS ---
    const getDefaultFromDate = ()=>{
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        return d.toISOString().split("T")[0];
    };
    const getToday = ()=>new Date().toISOString().split("T")[0];
    // --- STATE ---
    const [transactions, setTransactions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [jobMap, setJobMap] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [clients, setClients] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedClient, setSelectedClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("ALL");
    const [startDate, setStartDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getDefaultFromDate());
    const [endDate, setEndDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getToday());
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // --- DATA LOADING ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Reports.useEffect": ()=>{
            const init = {
                "Reports.useEffect.init": async ()=>{
                    const token = localStorage.getItem("token");
                    if (!token) {
                        window.location.href = "/login";
                        return;
                    }
                    try {
                        const [jobsRes, transRes] = await Promise.all([
                            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_URL"]}/api/jobs/`, {
                                headers: {
                                    Authorization: `Token ${token}`
                                }
                            }),
                            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_URL"]}/api/transactions/`, {
                                headers: {
                                    Authorization: `Token ${token}`
                                }
                            })
                        ]);
                        // job → client name map
                        const map = {};
                        jobsRes.data.forEach({
                            "Reports.useEffect.init": (j)=>{
                                map[j.id] = j.client_details?.name || j.client?.name || "Unknown";
                            }
                        }["Reports.useEffect.init"]);
                        setJobMap(map);
                        // sort by date ASC (ledger-safe)
                        const txns = Array.isArray(transRes.data) ? transRes.data : transRes.data.results || [];
                        const sortedData = txns.sort({
                            "Reports.useEffect.init.sortedData": (a, b)=>new Date(a.date).getTime() - new Date(b.date).getTime()
                        }["Reports.useEffect.init.sortedData"]);
                        setTransactions(sortedData);
                        // build party dropdown - FIX: Use display_party_name or resolve names properly
                        const rawNames = [
                            ...sortedData.map({
                                "Reports.useEffect.init": (t)=>{
                                    // Priority: display_party_name > party_name > job client > "Unknown"
                                    return t.display_party_name || t.party_name || (t.job ? map[t.job] : null) || "Unknown";
                                }
                            }["Reports.useEffect.init"]),
                            ...Object.values(map)
                        ];
                        const cleanNames = Array.from(new Set(rawNames.filter({
                            "Reports.useEffect.init.cleanNames": (n)=>n
                        }["Reports.useEffect.init.cleanNames"]).map({
                            "Reports.useEffect.init.cleanNames": (n)=>n?.toUpperCase().trim()
                        }["Reports.useEffect.init.cleanNames"]))).sort();
                        console.log("🔍 DEBUG: Building dropdown from", sortedData.length, "transactions");
                        console.log("🔍 DEBUG: Raw names:", rawNames.slice(0, 10));
                        console.log("🔍 DEBUG: Clean names for dropdown:", cleanNames);
                        setClients(cleanNames);
                    } catch (err) {
                        console.error(err);
                    } finally{
                        setLoading(false);
                    }
                }
            }["Reports.useEffect.init"];
            init();
        }
    }["Reports.useEffect"], []);
    // --- FILTER + LEDGER LOGIC ---
    const reportData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Reports.useMemo[reportData]": ()=>{
            let runningBalance = 0;
            console.log("🔍 DEBUG: reportData calculation started with", transactions.length, "transactions");
            // 1. Normalize name resolution so filtering actually works
            let result = transactions.map({
                "Reports.useMemo[reportData].result": (t)=>{
                    const nameFromJob = t.job ? jobMap[t.job] : null;
                    const resolvedName = (t.display_party_name || t.party_name || nameFromJob || "General Transaction").trim().toUpperCase();
                    console.log(`🔍 Transaction #${t.id}: display_party_name="${t.display_party_name}", party_name="${t.party_name}", job=${t.job}, nameFromJob="${nameFromJob}", resolvedName="${resolvedName}"`);
                    return {
                        ...t,
                        resolvedName
                    };
                }
            }["Reports.useMemo[reportData].result"]);
            // 2. APPLY CLIENT FILTER
            if (selectedClient !== "ALL") {
                const term = selectedClient.toUpperCase();
                console.log(`🔍 DEBUG: Filtering by client: "${term}"`);
                console.log(`🔍 DEBUG: Before filter:`, result.length, "transactions");
                result = result.filter({
                    "Reports.useMemo[reportData]": (t)=>{
                        const matches = t.resolvedName === term;
                        console.log(`🔍   Transaction #${t.id}: resolvedName="${t.resolvedName}" ${matches ? "✅ MATCHES" : "❌ NO MATCH"}`);
                        return matches;
                    }
                }["Reports.useMemo[reportData]"]);
                console.log(`🔍 DEBUG: After filter:`, result.length, "transactions");
            }
            // 3. APPLY DATE FILTER
            // Convert strings to date objects for accurate comparison
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (start) {
                result = result.filter({
                    "Reports.useMemo[reportData]": (t)=>new Date(t.date) >= start
                }["Reports.useMemo[reportData]"]);
            }
            if (end) {
                // Set end of day for the "To" date
                end.setHours(23, 59, 59, 999);
                result = result.filter({
                    "Reports.useMemo[reportData]": (t)=>new Date(t.date) <= end
                }["Reports.useMemo[reportData]"]);
            }
            // 4. LEDGER CALCULATION (Accounting Logic)
            return result.map({
                "Reports.useMemo[reportData]": (t)=>{
                    const amount = Math.abs(Number(t.amount || 0));
                    // CREDIT: Money received (CR = Cash Receive, BR = Bank Receive)
                    const isCredit = [
                        "CR",
                        "BR"
                    ].includes(t.trans_type);
                    // PAID OUT: Money you paid out (CP = Cash Pay, BP = Bank Pay)
                    const isPaidOut = [
                        "CP",
                        "BP"
                    ].includes(t.trans_type);
                    // DEBIT: Invoices (money owed to you)
                    const isDebit = t.trans_type === "INVOICE";
                    const received = isCredit ? amount : 0;
                    const paid = isPaidOut ? amount : 0;
                    // THE FIX: Add received, subtract paid
                    runningBalance += received - paid;
                    return {
                        ...t,
                        received,
                        paid,
                        invoiceAmt: isDebit ? amount : 0,
                        currentBalance: runningBalance
                    };
                }
            }["Reports.useMemo[reportData]"]);
        }
    }["Reports.useMemo[reportData]"], [
        transactions,
        selectedClient,
        startDate,
        endDate,
        jobMap
    ]);
    const totalReceived = reportData.reduce((sum, t)=>sum + t.received, 0);
    const totalPaid = reportData.reduce((sum, t)=>sum + t.paid, 0);
    const netBalance = totalReceived - totalPaid;
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-10 font-black text-center text-slate-400",
        children: "LOADING REPORTS..."
    }, void 0, false, {
        fileName: "[project]/frontend/app/reports/page.tsx",
        lineNumber: 185,
        columnNumber: 7
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen p-8 bg-slate-50 font-sans text-slate-900",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between max-w-6xl mx-auto mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-black tracking-tight",
                                children: "Ledger Statement"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 195,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-medium text-slate-500",
                                children: "Real-time running balance and cash flow."
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 198,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/reports/page.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>router.push("/reports/ledger"),
                                className: "px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700",
                                children: "📊 Professional Ledger"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 203,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>router.push("/"),
                                className: "px-4 py-2 text-xs font-bold bg-white border rounded-lg",
                                children: "← Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 209,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/reports/page.tsx",
                        lineNumber: 202,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/reports/page.tsx",
                lineNumber: 193,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-4 p-5 bg-white border rounded-2xl shadow-sm md:flex-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-slate-400 uppercase mb-1",
                                        children: "Party Name"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/reports/page.tsx",
                                        lineNumber: 222,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: selectedClient,
                                        onChange: (e)=>setSelectedClient(e.target.value),
                                        className: "w-full px-3 py-2.5 border rounded-lg font-bold bg-slate-50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "ALL",
                                                children: "All Clients / Parties"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/reports/page.tsx",
                                                lineNumber: 230,
                                                columnNumber: 15
                                            }, this),
                                            clients.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: c,
                                                    children: c
                                                }, i, false, {
                                                    fileName: "[project]/frontend/app/reports/page.tsx",
                                                    lineNumber: 232,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/reports/page.tsx",
                                        lineNumber: 225,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 221,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full md:w-40",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-slate-400 uppercase mb-1",
                                        children: "From"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/reports/page.tsx",
                                        lineNumber: 240,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        value: startDate,
                                        onChange: (e)=>setStartDate(e.target.value),
                                        className: "w-full px-3 py-2.5 border rounded-lg font-bold"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/reports/page.tsx",
                                        lineNumber: 243,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 239,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full md:w-40",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] font-bold text-slate-400 uppercase mb-1",
                                        children: "To"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/reports/page.tsx",
                                        lineNumber: 252,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        value: endDate,
                                        onChange: (e)=>setEndDate(e.target.value),
                                        className: "w-full px-3 py-2.5 border rounded-lg font-bold"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/reports/page.tsx",
                                        lineNumber: 255,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 251,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/reports/page.tsx",
                        lineNumber: 220,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 gap-6 md:grid-cols-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Summary, {
                                label: "Total Received",
                                value: totalReceived,
                                color: "green"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 266,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Summary, {
                                label: "Total Paid",
                                value: totalPaid,
                                color: "red"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 267,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Summary, {
                                label: "Net Cash Position",
                                value: netBalance,
                                dark: true
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 268,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/reports/page.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LedgerTable, {
                        rows: reportData
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/reports/page.tsx",
                        lineNumber: 272,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/reports/page.tsx",
                lineNumber: 218,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/reports/page.tsx",
        lineNumber: 191,
        columnNumber: 5
    }, this);
}
_s(Reports, "vldpRIv2mLXqDCWGbsaQGZ22KMo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Reports;
/* ---------------- SUB COMPONENTS ---------------- */ function Summary({ label, value, color, dark }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `p-6 rounded-2xl shadow-sm font-black ${dark ? "bg-slate-900 text-white" : "bg-white border"}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] uppercase text-slate-400",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/app/reports/page.tsx",
                lineNumber: 292,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `text-3xl ${color === "green" ? "text-emerald-600" : color === "red" ? "text-red-600" : ""}`,
                children: value.toFixed(3)
            }, void 0, false, {
                fileName: "[project]/frontend/app/reports/page.tsx",
                lineNumber: 293,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/reports/page.tsx",
        lineNumber: 287,
        columnNumber: 5
    }, this);
}
_c1 = Summary;
function LedgerTable({ rows }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-hidden bg-white border rounded-2xl shadow-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    className: "bg-slate-50 text-xs font-black uppercase",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "p-4",
                                children: "Date"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 314,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "p-4",
                                children: "Party & Job"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 315,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "p-4",
                                children: "Description"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 316,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "p-4 text-right",
                                children: "Received"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 317,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "p-4 text-right text-red-500",
                                children: "Paid"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 318,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "p-4 text-right",
                                children: "Balance"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/reports/page.tsx",
                                lineNumber: 319,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/reports/page.tsx",
                        lineNumber: 313,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/app/reports/page.tsx",
                    lineNumber: 312,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: rows.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            colSpan: 6,
                            className: "p-10 text-center text-slate-400",
                            children: "No transactions match your filters."
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/reports/page.tsx",
                            lineNumber: 325,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/reports/page.tsx",
                        lineNumber: 324,
                        columnNumber: 13
                    }, this) : rows.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "border-t",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "p-4 font-bold",
                                    children: t.date
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/reports/page.tsx",
                                    lineNumber: 335,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "p-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "font-bold",
                                            children: t.resolvedName
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/reports/page.tsx",
                                            lineNumber: 337,
                                            columnNumber: 17
                                        }, this),
                                        " ",
                                        t.job && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-blue-600 font-bold",
                                            children: [
                                                "JOB #",
                                                t.job
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/reports/page.tsx",
                                            lineNumber: 339,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/reports/page.tsx",
                                    lineNumber: 336,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "p-4 text-slate-500",
                                    children: t.description || "-"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/reports/page.tsx",
                                    lineNumber: 344,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "p-4 text-right text-green-600 font-bold",
                                    children: t.received ? t.received.toFixed(3) : "-"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/reports/page.tsx",
                                    lineNumber: 347,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "p-4 text-right text-red-600 font-bold",
                                    children: t.paid ? t.paid.toFixed(3) : "-"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/reports/page.tsx",
                                    lineNumber: 350,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "p-4 text-right font-black",
                                    children: t.currentBalance.toFixed(3)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/reports/page.tsx",
                                    lineNumber: 353,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, t.id, true, {
                            fileName: "[project]/frontend/app/reports/page.tsx",
                            lineNumber: 334,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/app/reports/page.tsx",
                    lineNumber: 322,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/reports/page.tsx",
            lineNumber: 311,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/app/reports/page.tsx",
        lineNumber: 310,
        columnNumber: 5
    }, this);
}
_c2 = LedgerTable;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Reports");
__turbopack_context__.k.register(_c1, "Summary");
__turbopack_context__.k.register(_c2, "LedgerTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_app_20a6fe16._.js.map