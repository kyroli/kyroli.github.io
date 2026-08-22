<script lang="ts">
import { Moon, Sun } from '@lucide/svelte';
import { appState } from '$lib/core/app.svelte';
import { MESSAGES } from '$lib/i18n';
import Button from './Button.svelte';

function handleToggle(e: MouseEvent) {
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.blur();
  }
  appState.hideTooltip();
  appState.toggleTheme();
}
</script>

<Button
  variant="outline"
  size="icon"
  onclick={handleToggle}
  title={MESSAGES.UI.TIP_SWITCH_THEME}
  class="tap-target hover-spin"
>
  {#if appState.isDark}
    <Moon class="w-5 h-5" />
  {:else}
    <Sun class="w-5 h-5" />
  {/if}
</Button>