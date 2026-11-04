import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  PartyPopper, 
  Sparkles, 
  Clock, 
  Calendar, 
  Volume2, 
  VolumeX, 
  Coins, 
  Flame, 
  Share2, 
  RotateCcw, 
  SlidersHorizontal,
  Cake,
  Sun,
  Bot,
  RefreshCw,
  Zap,
  Terminal,
  Heart
} from 'lucide-react';

export default function App() {
  // --- Audio Synthesis via Web Audio API ---
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef(null);

  // Dry synthesizer fanfare (somewhat robotic yet cheery chimes)
  const playPartyFanfare = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 8-bit style cheerful robot arpeggio: C5, E5, G5, B5, C6
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.65);
      });
    } catch (e) {
      console.warn("Audio playback not supported", e);
    }
  };

  // Robot beep for interactive dialogues
  const playRobotBlip = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {
      // ignore
    }
  };

  // --- Confetti Script Loader ---
  const [confettiLoaded, setConfettiLoaded] = useState(false);

  useEffect(() => {
    if (window.confetti) {
      setConfettiLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    script.async = true;
    script.onload = () => setConfettiLoaded(true);
    document.body.appendChild(script);
  }, []);

  const triggerConfetti = (burstOnly = false) => {
    if (!window.confetti) return;
    const colors = ['#FF6B35', '#FFA500', '#FF4500', '#FFD166', '#FF8C42', '#FF3366', '#FFD700'];

    if (burstOnly) {
      window.confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors
      });
      return;
    }

    const count = 280;
    const defaults = { origin: { y: 0.65 }, colors };

    function fire(particleRatio, opts) {
      window.confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 35, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 110, decay: 0.91, scalar: 1.2 });
    fire(0.1, { spread: 130, startVelocity: 25, decay: 0.92 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  // --- Date & Time Calculation Logic ---
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedDateInput, setSimulatedDateInput] = useState('');
  const [forcePaydayPreview, setForcePaydayPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getNextPayday = (fromTime) => {
    const year = fromTime.getFullYear();
    const month = fromTime.getMonth();
    const day = fromTime.getDate();

    if (day === 17) {
      return { isToday: true, target: new Date(year, month, 17, 23, 59, 59, 999) };
    }

    if (day < 17) {
      return { isToday: false, target: new Date(year, month, 17, 0, 0, 0, 0) };
    }

    return { isToday: false, target: new Date(year, month + 1, 17, 0, 0, 0, 0) };
  };

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSimulated) {
        setCurrentTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isSimulated]);

  // Derived countdown metrics
  const paydayData = useMemo(() => {
    if (forcePaydayPreview) {
      return {
        isToday: true,
        target: new Date(),
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progressPercent: 100
      };
    }

    const effectiveDate = currentTime;
    const { isToday, target } = getNextPayday(effectiveDate);

    if (isToday) {
      return {
        isToday: true,
        target,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progressPercent: 100
      };
    }

    const diffMs = Math.max(0, target.getTime() - effectiveDate.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const cycleTotalSeconds = 30 * 24 * 3600;
    const progressPercent = Math.min(100, Math.max(0, ((cycleTotalSeconds - totalSeconds) / cycleTotalSeconds) * 100));

    return {
      isToday: false,
      target,
      days,
      hours,
      minutes,
      seconds,
      progressPercent
    };
  }, [currentTime, forcePaydayPreview]);

  // Automatic celebration trigger on payday
  const celebrationTriggeredRef = useRef(false);
  useEffect(() => {
    if (paydayData.isToday) {
      if (!celebrationTriggeredRef.current) {
        triggerConfetti();
        playPartyFanfare();
        celebrationTriggeredRef.current = true;
      }
    } else {
      celebrationTriggeredRef.current = false;
    }
  }, [paydayData.isToday]);

  // --- Robot Dialogue System (B0B-17) ---
  const paydayQuotes = useMemo(() => [
    "wow im so happy for u!",
    "wow im so happy for u. go buy the un-discounted bread without feeling sick inside. you earned it.",
    "the direct deposit cleared. you may now order the Saizeriya doria AND the focaccia together like an emperor.",
    "status: mortal funds replenished. you survived on 7-Eleven tamago sandos and sheer spite. i am quietly proud of you.",
    "firing mandatory celebratory particles. please put some of this yen toward the gas bill before you sprint to Donki.",
    "my sensors detect you are considering buying full-price wagyu at Life supermarket. slow down, hero.",
    "wow im so happy for u! treat yourself to the pudding with the real whipped cream on top today. you genuinely survived."
  ], []);

  const countdownQuotes = useMemo(() => [
    `only ${paydayData.days} days until the 17th. 8:30 PM yellow 50% off sticker patrol at the supermarket starts now.`,
    "running low on 100-yen coins? i calculated your survival probability: 100%. do not spend the last of it on gachapon.",
    "i know your tatami room has a cold draft from the sliding door. bundle up in the kotatsu, we will make it to the 17th.",
    "combini dinner again? at least the Lawson clerk recognizes your dedication to budget survival. stay strong, pal.",
    `t-minus ${paydayData.days} days. bean sprouts (moyashi) are 29 yen. this is not defeat; it is tactical fiscal endurance.`,
    "i am watching the countdown so you do not stare at your bank balance and contemplate eating instant dashi powder.",
    "hang in there. the 17th is approaching at 1 second per second. my robotic heart is cheering for you quietly.",
    "yes, you have to scrape together 10-yen coins for laundry. but you are still here, and that is statistically impressive."
  ], [paydayData.days]);

  const [quoteIndex, setQuoteIndex] = useState(0);

  const currentBotMessage = useMemo(() => {
    const pool = paydayData.isToday ? paydayQuotes : countdownQuotes;
    return pool[quoteIndex % pool.length];
  }, [paydayData.isToday, quoteIndex, paydayQuotes, countdownQuotes]);

  const cycleQuote = () => {
    playRobotBlip();
    setQuoteIndex(prev => prev + 1);
  };

  const handleSimulateDateChange = (e) => {
    const val = e.target.value;
    setSimulatedDateInput(val);
    if (val) {
      setIsSimulated(true);
      setForcePaydayPreview(false);
      setCurrentTime(new Date(val + 'T12:00:00'));
    }
  };

  const handleResetToRealtime = () => {
    setIsSimulated(false);
    setForcePaydayPreview(false);
    setSimulatedDateInput('');
    setCurrentTime(new Date());
  };

  const toggleForcePayday = () => {
    setForcePaydayPreview(prev => {
      const next = !prev;
      if (next) {
        triggerConfetti();
        playPartyFanfare();
      }
      return next;
    });
  };

  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    const text = paydayData.isToday
      ? "wow im so happy for u! it is officially the 17th. payday has occurred. 💸🤖🎉"
      : `B0B-17 says: only ${paydayData.days} days and ${paydayData.hours} hours until the 17th payday. hang in there. 🍊`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-orange-100 text-slate-800 flex flex-col justify-between selection:bg-orange-400 selection:text-white relative overflow-x-hidden font-sans">
      
      {/* Warm Ambient Party Glows and Polka Dots */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-orange-300/35 to-amber-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 -right-24 w-[450px] h-[450px] bg-gradient-to-tr from-pink-300/30 to-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-[600px] h-[400px] bg-gradient-to-t from-yellow-200/40 to-orange-200/30 rounded-full blur-3xl" />
        
        {/* Playful Floating Party Background Items */}
        <div className="absolute top-16 left-10 text-2xl opacity-40 animate-bounce" style={{ animationDuration: '3.5s' }}>🎈</div>
        <div className="absolute top-44 right-12 text-3xl opacity-40 animate-pulse">✨</div>
        <div className="absolute bottom-28 left-16 text-2xl opacity-35 animate-bounce" style={{ animationDuration: '4.5s' }}>🎉</div>
        <div className="absolute bottom-40 right-20 text-2xl opacity-40 animate-pulse">🍭</div>

        {/* Cheerful light grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#fb923c_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-15" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 bg-white/75 backdrop-blur-md border-b border-orange-200/80 shadow-sm px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/25 border-2 border-white transform hover:rotate-6 transition-transform">
            <Coins className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                Payday 17 Party
              </span>
              <span className="text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 shadow-sm flex items-center space-x-1">
                <span>🤖</span>
                <span>B0B-17 Active</span>
              </span>
            </div>
            <p className="text-xs text-orange-800/70 hidden sm:block font-medium">Bright countdown monitored by your unenthusiastic robot pal</p>
          </div>
        </div>

        {/* Right Top Header Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-orange-200 bg-white/90 hover:bg-orange-50 text-orange-700 shadow-sm transition flex items-center space-x-1.5 text-xs font-semibold"
            title={soundEnabled ? "Mute robot chimes" : "Enable chimes"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-orange-500" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-orange-200 bg-white/90 hover:bg-orange-50 text-orange-700 shadow-sm transition flex items-center space-x-1.5 text-xs font-semibold"
          >
            <Share2 className="w-4 h-4 text-orange-500" />
            <span className="hidden sm:inline">{copied ? "Copied! 🎉" : "Share"}</span>
          </button>

          {/* Party Mode Preview Button */}
          <button
            onClick={toggleForcePayday}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all duration-300 shadow-md ${
              forcePaydayPreview
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-400 shadow-orange-500/30 scale-105"
                : "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 hover:from-orange-600 hover:to-amber-600 text-white border-transparent hover:shadow-orange-500/25 active:scale-95"
            }`}
          >
            <PartyPopper className="w-4 h-4 animate-bounce" />
            <span>{forcePaydayPreview ? "Exit Preview" : "Preview 17th Payday"}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full">
        
        {/* Simulation Alert Pill */}
        {(isSimulated || forcePaydayPreview) && (
          <div className="mb-6 w-full max-w-lg bg-white/90 border border-orange-300 rounded-2xl p-3 shadow-md shadow-orange-200/50 flex items-center justify-between backdrop-blur text-xs sm:text-sm text-orange-950 animate-bounce">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <span className="font-semibold">
                {forcePaydayPreview 
                  ? "🎉 Simulating the 17th celebration right now" 
                  : `🎈 Simulated Date: ${currentTime.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
              </span>
            </div>
            <button
              onClick={handleResetToRealtime}
              className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded-lg text-orange-800 text-xs font-bold flex items-center space-x-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Today</span>
            </button>
          </div>
        )}

        {/* -------------------- ROBOT MASCOT: B0B-17 -------------------- */}
        <div className="w-full max-w-xl mb-6 bg-white/90 border-2 border-orange-200 rounded-3xl p-4 sm:p-5 shadow-lg shadow-orange-900/5 backdrop-blur-md flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          
          {/* Robot Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-md shadow-orange-500/20">
              <div className="w-full h-full bg-white rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden border border-orange-100">
                {/* Robot Antenna */}
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-1 animate-ping" />
                {/* Robot Screen Face */}
                <div className="w-10 h-7 rounded-lg bg-orange-950 flex items-center justify-around px-1 mt-1 shadow-inner">
                  {/* Robot Eyes (Unenthusiastic horizontal blinkers or deadpan dashes) */}
                  <div className="w-2 h-1 bg-amber-400 rounded-sm" />
                  <div className="w-2 h-1 bg-amber-400 rounded-sm" />
                </div>
                {/* Robot Smile (very tiny neutral mouth) */}
                <span className="text-[10px] font-mono text-orange-600 font-bold leading-none mt-1">b0b</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full p-1 shadow-sm">
              <Bot className="w-3 h-3" />
            </div>
          </div>

          {/* Dialogue Speech Bubble */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-between mb-1">
              <div className="flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-orange-900">
                <Terminal className="w-3.5 h-3.5 text-orange-600" />
                <span>B0B-17 Survival Dispatch</span>
              </div>
              <button 
                onClick={cycleQuote}
                className="text-[11px] text-orange-700 hover:text-orange-950 font-bold flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-orange-100 transition"
                title="Poke B0B-17 for advice"
              >
                <RefreshCw className="w-3 h-3 animate-spin hover:animate-none" />
                <span>poke robot</span>
              </button>
            </div>
            <p className="text-sm font-medium text-orange-950 italic">
              "{currentBotMessage}"
            </p>
          </div>
        </div>

        {/* -------------------- PAYDAY CELEBRATION VIEW (17TH OF THE MONTH) -------------------- */}
        {paydayData.isToday ? (
          <div className="w-full max-w-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
            
            {/* Celebratory Ribbon */}
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/30 border-2 border-white">
              <PartyPopper className="w-5 h-5 animate-bounce" />
              <span>TODAY IS THE 17TH! 給料日</span>
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            {/* Glowing Fiesta Card */}
            <div className="relative rounded-3xl p-1 bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-300 shadow-2xl shadow-orange-500/20">
              <div className="rounded-[22px] bg-white/95 backdrop-blur-xl p-8 sm:p-12 relative overflow-hidden flex flex-col items-center border border-white">
                
                {/* Radial golden halo */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-100/70 via-transparent to-transparent pointer-events-none" />

                {/* Big Animated Icon */}
                <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-300 p-1 shadow-2xl shadow-orange-400/40 mb-6 flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center">
                    <span className="text-6xl sm:text-7xl transform hover:scale-125 transition-transform duration-300 cursor-pointer" onClick={() => triggerConfetti(true)}>
                      💴
                    </span>
                  </div>
                </div>

                {/* Massive Title */}
                <h1 className="relative z-10 text-4xl sm:text-6xl font-black tracking-tight text-orange-950 uppercase mb-2">
                  IT'S <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">PAYDAY!</span>
                </h1>

                {/* Key user quote */}
                <div className="relative z-10 font-mono text-lg sm:text-xl font-black text-orange-600 bg-orange-100/80 px-4 py-1.5 rounded-full border border-orange-300 mb-4 inline-block">
                  wow im so happy for u! 😐🎉
                </div>

                <p className="relative z-10 text-base sm:text-lg text-orange-900/80 max-w-md mx-auto mb-8 font-medium">
                  The yen has safely materialized in your account. You navigated the 29-yen moyashi era with supreme dignity. B0B-17 approves.
                </p>

                {/* Interactive Party Buttons */}
                <div className="relative z-10 flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => {
                      triggerConfetti(false);
                      playPartyFanfare();
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold shadow-lg shadow-orange-500/35 transition transform active:scale-95 flex items-center space-x-2 text-sm sm:text-base"
                  >
                    <PartyPopper className="w-5 h-5" />
                    <span>Fire Mandatory Confetti</span>
                  </button>

                  <button
                    onClick={cycleQuote}
                    className="px-6 py-3.5 rounded-2xl bg-orange-100 hover:bg-orange-200 border-2 border-orange-300 text-orange-800 font-bold transition active:scale-95 flex items-center space-x-2 text-sm sm:text-base"
                  >
                    <Bot className="w-5 h-5 text-orange-600" />
                    <span>Poke B0B-17</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* -------------------- COUNTDOWN TO NEXT 17TH VIEW -------------------- */
          <div className="w-full max-w-3xl flex flex-col items-center space-y-8 animate-in fade-in duration-500">
            
            {/* Header Badge & Title */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-orange-300 shadow-sm">
                <Sun className="w-4 h-4 text-orange-500 animate-spin" style={{ animationDuration: '8s' }} />
                <span className="text-xs font-bold tracking-wider text-orange-800 uppercase">
                  Target: 17th of {paydayData.target.toLocaleString('default', { month: 'long' })}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-orange-950">
                Countdown to <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">Payday</span> 🍊
              </h1>
              <p className="text-sm sm:text-base text-orange-900/70 max-w-md font-medium">
                Hang in there. B0B-17 is counting every single millisecond so your brain doesn't have to.
              </p>
            </div>

            {/* Cheerful 4-Tile Countdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5 w-full">
              {[
                { label: 'Days', value: paydayData.days, icon: Calendar },
                { label: 'Hours', value: paydayData.hours, icon: Clock },
                { label: 'Minutes', value: paydayData.minutes, icon: Flame },
                { label: 'Seconds', value: paydayData.seconds, icon: Sparkles }
              ].map((unit) => (
                <div 
                  key={unit.label}
                  className="group relative rounded-3xl p-1 bg-gradient-to-b from-white via-orange-100 to-orange-200 shadow-xl shadow-orange-900/5 hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="rounded-[22px] bg-white/95 backdrop-blur-md p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden border border-orange-100">
                    
                    {/* Floating mini glow */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100/50 rounded-full blur-xl pointer-events-none" />

                    {/* Number Value */}
                    <div className="text-4xl sm:text-6xl font-black tracking-tight tabular-nums text-orange-950 group-hover:text-orange-600 transition-colors">
                      {String(unit.value).padStart(2, '0')}
                    </div>

                    {/* Unit Label */}
                    <div className="flex items-center space-x-1.5 mt-2">
                      <unit.icon className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs uppercase font-extrabold tracking-wider text-orange-800/80">
                        {unit.label}
                      </span>
                    </div>

                    {/* Bottom bar */}
                    <div className="w-10 h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 mt-3 group-hover:w-16 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Progress Bar */}
            <div className="w-full bg-white/90 border border-orange-200/90 rounded-3xl p-6 shadow-lg shadow-orange-900/5 backdrop-blur-md space-y-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-orange-950">
                <span className="flex items-center space-x-1.5">
                  <Cake className="w-4 h-4 text-orange-500" />
                  <span>Progress to the 17th</span>
                </span>
                <span className="text-orange-600 tabular-nums bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-300">
                  {paydayData.progressPercent.toFixed(1)}% Endured
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 rounded-full bg-orange-100 p-0.5 border border-orange-200 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 transition-all duration-1000 shadow-sm"
                  style={{ width: `${paydayData.progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-orange-800/70 font-semibold pt-1">
                <span>Previous 17th</span>
                <span className="text-orange-900 font-bold">
                  Next Payday: {paydayData.target.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Confetti Trigger */}
            <div className="text-center">
              <button
                onClick={() => {
                  triggerConfetti(true);
                  playRobotBlip();
                }}
                className="px-4 py-2 rounded-full bg-white/80 hover:bg-white border border-orange-200 shadow-sm text-xs font-bold text-orange-700 hover:text-orange-900 transition flex items-center space-x-2 mx-auto active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Require instant synthetic dopamine? Tap here. 🎉</span>
              </button>
            </div>

          </div>
        )}

        {/* -------------------- SIMULATION & CONTROLS BOX -------------------- */}
        <section className="w-full max-w-xl mt-10 bg-white/80 border border-orange-200 rounded-3xl p-5 shadow-md shadow-orange-900/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-orange-900">
              <SlidersHorizontal className="w-4 h-4 text-orange-500" />
              <span>Time Warp Simulator</span>
            </div>
            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
              Testing Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Pick custom test date */}
            <div>
              <label className="block text-orange-900/80 text-[11px] mb-1 font-bold">
                Pick a mock date:
              </label>
              <input
                type="date"
                value={simulatedDateInput}
                onChange={handleSimulateDateChange}
                className="w-full bg-orange-50/70 border border-orange-200 rounded-xl px-3 py-2 text-orange-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
              />
            </div>

            {/* Quick jump actions */}
            <div className="flex flex-col justify-end">
              <label className="block text-orange-900/80 text-[11px] mb-1 font-bold">
                Direct Jump:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setDate(17);
                    setSimulatedDateInput(d.toISOString().split('T')[0]);
                    setCurrentTime(d);
                    setIsSimulated(true);
                    setForcePaydayPreview(false);
                  }}
                  className="px-2.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-center font-bold shadow-sm transition active:scale-95"
                >
                  Jump to 17th
                </button>
                <button
                  onClick={handleResetToRealtime}
                  className="px-2.5 py-2 bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-800 rounded-xl text-center font-bold transition active:scale-95"
                >
                  Reset Today
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Cheerful Footer */}
      <footer className="relative z-10 border-t border-orange-200/80 bg-white/70 backdrop-blur-md px-4 py-4 text-center text-xs text-orange-800/80 font-medium flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <Bot className="w-4 h-4 text-orange-500" />
          <span>B0B-17 Protocol: Tracking the 17th so you never miss payday.</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-orange-700 font-semibold">
          <span>wow im so happy for u</span>
          <Heart className="w-3 h-3 text-orange-500 inline fill-orange-400" />
        </div>
      </footer>

    </div>
  );
}
