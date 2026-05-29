<script lang="ts">
    let { show, onDismiss }: { show: boolean, onDismiss: () => void } = $props();
    let currentStep = $state(1);

    const dismiss = () => {
        localStorage.setItem('thalium_onboarding_dismissed', '1');
        onDismiss();
    };

    const nextStep = () => {
        if (currentStep < 4) currentStep++;
    };

    const prevStep = () => {
        if (currentStep > 1) currentStep--;
    };
</script>

{#if show}
    <div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background-color: #F7F5F0; max-width: 520px; width: 100%; padding: 40px; border-radius: 4px; position: relative;">
            <button 
                style="position: absolute; top: 20px; right: 20px; background: none; border: none; cursor: pointer; font-family: 'DM Mono', monospace;"
                onclick={dismiss}
            >
                ✕
            </button>

            <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 32px;">
                {#each [1, 2, 3, 4] as dot}
                    <div 
                        style="width: 8px; height: 8px; border-radius: 50%; background-color: {dot <= currentStep ? '#1A3AFF' : '#E0DED8'};"
                    />
                {/each}
            </div>

            {#if currentStep === 1}
                <h1 style="font-family: 'Syne', sans-serif; font-size: 24px; color: #0D0D0D; margin-bottom: 16px;">Welcome to Thalium</h1>
                <p style="font-family: 'Syne', sans-serif; color: #0D0D0D; margin-bottom: 32px; line-height: 1.5;">
                    You have a Brain Instance waiting to be created. This walkthrough takes 3 minutes and ends with a working API integration.
                </p>
                <button 
                    style="background-color: #1A3AFF; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-family: 'DM Mono', monospace; cursor: pointer;"
                    onclick={nextStep}
                >
                    Next
                </button>
            {:else if currentStep === 2}
                <div style="margin-bottom: 24px;">
                    <span style="font-family: 'DM Mono', monospace; color: #0D0D0D; font-size: 12px; letter-spacing: 0.1em;">STEP 1 OF 3</span>
                    <h1 style="font-family: 'Syne', sans-serif; font-size: 24px; color: #0D0D0D; margin: 8px 0 16px;">Create your Brain Instance</h1>
                    <p style="font-family: 'Syne', sans-serif; color: #0D0D0D; margin-bottom: 24px; line-height: 1.5;">
                        A Brain Instance is your isolated AI memory context. Give it a name and a domain - the domain tells the Brain what kind of knowledge to expect.
                    </p>
                </div>
                <div style="display: flex; gap: 16px;">
                    <button 
                        style="background: none; border: 1px solid #0D0D0D; padding: 12px 24px; border-radius: 4px; font-family: 'DM Mono', monospace; cursor: pointer;"
                        onclick={prevStep}
                    >
                        Back
                    </button>
                    <a 
                        href="/app/instances/new" 
                        style="background-color: #1A3AFF; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-family: 'DM Mono', monospace; cursor: pointer; text-decoration: none;"
                        onclick={dismiss}
                    >
                        Create Brain Instance →
                    </a>
                </div>
            {:else if currentStep === 3}
                <div style="margin-bottom: 24px;">
                    <span style="font-family: 'DM Mono', monospace; color: #0D0D0D; font-size: 12px; letter-spacing: 0.1em;">STEP 2 OF 3</span>
                    <h1 style="font-family: 'Syne', sans-serif; font-size: 24px; color: #0D0D0D; margin: 8px 0 16px;">Generate an API key</h1>
                    <p style="font-family: 'Syne', sans-serif; color: #0D0D0D; margin-bottom: 24px; line-height: 1.5;">
                        Once your instance is created, go to its API keys tab and generate a key with invoke scope. This is the credential your application uses.
                    </p>
                    <pre style="background-color: #E0DED8; padding: 16px; border-radius: 4px; font-family: 'DM Mono', monospace; color: #0D0D0D; overflow-x: auto;">
invoke | memory:read | memory:write | full-access
</pre>
                </div>
                <div style="display: flex; gap: 16px;">
                    <button 
                        style="background: none; border: 1px solid #0D0D0D; padding: 12px 24px; border-radius: 4px; font-family: 'DM Mono', monospace; cursor: pointer;"
                        onclick={prevStep}
                    >
                        Back
                    </button>
                    <button 
                        style="background-color: #1A3AFF; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-family: 'DM Mono', monospace; cursor: pointer;"
                        onclick={nextStep}
                    >
                        Next
                    </button>
                </div>
            {:else if currentStep === 4}
                <div style="margin-bottom: 24px;">
                    <span style="font-family: 'DM Mono', monospace; color: #0D0D0D; font-size: 12px; letter-spacing: 0.1em;">STEP 3 OF 3</span>
                    <h1 style="font-family: 'Syne', sans-serif; font-size: 24px; color: #0D0D0D; margin: 8px 0 16px;">Make your first invocation</h1>
                    <p style="font-family: 'Syne', sans-serif; color: #0D0D0D; margin-bottom: 24px; line-height: 1.5;">
                        Send a POST request to the invoke endpoint with your input, brain_id, and domain. The Brain returns a structured artifact via SSE.
                    </p>
                    <pre style="background-color: #E0DED8; padding: 16px; border-radius: 4px; font-family: 'DM Mono', monospace; color: #0D0D0D; overflow-x: auto; margin-bottom: 24px;">
POST /v1/brain/{id}/invoke
Authorization: Bearer thal_...
&#123;"input":"...","brain_id":"...","domain":"..."&#125;
</pre>
                </div>
                <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                    <button 
                        style="background: none; border: 1px solid #0D0D0D; padding: 12px 24px; border-radius: 4px; font-family: 'DM Mono', monospace; cursor: pointer;"
                        onclick={prevStep}
                    >
                        Back
                    </button>
                    <a 
                        href="/docs/quickstart" 
                        style="background-color: #1A3AFF; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-family: 'DM Mono', monospace; cursor: pointer; text-decoration: none;"
                        onclick={dismiss}
                    >
                        View API docs →
                    </a>
                </div>
                <button 
                    style="background: none; border: none; font-family: 'DM Mono', monospace; color: #0D0D0D; text-decoration: underline; cursor: pointer;"
                    onclick={dismiss}
                >
                    Skip walkthrough
                </button>
            {/if}
        </div>
    </div>
{/if}