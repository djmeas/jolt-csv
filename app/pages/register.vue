<script setup lang="ts">
definePageMeta({
  middleware: ['guest']
})

const { fetch: refreshSession } = useUserSession()
const credentials = reactive({
  email: '',
  password: ''
})
const error = ref('')

async function register() {
  error.value = ''
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: credentials
    })
    await refreshSession()
    await navigateTo('/dashboard')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message ?? 'Registration failed'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-xl shadow-slate-900/20 p-8">
        <h1 class="text-2xl font-bold text-slate-900 mb-6">
          Create an account
        </h1>
        <form @submit.prevent="register" class="space-y-5">
          <div v-if="error" class="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {{ error }}
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              class="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            >
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              placeholder="Min 8 characters"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            >
          </div>
          <button
            type="submit"
            class="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Sign up
          </button>
        </form>
        <p class="mt-6 text-center text-sm text-slate-600">
          Already have an account?
          <NuxtLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
