<script>
  export let error = "Some fields are empty or wrong. Please check your input!";
</script>

<style>
  div {
    background-color: var(--accent);
    margin-top: 8px;
    padding: 16px;
    border-radius: 8px;
    text-align: center;
  }
  h4 {
    color: #bd0000;
  }
</style>

<div>
  <h4>⚠️ {error} ⚠️</h4>
</div>
