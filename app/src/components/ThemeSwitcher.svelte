<script>
  import { onMount } from "svelte";
  import { themes } from "../themes";

  let id = localStorage.getItem("theme");
  let allIds = Object.keys(themes);
  let showSelector = false;

  $: {
    localStorage.setItem("theme", id);
    if (themes[id]) {
      const props = Object.keys(themes[id]);
      props.forEach((prop) => {
        document.documentElement.style.setProperty(
          "--" + prop,
          themes[id][prop]
        );
      });
    }
  }

  onMount(() => {
    const storageId = localStorage.getItem("theme");
    if (themes[storageId]) {
      id = storageId;
    } else {
      setRandomTheme();
    }
  });

  function setRandomTheme() {
    let randomId = getRandomObjectKey(themes);
    while (id === randomId) {
      randomId = getRandomObjectKey(themes);
    }
    id = randomId;
  }

  function getRandomObjectKey(obj) {
    const ids = Object.keys(obj);
    return ids[(ids.length * Math.random()) | 0];
  }
</script>

<style>
  button {
    background-color: var(--mid);
    height: 40px;
    width: 40px;
  }
  .selector {
    padding: 8px;
    border-radius: 8px;
    background-color: var(--highlight);
    position: absolute;
    right: 8px;
    top: 64px
  }
  .selector-item {
    margin-right: 8px;
    background-color: var(--mid);
  }
</style>

<button
  on:click={() => {
    showSelector = !showSelector;
  }}>
  {id}
</button>
{#if showSelector}
  <div class="selector">
    {#each allIds as selectId}
      <button class="selector-item"
        on:click={() => {
          id = selectId;
        }}>{selectId}</button>
    {/each}
    <button on:click={setRandomTheme}>❓</button>
  </div>
{/if}
