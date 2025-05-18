<script lang="ts">
  import { onMount } from 'svelte';
  import svelteLogo from './assets/svelte.svg';
  import viteLogo from '/vite.svg';
  import Counter from './lib/Counter.svelte';
  import nytlogo from './assets/logo.png'

  let apiKey: string = '';
  let articles: any[] = [];
  let userEmail = null;
  let showSidebar = false;

  onMount(async () => {
    try {
      const res = await fetch('/api/key');
      const data = await res.json();
      apiKey = data.apiKey;
      const nytURL = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=Sacramento&api-key=${apiKey}`;
      const nytRes = await fetch(nytURL);
      const nytData = await nytRes.json();
      const docs = nytData?.response?.docs;
      if (Array.isArray(docs)) {
        articles = docs.slice(0, 6);
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    }
    try {
      const res = await fetch("/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        userEmail = data.email;
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  });

  function toggleSidebar() {
    showSidebar = !showSidebar;
  }

  function logout() {
    window.location.href = '/logout';
  }
</script>

<main>
  <header>
    <div class="logo">
      <img src={nytlogo} class="logo" alt="NYT Logo" />
    </div>
    <p class="date"></p>
    {#if userEmail}
      <div class="account-dropdown">
        <button class="account-btn" on:click={toggleSidebar}>
          Account <span class="arrow">▼</span>
        </button>
      </div>
    {:else}
      <button class="account-info login-btn" on:click={() => window.location.href = '/login'}>
        Log in
      </button>
    {/if}
    <p class="paper">Today's Paper</p>
  </header>
  
  <div class="grid-container">
    {#each articles as article}
      <section class="article-card">
        {#if article.multimedia?.default?.url}
          <img
            src={article.multimedia.default.url} 
            alt={article.headline.main}
            class="responsive-img"
          />
        {:else}
          <img
            src="images/image2.png"
            alt="No image"
            class="responsive-img"
          >
        {/if}

        <h2>{article.headline.main}</h2>
        {#if article.abstract}
          <p>{article.abstract}</p>
        {:else}
          <p>{article.snippet}</p>
        {/if}
      </section>
    {/each}
  </div>
  
  {#if showSidebar && userEmail}
    <div class="sidebar-overlay" on:click={toggleSidebar}></div>
    <div class="sidebar">
      <div class="sidebar-header">
        <span>{userEmail}</span>
        <button class="close-btn" on:click={toggleSidebar}>✕</button>
      </div>
      <div class="sidebar-content">
        <div class="greeting">
          <p>Good afternoon.</p>
        </div>
        <div class="logout-container">
          <button class="logout-btn" on:click={logout}>
            Log out
            <span class="hand-icon"></span>
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <footer>
    <p></p>
  </footer>
</main>

<style>
  
</style>