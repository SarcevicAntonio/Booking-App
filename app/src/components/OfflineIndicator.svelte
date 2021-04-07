<script>
  $: isOnline = navigator.onLine || false; // data variable

  const update = () => {
    if (!navigator.onLine) {
      isOnline = false;
    } else {
      isOnline = true;
    }
  };
</script>

<svelte:window on:online={update} on:offline={update} on:load={update} />

{#if isOnline}
  <div class="online">online</div>
{:else}
  <div class="offline">offline. sync wont work!</div>
{/if}

<style>
  div {
    display: inline-block;
    border-radius: 8px;
    height: 40px;
    color: white;
    padding: 8px;
    border-radius: 8px;
    font-size: 16px;
  }
  .online {
    background-color: yellowgreen;
    color: black;
  }
  .offline {
    background-color: red;
  }
</style>
