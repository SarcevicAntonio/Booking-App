<script>
  import Error from "./components/Error.svelte";
  import Login from "./components/Login.svelte";
  import ThemeSwitcher from "./components/ThemeSwitcher.svelte";
  import Tours from "./Tours/Tours.svelte";
  import dayjs from 'dayjs';


  let loggedIn = true;
</script>

<style>
  header {
    position: fixed;
    width: 100%;
    top: 0;
    background: var(--highlight);
    padding: 8px;
    height: 56px;
  }
  footer {
    padding: 8px;
    background: var(--mid);    
    color: var(--white);
    text-align: right;
  }
  .header-pad {
    height: 56px;
  }
  h1 {
    color: var(--black);
  }
  .login-error {
    background-color: transparent;
  }
</style>

<!-- TODO: responsiveness -->

<header class="space-between">
  <h1>🏴‍☠️ Pirate Bay Tours Booking Client</h1>
  <div>
    <ThemeSwitcher />
    <!-- todo: user management -->
    <Login bind:loggedIn />
  </div>
</header>

<main>
  <div class="header-pad" />

  {#if loggedIn}
    <Tours />
  {:else}
    <div class="section login-error">
      <Error
        error="You are not logged in. Please log in using the button above." />
    </div>
  {/if}
</main>

<footer>Made with 💖 by Gruppe 4 for Pirate Bay Tours © {dayjs().format('YYYY')}</footer>
