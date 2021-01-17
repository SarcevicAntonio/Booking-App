<script>
  import { onMount } from "svelte";
  import { isEnter } from "../index";
  import { authCouch } from "../pouch";
  import Error from "./Error.svelte";
  import Modal from "./Modal.svelte";

  export let loggedIn = false;
  let username;
  let pwd;
  let modal;
  let error = false;

  function checkLoginState() {
    authCouch.session(function (err, response) {
      if (response.userCtx.name) {
        loggedIn = true;
      } else {
        loggedIn = false;
      }
    });
  }

  function login() {
    if (username && pwd) {
      authCouch.logIn(username, pwd, () => {
        modal.close();
        checkLoginState();
        error = false;
      });
    } else {
      error = true;
    }
  }

  async function logout() {
    await authCouch.logOut();
    checkLoginState();
  }

  function handleKeydown(event) {
    if (isEnter(event)) {
      login();
    }
  }

  function openModal() {
    modal.open();
  }

  onMount(async () => {
    await authCouch.useAsAuthenticationDB();
    checkLoginState();
  });
</script>

<style>
  button {
    background-color: var(--mid);
    color: var(--white);
    padding: 8px;
    border-radius: 8px;
    font-size: 16px;
  }
  .wide-btn {
    background-color: var(--highlight);
    color: var(--black);
  }
</style>

{#if loggedIn}
  <button on:click={logout}>🔒 Log out</button>
{:else}<button on:click={openModal}>🔓 Log in</button>{/if}

<Modal title="🔒 Authentication" bind:modal>
  {#if error}
    <Error />
  {/if}
  <label>🏷️ Username *<input bind:value={username} on:keydown={handleKeydown} />
  </label>
  <label>🔑 Password *<input
      type="password"
      bind:value={pwd}
      on:keydown={handleKeydown} />
  </label>
  <button class="wide-btn" on:click={login}>🔓 Log in</button>
</Modal>
