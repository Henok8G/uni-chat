import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 dark:bg-black font-sans">
      <main className="mx-auto max-w-3xl rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-4">
          <Link 
            href="/" 
            className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1.5"
          >
            &larr; Back to Home
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Last updated: October 25, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {/* Section 1: Introduction */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              1. Platform Overview &amp; Scope
            </h2>
            <p>
              Uni-Chat is a dedicated campus communication and peer discovery platform designed exclusively for verified students of Addis Ababa University (AAU) using institutional (@aau.edu.et) accounts. This Privacy Policy explains what information we collect, how it is processed to deliver verified student services, and our commitments to protecting your data.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-zinc-900 dark:text-zinc-100">Student Account &amp; Verification Data:</strong> When registering, we collect your institutional email address (e.g., <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">@aau.edu.et</code>), cryptographic password hash (passwords are one-way hashed with bcrypt and never stored in plaintext), full name, campus, department, academic year, gender, bio, and student ID. Verification tokens are delivered to your university email to confirm student enrollment.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-100">Direct Messaging &amp; Group Communications:</strong> Text messages exchanged within 1-on-1 conversations and peer groups are stored securely in our PostgreSQL database to enable conversation history and synchronization across your active sessions.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-100">Mutual Friendship Requests:</strong> Connection requests require affirmative mutual consent. Neither user is granted friendship visibility until a recipient explicitly accepts the request.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-100">Real-Time Audio &amp; Video Streams:</strong> Peer video and audio calls utilize WebRTC technology. Live media streams travel peer-to-peer directly between participating browsers. <strong>Live video and audio calls are never recorded, analyzed, or stored on our servers.</strong> Our signaling servers only facilitate the initial cryptographic handshake and network routing (ICE candidates).
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-100">Security &amp; Anti-Abuse Audit Telemetry:</strong> When logging in, we record client IP addresses and browser user-agent strings in an access audit log strictly to prevent unauthorized account access, detect brute-force attacks, and maintain campus community security.
              </li>
            </ul>
          </section>

          {/* Section 3: How Information Is Used */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              3. How We Use Your Information
            </h2>
            <p>
              We process collected data exclusively to operate campus services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Authenticating student identity and preventing impersonation.</li>
              <li>Facilitating university peer matching based on shared academic departments, interests, and cohort preferences.</li>
              <li>Powering campus discovery feeds, student club directories, and departmental announcements.</li>
              <li>Investigating moderation reports to enforce community guidelines and protect students against harassment.</li>
            </ul>
          </section>

          {/* Section 4: Data Protection & Sharing */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              4. Data Protection &amp; Third-Party Commitments
            </h2>
            <p>
              <strong>We do not sell, rent, or trade student personal data to commercial data brokers or advertisers.</strong>
            </p>
            <p>
              All communication with the platform is encrypted in transit using Transport Layer Security (HTTPS / WSS). Access to administration consoles is restricted by role-based authentication and audit logging.
            </p>
          </section>

          {/* Section 5: Student Rights & Retention */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              5. Profile Control &amp; Data Retention
            </h2>
            <p>
              Students can view and edit their profile details (bio, interests, theme preferences, and year) at any time through the <Link href="/profile" className="text-blue-600 dark:text-blue-400 hover:underline">Profile</Link> and <Link href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline">Settings</Link> consoles.
            </p>
            <p>
              Security audit logs are retained solely for the minimum duration required to address safety incidents and prevent abuse.
            </p>
          </section>

          {/* Section 6: Administrative Contact */}
          <section className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              6. Administrative Inquiries &amp; Privacy Contact
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              For questions concerning your account data, privacy practices, or moderation records, contact campus platform administration via Telegram at{' '}
              <a 
                href="https://t.me/esprit_iconique" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                @esprit_iconique
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
