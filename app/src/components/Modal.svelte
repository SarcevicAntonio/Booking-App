<script>
  export let title = "Modal Header";
  export const modal = {
    toggle() {
      open = !open;
    },
    open() {
      open = true;
    },
    close() {
      open = false;
    },
  };
  let open = false;
</script>

<style>
  .modal {
    display: block;
    position: fixed;
    z-index: 100;
    background: var(--mid);
    padding: 8px;
    border-radius: 8px;
    left: 20%;
    width: 60%;
    top: 64px;
    max-height: calc(100% - 128px);
    overflow: auto;
  }

  @media only screen and (max-width: 768px) {
    .modal {
      left: 8px;
      width: calc(100% - 16px);
    }
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 50;
    background: rgba(0, 0, 0, 0.6);
  }

  h4 {
    margin: 0px;
  }

  button {
    background-color: var(--bg);
    color: var(--white);
  }
</style>

{#if open}
  <div class="modal-overlay" id="modal-overlay" />
  <div class="modal">
    <div class="space-between">
      <h4>{title}</h4>
      <button on:click={modal.close}>❌ close modal</button>
    </div>
    <slot />
  </div>
{/if}
