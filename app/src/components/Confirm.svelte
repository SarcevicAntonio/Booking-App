<script>
  import { createEventDispatcher } from "svelte";

  import Modal from "./Modal.svelte";
  const dispatch = createEventDispatcher();
  export let label = "⁉️ confirm";
  let modal;

  function fireEvent(key, data) {
    modal.close();
    dispatch(key, data);
  }
</script>

<button
  on:click={() => {
    modal.open();
  }}>
  {label}
</button>

<Modal title={'❓ Please confirm'} bind:modal>
  <slot>Are you sure?</slot>
  <div class="space-between">
    <button
      class="wide-btn"
      on:click={() => {
        fireEvent('confirm', true);
      }}>✔️ yes</button>
    <div class="spacer" />
    <button
      class="wide-btn"
      on:click={() => {
        fireEvent('abort', false);
      }}>❌ no, sorry</button>
  </div>
</Modal>
