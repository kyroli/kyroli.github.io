<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { appState } from '$lib/core/app.svelte';
  import { MESSAGES } from '$lib/i18n';
</script>

<button 
  type="button" 
  role="switch" 
  aria-checked={appState.isDark}
  onclick={appState.toggleTheme}
  title={MESSAGES.UI.TIP_SWITCH_THEME}
  class={`relative shrink-0 w-16 h-10 rounded-full p-1 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
    appState.isDark 
      ? 'bg-primary border-transparent'
      : 'bg-surface-alt border border-border hover:border-border-dark'
  }`}
>
  <span 
    class={`pointer-events-none relative h-8 w-8 rounded-full bg-surface shadow-sm flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
      appState.isDark ? 'translate-x-6' : 'translate-x-0'
    }`}
  >
    <span class={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
      appState.isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
    }`}>
      <Sun class="w-5 h-5 text-text" />
    </span>
    
    <span class={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
      appState.isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
    }`}>
      <Moon class="w-5 h-5 text-primary" />
    </span>
  </span>
</button>