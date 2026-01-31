<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { appState } from '$lib/core/app.svelte';
  import { MESSAGES } from '$lib/i18n';
</script>

<button 
  type="button" 
  role="switch" 
  aria-checked={appState.isDark}
  onclick={(e) => appState.toggleTheme(e)}
  title={MESSAGES.UI.TIP_SWITCH_THEME}
  class="relative shrink-0 w-16 h-10 rounded-full border border-border transition-colors duration-300 ease-in-out cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden bg-icon-bg hover:border-primary/30"
>
  <span 
    class={`absolute top-1/2 -translate-y-1/2 left-1 h-8 w-8 rounded-full bg-surface shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
      appState.isDark ? 'translate-x-6' : 'translate-x-0'
    }`}
  >
    <span class={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
      appState.isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
    }`}>
      <Sun class="w-5 h-5 text-text-dim group-hover:text-primary transition-colors" />
    </span>
    
    <span class={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
      appState.isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
    }`}>
      <Moon class="w-5 h-5 text-primary" />
    </span>
  </span>
</button>