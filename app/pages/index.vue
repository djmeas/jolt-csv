<script setup lang="ts">
const { loggedIn, user } = useUserSession()
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
    <!-- Header -->
    <header class="border-b border-slate-800/50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <span class="text-lg font-semibold text-white">
          ⚡ Jolt Template
        </span>
        <nav class="flex items-center gap-4">
          <NuxtLink
            v-if="loggedIn"
            to="/dashboard"
            class="text-slate-300 hover:text-white transition-colors"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            v-if="!loggedIn"
            to="/login"
            class="text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            v-if="!loggedIn"
            to="/register"
            class="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Get started
          </NuxtLink>
          <NuxtLink
            v-else
            to="/dashboard"
            class="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Open app
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div class="text-center max-w-3xl mx-auto">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
          Give your vibes a <span class="jolt-zap inline-flex">
            <span class="jolt-letter">J</span><span class="jolt-letter">O</span><span class="jolt-letter">L</span><span class="jolt-letter">T</span>
          </span> ⚡
        </h1>
        <p class="mt-6 text-xl text-slate-400 leading-relaxed">
          A full-stack Nuxt starter with SQLite, auth, and Tailwind. Clone it, tweak it, ship it. No config headaches—just code.
        </p>
        <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/djmeas/jolt-template"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-slate-600 text-slate-300 font-medium hover:border-slate-500 hover:text-white transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>

      <!-- Stack -->
      <div class="mt-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
            N
          </div>
          <h3 class="mt-4 font-semibold text-white">
            Nuxt 4
          </h3>
          <p class="mt-2 text-sm text-slate-400">
            Vue 3, file-based routing, server API routes. The full-stack framework that just works.
          </p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
            S
          </div>
          <h3 class="mt-4 font-semibold text-white">
            SQLite + Drizzle
          </h3>
          <p class="mt-2 text-sm text-slate-400">
            Type-safe schema, migrations, zero config. Local-first database that scales with you.
          </p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-lg">
            T
          </div>
          <h3 class="mt-4 font-semibold text-white">
            Tailwind CSS
          </h3>
          <p class="mt-2 text-sm text-slate-400">
            Utility-first styling. Build modern UIs without writing custom CSS.
          </p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-lg">
            A
          </div>
          <h3 class="mt-4 font-semibold text-white">
            Auth
          </h3>
          <p class="mt-2 text-sm text-slate-400">
            Email/password signup, encrypted sessions, admin roles. Ready to extend.
          </p>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-24 text-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50">
        <h2 class="text-2xl font-bold text-white">
          Ready to build something?
        </h2>
        <p class="mt-2 text-slate-400">
          <code class="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-sm">npm run dev</code> and you're off.
        </p>
        <NuxtLink
          to="/register"
          class="inline-block mt-6 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
        >
          Create your first account →
        </NuxtLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800/50 mt-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p class="text-center text-slate-500 text-sm">
          Nuxt + SQLite + Tailwind starter template. Clone, customize, ship.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes jolt-flash {
  0%, 70%, 100% {
    color: #64748b;
    text-shadow: none;
  }
  5%, 25%, 45% {
    color: #ffffff;
    text-shadow: 0 0 10px #ffffff, 0 0 20px #67e8f9, 0 0 30px #38bdf8;
  }
  10%, 30%, 50% {
    color: #fef08a;
    text-shadow: 0 0 8px #fef08a, 0 0 16px #fbbf24;
  }
}

.jolt-letter {
  display: inline-block;
  animation: jolt-flash 3s ease-in-out infinite;
}

.jolt-letter:nth-child(1) { animation-delay: 0s; }
.jolt-letter:nth-child(2) { animation-delay: 0.08s; }
.jolt-letter:nth-child(3) { animation-delay: 0.16s; }
.jolt-letter:nth-child(4) { animation-delay: 0.24s; }
</style>
