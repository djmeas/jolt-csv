export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, fetch: fetchSession } = useUserSession()
  await fetchSession()
  if (loggedIn.value) {
    return navigateTo('/dashboard')
  }
})
