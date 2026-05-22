<script lang="ts">
  import { enhance } from '$app/forms'

  let { data, form } = $props()

  let confirmText = $state('')
  let showDeleteForm = $state(false)
</script>

<div class="space-y-10 max-w-2xl">

  <div>
    <h1 class="font-syne font-bold text-3xl text-ink">Settings</h1>
    <p class="font-syne text-sm text-ink/40 mt-1">{data.instance.name}</p>
  </div>

  <!-- Rename -->
  <section>
    <h2 class="font-syne font-bold text-base text-ink mb-1">Rename instance</h2>
    <p class="font-syne text-sm text-ink/40 mb-5">Update the display name for this Brain Instance.</p>
    <form method="POST" action="?/rename" use:enhance class="bg-white border border-rule p-6 space-y-4">
      {#if form?.renamed}
        <div class="flex items-center gap-2 px-3 py-2 rounded" style="background:#EEF1FF">
          <span class="font-syne font-bold text-xs" style="color:#1A3AFF">Name updated</span>
        </div>
      {/if}
      {#if form?.action === 'rename' && form?.error}
        <p class="font-mono text-xs text-amber">{form.error}</p>
      {/if}
      <div>
        <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
          Instance name
        </label>
        <input type="text" name="name" value={data.instance.name}
          class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
            focus:outline-none focus:border-ink/40 rounded transition-colors"/>
      </div>
      <button type="submit"
        class="bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
          px-5 py-2.5 rounded hover:bg-ink/80 transition-opacity">
        Save name
      </button>
    </form>
  </section>

  <!-- Danger zone -->
  <section>
    <h2 class="font-syne font-bold text-base mb-1" style="color:#B45309">Danger zone</h2>
    <p class="font-syne text-sm text-ink/40 mb-5">
      Destructive actions. These cannot be undone.
    </p>
    <div class="border border-rule" style="border-color: rgba(180,83,9,0.3)">
      <div class="p-6">
        <div class="flex items-start justify-between gap-6">
          <div>
            <p class="font-syne font-bold text-sm text-ink">Delete this Brain Instance</p>
            <p class="font-syne text-xs text-ink/40 mt-0.5">
              Permanently deletes the Brain Instance, all ring entries, audit log, and API keys.
              This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onclick={() => showDeleteForm = !showDeleteForm}
            class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2.5 rounded
              border flex-shrink-0 transition-colors"
            style="border-color:#B45309;color:#B45309">
            Delete instance
          </button>
        </div>

        {#if showDeleteForm}
          <form method="POST" action="?/delete" use:enhance class="mt-6 pt-6 border-t space-y-4"
            style="border-color: rgba(180,83,9,0.2)">
            {#if form?.action === 'delete' && form?.error}
              <p class="font-mono text-xs text-amber">{form.error}</p>
            {/if}
            <div>
              <label class="block font-syne font-bold text-xs tracking-wide uppercase mb-2"
                style="color:#B45309">
                Type DELETE to confirm
              </label>
              <input type="text" name="confirm" bind:value={confirmText}
                placeholder="DELETE"
                class="w-full border px-3 py-2.5 font-mono text-sm text-ink
                  focus:outline-none rounded transition-colors"
                style="border-color: rgba(180,83,9,0.4)"/>
            </div>
            <button type="submit"
              disabled={confirmText !== 'DELETE'}
              class="font-syne font-bold text-xs tracking-widest uppercase px-5 py-2.5 rounded
                text-white disabled:opacity-30 transition-opacity"
              style="background:#B45309">
              Permanently delete
            </button>
          </form>
        {/if}
      </div>
    </div>
  </section>

</div>