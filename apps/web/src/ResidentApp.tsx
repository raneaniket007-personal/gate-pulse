import { useEffect, useState } from "react";
import {
    actOnVisitor,
    clearResidentToken,
    getResidentMe,
    getResidentToken,
    getResidentVisitor,
    getResidentVisitors,
    loginResident,
    sendTestPush,
    type Resident,
    type ResidentVisitor,
} from "./lib/residentApi";
import { enableResidentPush } from "./lib/push";

type View = "login" | "dashboard" | "detail";

function formatTime(value: string) {
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function StatusPill({ status }: { status: ResidentVisitor["status"] }) {
    const classes = {
        PENDING: "bg-amber-50 text-amber-700",
        APPROVED: "bg-emerald-50 text-emerald-700",
        DENIED: "bg-red-50 text-red-700",
        EXPIRED: "bg-slate-100 text-slate-500",
    };
    return <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + classes[status]}>{status}</span>;
}

function Login({ onLogin }: { onLogin: (resident: Resident) => void }) {
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        try {
            setLoading(true);
            setError("");
            onLogin(await loginResident(phone, pin));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">GP</div>
                    <h1 className="mt-5 text-3xl font-bold text-slate-900">GatePulse Resident</h1>
                    <p className="mt-2 text-sm text-slate-500">Approve visitors from your phone.</p>
                </div>
                <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <label className="block text-sm font-medium text-slate-700">Phone number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919920419564" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
                    <label className="mt-5 block text-sm font-medium text-slate-700">Resident PIN</label>
                    <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" type="password" maxLength={8} placeholder="1234" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
                    {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                    <button disabled={loading} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button>
                    <p className="mt-4 text-center text-xs text-slate-400">Demo residents are seeded with PIN 1234.</p>
                </form>
            </div>
        </main>
    );
}

function Dashboard({ resident, onOpen, onLogout }: { resident: Resident; onOpen: (id: string) => void; onLogout: () => void }) {
    const [visitors, setVisitors] = useState<ResidentVisitor[]>([]);
    const [pushMessage, setPushMessage] = useState("");
    const [loading, setLoading] = useState(true);

    async function refresh() {
        setLoading(true);
        try {
            setVisitors(await getResidentVisitors());
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void refresh(); }, []);

    async function enablePush() {
        try {
            await enableResidentPush();
            setPushMessage("Push notifications enabled on this device.");
        } catch (err) {
            setPushMessage(err instanceof Error ? err.message : "Could not enable push.");
        }
    }

    async function testPush() {
        try {
            await sendTestPush();
            setPushMessage("Test notification sent. Check this device.");
        } catch (err) {
            setPushMessage(err instanceof Error ? err.message : "Test push failed.");
        }
    }

    const pending = visitors.filter((visitor) => visitor.status === "PENDING");

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-2xl">
                <header className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">{resident.societyName}</p>
                        <h1 className="text-2xl font-bold text-slate-900">Hi, {resident.name}</h1>
                        <p className="text-sm text-slate-500">Flat {resident.flatNumber}</p>
                    </div>
                    <button onClick={onLogout} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white">Sign out</button>
                </header>

                <section className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
                    <p className="text-sm text-slate-300">Pending requests</p>
                    <p className="mt-1 text-4xl font-bold">{pending.length}</p>
                    <p className="mt-2 text-sm text-slate-300">Approve or deny visitor entry requests.</p>
                </section>

                <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={enablePush} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Enable notifications</button>
                        <button onClick={testPush} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Send test push</button>
                    </div>
                    {pushMessage && <p className="mt-3 text-sm text-slate-500">{pushMessage}</p>}
                </section>

                <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Visitor requests</h2>
                        <button onClick={() => void refresh()} className="text-sm font-semibold text-slate-500">Refresh</button>
                    </div>
                    {loading && <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">Loading...</div>}
                    {!loading && visitors.length === 0 && <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">No visitor requests yet.</div>}
                    <div className="space-y-3">
                        {visitors.map((visitor) => (
                            <button key={visitor.id} onClick={() => onOpen(visitor.id)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                                {visitor.photoUrl ? <img src={visitor.photoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <div className="h-14 w-14 rounded-xl bg-slate-100" />}
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-900">{visitor.visitorName}</p>
                                    <p className="mt-1 text-xs text-slate-400">{formatTime(visitor.createdAt)}</p>
                                </div>
                                <StatusPill status={visitor.status} />
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

function Detail({ id, onBack }: { id: string; onBack: () => void }) {
    const [visitor, setVisitor] = useState<ResidentVisitor | null>(null);
    const [error, setError] = useState("");
    const [working, setWorking] = useState(false);

    useEffect(() => {
        void getResidentVisitor(id).then(setVisitor).catch((err) => setError(err instanceof Error ? err.message : "Failed to load visitor"));
    }, [id]);

    async function action(action: "APPROVE" | "DENY") {
        try {
            setWorking(true);
            const updated = await actOnVisitor(id, action);
            setVisitor((current) => current ? { ...current, status: updated.status, passExpiresAt: updated.passExpiresAt } : current);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Action failed");
        } finally {
            setWorking(false);
        }
    }

    if (!visitor) return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-md">{error || "Loading..."}</div></main>;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-md">
                <button onClick={onBack} className="mb-5 text-sm font-semibold text-slate-500">← Back</button>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Visitor request</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">{visitor.visitorName}</h1>
                    <div className="mt-4 overflow-hidden rounded-2xl bg-slate-100">
                        {visitor.photoUrl ? <img src={visitor.photoUrl} alt="Visitor selfie" className="aspect-square w-full object-cover" /> : <div className="aspect-square" />}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">{formatTime(visitor.createdAt)}</span>
                        <StatusPill status={visitor.status} />
                    </div>
                    {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                    {visitor.status === "PENDING" && (
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button disabled={working} onClick={() => void action("DENY")} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 disabled:opacity-50">Deny</button>
                            <button disabled={working} onClick={() => void action("APPROVE")} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Approve</button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function ResidentApp() {
    const initialVisitorId = window.location.pathname.match(/^\/resident\/visitors\/([^/]+)/)?.[1] || null;
    const [view, setView] = useState<View>(getResidentToken() ? (initialVisitorId ? "detail" : "dashboard") : "login");
    const [resident, setResident] = useState<Resident | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(initialVisitorId);

    useEffect(() => {
        if (!getResidentToken()) return;
        void getResidentMe().then(setResident).catch(() => {
            clearResidentToken();
            setView("login");
        });
    }, []);

    if (view === "login") return <Login onLogin={(value) => { setResident(value); setView("dashboard"); }} />;
    if (!resident) return <main className="min-h-screen bg-slate-50 p-6 text-center text-sm text-slate-500">Loading resident account...</main>;

    if (view === "detail" && selectedId) {
        return <Detail id={selectedId} onBack={() => setView("dashboard")} />;
    }

    return <Dashboard resident={resident} onOpen={(id) => { setSelectedId(id); setView("detail"); }} onLogout={() => { clearResidentToken(); setResident(null); setView("login"); }} />;
}
