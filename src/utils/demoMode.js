export function initDemoMode() {
  window.DEMO_USER = {
    isAuthenticated: true,
    role: 'all',
    name: 'Utilisateur Demo',
    demo: true,
  }

  if (typeof window.checkAuth === 'function') {
    window.checkAuth = () => true
  }

  if (typeof window.requireAuth === 'function') {
    window.requireAuth = () => true
  }

  window.hasRole = () => true

  window.logout = () => {
    console.warn('Mode demonstration : logout desactive')
    return false
  }

  window.getDemoRole = () => window.DEMO_USER.role
}
