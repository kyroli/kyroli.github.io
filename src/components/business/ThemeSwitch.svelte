<script lang="ts">
import { appState } from '$lib/core/app.svelte';
import { MESSAGES } from '$lib/i18n';
import Button from '../ui/Button.svelte';
import Icon from '../ui/Icon.svelte';

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
  class="tap-target"
>
  {#if appState.isDark}
    <Icon name="moon" class="w-5 h-5" />
  {:else}
    <Icon name="sun" class="w-5 h-5" />
  {/if}
</Button>