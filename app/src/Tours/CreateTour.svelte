<script>
  import { createEventDispatcher } from "svelte";
  import Error from "../components/Error.svelte";
  import marked from "marked";

  const dispatch = createEventDispatcher();

  let newTourError = false;
  let newTour = {
    icon: "📍",
    name: "",
    maxPassenger: 100,
    description: "",
    reservations: [],
  };
  let showPreview = false;

  function handleCreateTour() {
    if (!newTour.name || !newTour.maxPassenger) {
      newTourError = true;
    } else {
      newTourError = false;
      dispatch("newTour", newTour);
    }
  }

  function togglePreview() {
    showPreview = !showPreview;
  }
</script>

<style>
  .preview {
    padding: 8px;
    border-radius: 8px;
    margin-top: 8px;
    border: 1px solid var(--bg);
  }
</style>

{#if newTourError}
  <Error />
{/if}
<label>🏷️ Name *<input bind:value={newTour.name} /> </label>
<label>
  #️⃣ Max. Number of Passengers *
  <input type="number" min="0" bind:value={newTour.maxPassenger} />
</label>

<label>
  📜 Description Markdown<textarea bind:value={newTour.description} />
</label>

{#if newTour.description}
  <button class="wide-btn" on:click={togglePreview}>
    {showPreview ? '😎 hide description markdown preview' : '👀 show description markdown preview'}
  </button>
  {#if showPreview}
    <div class="preview" if>
      {@html marked(newTour.description)}
    </div>
  {/if}
{/if}
<button class="wide-btn" on:click={handleCreateTour}>✨ create new tour!</button>
