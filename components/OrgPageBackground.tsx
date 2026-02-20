// Shared decorative medical background for all org-admin pages
export default function OrgPageBackground() {
    return (
        <svg
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1400 900"
            preserveAspectRatio="xMidYMid slice"
        >
            {/* ── Corner blobs ──────────────────────────── */}
            <circle cx="0" cy="0" r="320" fill="rgba(99,102,241,0.12)" />
            <circle cx="1400" cy="900" r="340" fill="rgba(13,148,136,0.10)" />
            <circle cx="1400" cy="0" r="220" fill="rgba(99,102,241,0.07)" />
            <circle cx="0" cy="900" r="220" fill="rgba(13,148,136,0.07)" />

            {/* ── Top ECG heartbeat ─────────────────────── */}
            <polyline
                points="0,55 160,55 200,15 240,95 280,5 320,95 360,55 1400,55"
                fill="none" stroke="rgba(99,102,241,0.28)" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
            />
            {/* ── Bottom ECG heartbeat ──────────────────── */}
            <polyline
                points="0,855 160,855 200,815 240,895 280,805 320,895 360,855 1400,855"
                fill="none" stroke="rgba(13,148,136,0.28)" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
            />
            {/* ── Right-side faint ECG ──────────────────── */}
            <polyline
                points="1100,0 1100,260 1120,300 1140,220 1160,340 1180,220 1200,260 1200,900"
                fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
            />

            {/* ── Medical crosses removed for cleaner look ── */}


            {/* ── Dot grid ──────────────────────────────── */}
            <pattern id="medgrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="rgba(99,102,241,0.08)" />
            </pattern>
            <rect width="1400" height="900" fill="url(#medgrid)" />
        </svg>
    )
}
