import { Link } from "react-router-dom";
import {
  ArrowRight,
  Globe,
  ShieldCheck,
  Zap,
  Camera,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggler } from "@/components/ThemeToggler";
import { TAMIL_NADU_DISTRICTS } from "@/modules/citizen/constants/issue.constants";
import { useLanguageState } from "@/store/language.store";
import {
  motion,
  useScroll,
  useTransform,
  animate,
  type Variants,
} from "framer-motion";

// --- Custom Apple-style Easing ---
const customEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: customEase },
  },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const Home = () => {
  const { language, toggleLanguage } = useLanguageState();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 selection:bg-emerald-500/30 dark:bg-[#050505] dark:text-white font-sans overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50vw] w-[50vw] rounded-full bg-emerald-400/10 blur-[120px] dark:bg-emerald-900/20" />
        <div className="absolute top-[40%] -right-[10%] h-[40vw] w-[40vw] rounded-full bg-teal-400/10 blur-[120px] dark:bg-teal-900/20" />
      </div>

      {/* Floating Glass Nav Pill */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: customEase }}
        className="fixed left-1/2 top-6 z-50 w-[95%] max-w-5xl -translate-x-1/2 rounded-full border border-white/20 bg-white/60 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-black/60 md:w-[80%]"
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 pl-2 group">
            <img
              src="/citylink-logo.png"
              alt="CityLink logo"
              className="h-9 w-9 rounded-full border border-emerald-200 object-cover transition-transform duration-300 group-hover:scale-105 dark:border-emerald-900/60"
            />
            <span className="bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              CityLink
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden rounded-full px-4 text-sm font-medium transition-all duration-300 hover:bg-black/5 active:scale-95 dark:hover:bg-white/10 md:inline-flex"
              onClick={toggleLanguage}
            >
              <Globe className="mr-2 h-4 w-4" />
              {language === "en" ? "தமிழ்" : "English"}
            </Button>
            <ThemeToggler />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <Link
              to="/auth/login"
              className="hidden px-2 text-sm font-medium transition-colors hover:text-emerald-500 md:block"
            >
              Log in
            </Link>
            <Link to="/auth/signup">
              <Button className="rounded-full bg-emerald-500 px-6 text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-emerald-600 hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:ring-4 hover:ring-emerald-500/20 active:scale-95">
                Report Issue
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-32 pb-24">
        {/* HERO SECTION (Untouched except for button physics) */}
        <motion.section
          style={{ opacity, scale }}
          className="mx-auto flex min-h-[75vh] max-w-7xl flex-col items-center justify-center px-4 text-center md:px-8 pb-12"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div
              variants={fadeUp}
              className="mb-6 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 backdrop-blur-md dark:text-emerald-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Welcome to{" "}
              <span className="bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                CityLink
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-5xl text-6xl font-extrabold tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl"
            >
              Fix your city. <br />
              <span className="bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                Instantly.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-500 dark:text-slate-400 md:text-xl"
            >
              Snap a photo, pin the location, and let CityLink route your report
              directly to the right municipal department. Radical transparency
              for modern governance.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Link to="/auth/signup">
                {/* UPGRADED BUTTON TRANSITIONS */}
                <Button className="group h-14 rounded-full bg-emerald-500 px-8 text-lg text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-emerald-600 hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:ring-4 hover:ring-emerald-500/20 active:scale-95">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>

              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById("how-it-works");
                  if (target) {
                    // Calculate exactly where the section is on the page
                    const targetY =
                      target.getBoundingClientRect().top + window.scrollY;

                    // Use Framer Motion to animate the window scrolling
                    animate(window.scrollY, targetY, {
                      duration: 1.2, // 1.2 seconds total duration
                      ease: [0.16, 1, 0.3, 1], // This is the magic "fast start, slow reach" curve
                      onUpdate: (latest) => window.scrollTo(0, latest),
                    });
                  }
                }}
                className="h-14 rounded-full border-slate-200 px-8 text-lg transition-all duration-300 ease-out hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:hover:bg-slate-900"
              >
                See how it works
              </Button>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* WHY CHOOSE CITYLINK - BENTO GRID REBORN */}
        <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
          <div className="mb-16 md:text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Why Choose CityLink ?
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              The most advanced platform for transparent civic governance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 lg:gap-6">
            {/* Large Feature Card: Smart Routing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: customEase }}
              className="group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-[#111] dark:ring-white/10 md:col-span-2"
            >
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="mb-10">
                  <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold md:text-3xl">
                    Automated Official Routing
                  </h3>
                  <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
                    No more manual follow-ups. Our system identifies your
                    location and issue type in seconds, then sends it straight
                    to the right city officer.
                  </p>
                </div>

                {/* Abstract UI Visual */}
                <div className="relative h-32 w-full rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/5 overflow-hidden">
                  <div className="flex h-full items-center justify-between gap-4 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 shadow-sm ring-4 ring-red-50 dark:ring-red-900/10">
                        <MapPin className="text-red-600 dark:text-red-400 h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-red-400">
                        Your Report
                      </span>
                    </div>

                    {/* Animated connecting path */}
                    <div className="relative flex-1 h-0.5 bg-slate-200 dark:bg-slate-700">
                      <motion.div
                        initial={{ scaleX: 0, originX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0 bg-linear-to-r from-red-500 via-red-400 to-teal-500"
                      ></motion.div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-900/10">
                        <ShieldCheck className="text-emerald-600 dark:text-emerald-400 h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                        Local Admin
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Small Feature Card 1: Live Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: customEase }}
              className="flex flex-col justify-between rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-[#111] dark:ring-white/10 transition-all duration-300 hover:ring-blue-500/50 hover:shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="mb-4 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-500">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Live Tracking</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  You can clearly see what is happening after you submit a
                  complaint. Status updates are shown step by step, so there is
                  no confusion.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <li>
                    <span className="font-bold text-red-400">Pending:</span>{" "}
                    Report is received and waiting for assignment.
                  </li>
                  <li>
                    <span className="font-bold text-purple-400">
                      In Progress:{" "}
                    </span>{" "}
                    Team has started field work.
                  </li>
                  <li>
                    <span className="font-bold text-green-300">Resolved:</span>{" "}
                    Work is complete and proof is uploaded.
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Small Feature Card 2: Geo-Tagged Evidence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: customEase }}
              className="flex flex-col justify-between rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-[#111] dark:ring-white/10 transition-all duration-300 hover:ring-amber-500/50 hover:shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="mb-4 inline-flex rounded-xl bg-amber-500/10 p-3 text-amber-500">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Geo-Tagged Evidence</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Every report includes exact location details. City teams can
                  open the ticket, follow the map pin, and reach the correct
                  place quickly.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <li>Photo and location are stored together.</li>
                  <li>No need to call and explain directions repeatedly.</li>
                  <li>Reduces wrong-site visits and delays.</li>
                </ul>
              </div>
            </motion.div>

            {/* Wide Feature Card: Transparency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: customEase }}
              className="group relative overflow-hidden rounded-[2rem] bg-linear-to-br from-emerald-500 to-teal-600 p-8 text-white md:col-span-2 shadow-lg"
            >
              <div className="relative z-10 grid w-full gap-8 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <Sparkles className="mb-4 h-8 w-8 text-emerald-100" />
                  <h3 className="text-2xl font-bold md:text-3xl">
                    Verified Resolution
                  </h3>
                  <p className="mt-2 text-lg leading-relaxed text-emerald-50">
                    A complaint is marked resolved only after field proof is
                    uploaded. This keeps the process honest and easy to trust
                    for every citizen.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-emerald-50/95">
                    <li>Before and after photo evidence is attached.</li>
                    <li>Closure time is recorded in the ticket history.</li>
                    <li>You can reopen the issue if the fix is incomplete.</li>
                  </ul>
                </div>
              </div>
              {/* Decorative Circle */}
              <div className="absolute -right-10 top-1/2 hidden -translate-y-1/2 md:block">
                <div className="h-62.5 w-62.5 rounded-full border-30 border-white/10 transition-transform duration-700 group-hover:scale-110"></div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS - REDEFINED FOR ABSOLUTE CLARITY */}
        <section
          id="how-it-works"
          className="border-y border-slate-200 bg-white py-24 dark:border-white/5 dark:bg-[#0a0a0a]"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: customEase }}
              className="mb-20 text-center"
            >
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                How CityLink Works
              </h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                A radically simple process to improve your neighborhood.
              </p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Camera,
                  title: "Snap & Describe",
                  desc: "Take a quick photo of the pothole, broken light, or garbage. Add a brief description. We automatically handle the exact GPS location.",
                  bg: "bg-blue-50 dark:bg-blue-900/10",
                  iconColor: "text-blue-500",
                },
                {
                  step: "02",
                  icon: RefreshCcw,
                  title: "System Assigns",
                  desc: "The moment you submit, CityLink's routing engine instantly assigns the ticket to the specific local officer responsible for that area.",
                  bg: "bg-amber-50 dark:bg-amber-900/10",
                  iconColor: "text-amber-500",
                },
                {
                  step: "03",
                  icon: CheckCircle2,
                  title: "Track & Verify",
                  desc: "Watch the status update live. When the work is done, you'll receive a notification with a verified photo of the completed repair.",
                  bg: "bg-emerald-50 dark:bg-emerald-900/10",
                  iconColor: "text-emerald-500",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.15,
                    ease: customEase,
                  }}
                  className="group relative flex flex-col rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:border-white/5 dark:bg-[#111] dark:hover:shadow-black/50"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl ${item.bg}`}
                    >
                      <item.icon
                        className={`h-8 w-8 ${item.iconColor} transition-transform duration-500 group-hover:scale-110`}
                      />
                    </div>
                    <span className="text-5xl font-black text-slate-300 dark:text-slate-800 transition-colors duration-300 group-hover:text-slate-400 dark:group-hover:text-slate-700">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{item.title}</h3>
                  <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* MINIMALIST MARQUEE */}
        <section className="py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent overflow-hidden">
          <div className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
            Active across all 38 districts
          </div>
          <div className="flex w-[500%] animate-marquee whitespace-nowrap">
            {/* Note: Keep the @keyframes marquee in your CSS */}
            {[
              ...TAMIL_NADU_DISTRICTS,
              ...TAMIL_NADU_DISTRICTS,
              ...TAMIL_NADU_DISTRICTS,
            ].map((district, i) => (
              <span
                key={i}
                className="mx-8 text-3xl font-black text-slate-300 dark:text-slate-800/80 transition-colors hover:text-emerald-500/30"
              >
                {district}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* PROFESSIONAL MINIMALIST FOOTER */}
      <footer className="bg-white px-4 py-16 dark:bg-[#050505] md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6 group">
                <img
                  src="/citylink-logo.png"
                  alt="CityLink logo"
                  className="h-7 w-7 rounded-full border border-emerald-200 object-cover transition-transform duration-300 group-hover:scale-105 dark:border-emerald-900/60"
                />
                <span className="bg-linear-to-r bg-white bg-clip-text text-lg font-bold tracking-tight text-transparent">
                  CityLink
                </span>
              </Link>
              <p className="max-w-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Empowering the citizens of Tamil Nadu to build cleaner, safer,
                and smarter cities through transparent civic governance.
              </p>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-semibold tracking-wider text-slate-900 dark:text-white uppercase">
                Platform
              </h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <Link
                    to="/auth/login"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Official Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth/signup"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Citizen Registration
                  </Link>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.getElementById("how-it-works");
                      if (target) {
                        const targetY =
                          target.getBoundingClientRect().top + window.scrollY;

                        animate(window.scrollY, targetY, {
                          duration: 1.2,
                          ease: [0.16, 1, 0.3, 1],
                          onUpdate: (latest) => window.scrollTo(0, latest),
                        });
                      }
                    }}
                    className="hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    How it Works
                  </a>
                </li>
                
              </ul>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-semibold tracking-wider text-slate-900 dark:text-white uppercase">
                Resources
              </h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Department Directory
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    API Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-semibold tracking-wider text-slate-900 dark:text-white uppercase">
                Legal
              </h4>
              <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between border-t border-slate-200 pt-8 dark:border-white/10 sm:flex-row">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} CityLink Tamil Nadu. All rights
              reserved.
            </p>
            <div className="mt-4 flex gap-6 sm:mt-0">
              <a
                href="https://www.linkedin.com/in/yogaarasu-k-aa04a1326/"
                target="_blank"
                className="text-sm font-medium text-slate-500 hover:text-emerald-500 transition-colors dark:text-slate-400"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/yogaarasu"
                target="_blank"
                className="text-sm font-medium text-slate-500 hover:text-emerald-500 transition-colors dark:text-slate-400"
              >
                GitHub
              </a>
              <a
                href="https://www.instagram.com/yogaarasu_143/?hl=en"
                target="_blank"
                className="text-sm font-medium text-slate-500 hover:text-emerald-500 transition-colors dark:text-slate-400"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
