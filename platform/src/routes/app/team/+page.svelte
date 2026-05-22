<script lang="ts">
  import { enhance } from '$app/forms'

  let { data, form } = $props()

  let showInvite = $state(false)
  let inviteEmail = $state('')
  let inviteRole = $state('developer')

  const roleLabels: Record<string, string> = {
    owner:     'Owner',
    admin:     'Admin',
    developer: 'Developer',
    viewer:    'Viewer',
    billing:   'Billing',
  }

  const roleDescriptions: Record<string, string> = {
    owner:     'Full access including billing and destructive operations',
    admin:     'Full access except billing and ownership transfer',
    developer: 'Instance configuration, API keys, memory — no billing',
    viewer:    'Read-only access to dashboards and audit logs',
    billing:   'Billing dashboard only — no instance access',
  }
</script>

<div class="space-y-8">

  <div class="flex items-start justify-between">
    <div>
      <h1 class="font-syne font-bold text-3xl text-ink">Team</h1>
      <p class="font-syne text-sm text-ink/40 mt-1">{data.org.name}</p>
    </div>
    <button
      onclick={() => { showInvite = true; inviteEmail = ''; inviteRole = 'developer' }}
      class="bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
        px-4 py-2.5 rounded hover:bg-ink/80 transition-opacity">
      Invite member
    </button>
  </div>

  {#if form?.invited}
    <div class="flex items-center gap-2 px-4 py-3 rounded" style="background:#EEF1FF;border-left:3px solid #1A3AFF">
      <span class="font-syne font-bold text-sm" style="color:#1A3AFF">Invitation sent</span>
    </div>
  {/if}

  {#if showInvite}
    <div class="bg-white border border-rule p-6">
      <h2 class="font-syne font-bold text-base text-ink mb-5">Invite team member</h2>
      <form method="POST" action="?/invite" use:enhance class="space-y-4">
        {#if form?.action === 'invite' && form?.error}
          <p class="font-mono text-xs text-amber">{form.error}</p>
        {/if}
        <div class="grid gap-4" style="grid-template-columns: 1fr 200px">
          <div>
            <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
              Email address
            </label>
            <input type="email" name="email" bind:value={inviteEmail} placeholder="colleague@example.com"
              class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
                placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"/>
          </div>
          <div>
            <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
              Role
            </label>
            <select name="role" bind:value={inviteRole}
              class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
                focus:outline-none focus:border-ink/40 rounded transition-colors">
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="viewer">Viewer</option>
              <option value="billing">Billing</option>
            </select>
          </div>
        </div>
        <p class="font-syne text-xs text-ink/40">{roleDescriptions[inviteRole]}</p>
        <div class="flex items-center gap-3 pt-1">
          <button type="submit"
            class="bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
              px-4 py-2.5 rounded hover:bg-ink/80 transition-opacity">
            Send invitation
          </button>
          <button type="button" onclick={() => showInvite = false}
            class="font-syne text-xs text-ink/40 hover:text-ink transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Members table -->
  <div class="bg-white border border-rule">
    <div class="grid px-6 py-3 border-b border-rule"
      style="grid-template-columns: 1fr 120px 120px 80px">
      <span class="font-syne font-bold text-xs uppercase text-ink/40">Member</span>
      <span class="font-syne font-bold text-xs uppercase text-ink/40">Role</span>
      <span class="font-syne font-bold text-xs uppercase text-ink/40">Status</span>
      <span class="font-syne font-bold text-xs uppercase text-ink/40"></span>
    </div>

    {#each data.members as member, i}
      <div class="grid px-6 py-4 items-center {i < data.members.length - 1 ? 'border-b border-rule' : ''}"
        style="grid-template-columns: 1fr 120px 120px 80px">
        <div>
          <p class="font-syne font-bold text-sm text-ink">{member.email}</p>
          {#if member.user_id === data.currentUserId}
            <p class="font-mono text-xs text-ink/30 mt-0.5">You</p>
          {/if}
        </div>
        <span class="font-mono text-xs px-2 py-0.5 rounded" style="background:#EEF1FF;color:#1A3AFF">
          {roleLabels[member.role] ?? member.role}
        </span>
        <span class="font-syne text-xs {member.pending ? 'text-amber' : 'text-ink/40'}">
          {member.pending ? 'Pending' : 'Active'}
        </span>
        {#if member.role !== 'owner'}
          <form method="POST" action="?/remove" use:enhance>
            <input type="hidden" name="role_id" value={member.id} />
            <button type="submit"
              class="font-syne text-xs text-ink/30 hover:text-amber transition-colors">
              Remove
            </button>
          </form>
        {:else}
          <span></span>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Role reference -->
  <div class="border-t border-rule pt-6">
    <p class="font-syne font-bold text-xs uppercase text-ink/40 mb-3">Role permissions</p>
    <div class="space-y-2">
      {#each Object.entries(roleDescriptions) as [role, desc]}
        <div class="flex items-start gap-3">
          <span class="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0" style="background:#EEF1FF;color:#1A3AFF">
            {roleLabels[role]}
          </span>
          <span class="font-syne text-xs text-ink/50">{desc}</span>
        </div>
      {/each}
    </div>
  </div>

</div>