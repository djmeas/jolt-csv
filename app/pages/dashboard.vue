<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const { user, clear: clearSession } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clearSession()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div class="w-full max-w-lg">
      <div class="bg-white rounded-2xl shadow-xl shadow-slate-900/20 p-8">
        <NuxtLink to="/" class="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">
          ← Back to home
        </NuxtLink>
        <h1 class="text-2xl font-bold text-slate-900 mb-2">
          Welcome{{ user?.email ? `, ${user.email}` : '' }}
        </h1>
        <p v-if="user?.isAdmin" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-6">
          Admin
        </p>
        <p v-else class="mb-6 text-slate-600">
          You're signed in.
        </p>
        <button
          type="button"
          @click="logout"
          class="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>
