<script>
  import { createEventDispatcher } from "svelte";
  import Error from "../components/Error.svelte";

  const dispatch = createEventDispatcher();

  let newReservationError = false;
  let newReservation = {
    firstName: "",
    lastName: "",
    phone: "",
    groupSize: 1,
  };

  function handleCreateReservation() {
    if (
      !newReservation.firstName ||
      !newReservation.lastName ||
      !newReservation.phone ||
      !newReservation.groupSize
    ) {
      newReservationError = true;
    } else {
      newReservationError = false;
      dispatch("newReservation", newReservation);
    }
  }
</script>

{#if newReservationError}
  <Error />
{/if}
<div class="space-between">
  <label>🏷️ First name *<input bind:value={newReservation.firstName} /> </label>
  <div class="spacer" />
  <label>🏷️ Last name *<input bind:value={newReservation.lastName} /> </label>
</div>
<label>📞 Phone number *<input bind:value={newReservation.phone} /> </label>
<label>
  #️⃣ Number of group members *
  <input type="number" min="0" bind:value={newReservation.groupSize} />
</label>
<button class="wide-btn" on:click={handleCreateReservation}>✨ create new
  reservation!</button>
