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
  class="relative shrink-0 w-11 h-6 rounded-full border border-border bg-icon-bg hover:border-primary/50 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
>
  <span 
    class={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-surface shadow-sm ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center transition-transform duration-300 will-change-transform ${
      appState.isDark ? 'translate-x-5' : 'translate-x-0'
    }`}
  >
    <span class="relative w-3 h-3 block overflow-hidden">
      <span class={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
        appState.isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
      }`}>
        <Sun class="w-3 h-3 text-text-dim" />
      </span>
      
      <span class={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
        appState.isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
      }`}>
        <Moon class="w-3 h-3 text-text-dim" />
      </span>
    </span>
  </span>
</button>