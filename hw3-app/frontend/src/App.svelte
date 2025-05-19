<script lang="ts">
  import { onMount } from 'svelte';
  import svelteLogo from './assets/svelte.svg';
  import viteLogo from '/vite.svg';
  import nytlogo from './assets/logo.png';
  import comment from './assets/comment.png';

  let apiKey: string = '';
  let articles: any[] = [];
  let userEmail = null;
  let showSidebar = false;
  let isAdmin = false;
  let replyingTo = null;
  let replyContent = '';
  let selectedArticle = null;
  let comments = [];
  let newComment = '';
  let showCommentModal = false;

  function handleCommentClick(article) {
    selectedArticle = article;
    loadComments(article.headline.main);
    showCommentModal = true;
  }

  function autoResize(event) {
    const textarea = event.target;
    textarea.style.height = 'auto'; 
    textarea.style.height = `${textarea.scrollHeight}px`; 
  }

  async function loadComments(articleTitle) {
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(articleTitle)}`, {
        credentials: 'include'
      });
      if (res.ok) {
        comments = await res.json();
      } else {
        console.error('Failed to load comments:', await res.text());
        comments = [];
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      comments = [];
    }
  }

  async function submitComment() {
    if (!userEmail) {
      alert('Please log in to add a comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleTitle: selectedArticle.headline.main,
          content: newComment.trim(),
          parentId: null 
        })
      });

      if (res.ok) {

        loadComments(selectedArticle.headline.main);
        newComment = '';
      } else {
        console.error('Failed to submit comment:', await res.text());
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }

  async function submitReply(comment) {
    if (!userEmail) {
      alert('Please log in to reply');
      return;
    }

    if (!replyContent.trim()) {
      return;
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleTitle: selectedArticle.headline.main,
          content: replyContent.trim(),
          parentId: comment._id
        })
      });

      if (res.ok) {

        loadComments(selectedArticle.headline.main);
        replyContent = '';
        replyingTo = null; 
      } else {
        console.error('Failed to submit reply:', await res.text());
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  }

  /*async function deleteComment(comment) {
    if (!isAdmin) return;
    
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(selectedArticle.headline.main)}/${encodeURIComponent(comment.user)}/${encodeURIComponent(comment._id || '')}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        loadComments(selectedArticle.headline.main);
      } else {
        console.error('Failed to delete comment:', await res.text());
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }*/
  async function deleteComment(commentId: string) {
    if (!isAdmin) return;

    const articleTitle = selectedArticle.headline.main;
    try {
      const res = await fetch(
        `/api/comments/${encodeURIComponent(articleTitle)}/${encodeURIComponent(commentId)}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (res.ok) {
        await loadComments(articleTitle);
      } else {
        console.error('Failed to delete comment:', await res.text());
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }


  function closeCommentModal() {
    showCommentModal = false;
    selectedArticle = null;
    comments = [];
    newComment = '';
    replyingTo = null;
    replyContent = '';
  }

  function cancelReply() {
    replyingTo = null;
    replyContent = '';
  }

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
        await Promise.all(articles.map(async (article) => {
          try {
            const commentRes = await fetch(`/api/comments/${encodeURIComponent(article.headline.main)}`, {
              credentials: 'include'
            });
            if (commentRes.ok) {
              const articleComments = await commentRes.json();
              article.commentCount = articleComments.length;
            } else {
              article.commentCount = 0;
            }
          } catch (error) {
            console.error(`Error loading comment count for article ${article.headline.main}:`, error);
            article.commentCount = 0;
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    }
    try {
      const res = await fetch("/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        userEmail = data.email;
        // Check if the user is admin or moderator
        isAdmin = userEmail?.includes('admin') || userEmail?.includes('moderator');
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
        <div class="comment-button-container">
          <button 
            class="comment-button" 
            on:click={() => handleCommentClick(article)}
            aria-label="View comments"
          >
          <span class="comment-icon">
            <img src={comment} alt="Comments" class="comment-icon-img" />
          </span>
            <span class="comment-count">{article.commentCount || 0}</span>
          </button>
        </div>
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
  
  <!-- Comment Modal -->
  {#if showCommentModal && selectedArticle}
    <div class="sidebar-overlay" on:click={closeCommentModal}></div>
    <div class="comment-sidebar">
      <div class="sidebar-header">
        <h3>Comments for: {selectedArticle.headline.main}</h3>
        <button class="close-btn" on:click={closeCommentModal}>✕</button>
      </div>
      
      <div class="comment-form">
        {#if userEmail}
          <textarea
            bind:value={newComment}
            placeholder="Share your thoughts."
            class="auto-textarea"
            on:input={autoResize}
          />
          <button class="submit-comment-btn" on:click={submitComment}>Post Comment</button>
        {:else}
          <p class="login-prompt">Please <a href="/login">log in</a> to comment.</p>
        {/if}
      </div>

      <div class="comments-section">
        {#each comments as comment}
          <div class="comment">
            <div class="comment-header">
              <span class="comment-user">
                <span class="avatar">{comment.user[0]?.toUpperCase()}</span>
                <strong>{comment.user}</strong>
              </span>
            </div>

            <div class="comment-content">
              {#if comment.deleted}
                <p class="deleted-comment">Comment was removed by moderator</p>
              {:else}
                <p>{comment.content}</p>
              {/if}
            </div>

            {#if !comment.deleted}
              <div class="comment-actions">
                {#if userEmail}
                  <button class="action-link reply-link" on:click={() => replyingTo = comment}>Reply</button>
                {/if}
                {#if isAdmin}
                  <button class="delete-link" on:click={() => deleteComment(comment._id)}>Delete</button>
                {/if}
              </div>
            {/if}

            {#if replyingTo === comment}
              <div class="reply-box">
                <textarea 
                  bind:value={replyContent} 
                  class="auto-textarea reply-textarea" 
                  placeholder="Write a reply..."
                  on:input={autoResize}
                ></textarea>
                <div class="reply-actions">
                  <button class="cancel-reply-btn" on:click={cancelReply}>Cancel</button>
                  <button class="submit-reply-btn" on:click={() => submitReply(comment)}>Reply</button>
                </div>
              </div>
            {/if}

            {#if comment.replies && comment.replies.length > 0}
              <div class="replies">
                <!--{#each comment.replies as reply}
                  <div class="reply">
                    <div class="reply-header">
                      <span class="comment-user">
                        <span class="avatar">{reply.user[0]?.toUpperCase()}</span>
                        <strong>{reply.user}</strong>
                      </span>
                    </div>
                    {#if reply.deleted}
                      <p class="deleted-comment">Comment was removed by moderator</p>
                    {:else}
                      <p>{reply.content}</p>
                    {/if}
                    {#if isAdmin && !reply.deleted}
                      <div class="reply-actions">
                        <button class="action-link delete-link" on:click={() => deleteComment(reply)}>Delete</button>
                      </div>
                    {/if}
                  </div>
                {/each} -->
                {#each comments.filter(c => !c.replyTo) as comment}
                  <div class="comment">

                    <p>{comment.content}</p>

                    <div class="replies">
                      {#each comments.filter(r => r.replyTo === comment._id) as reply}
                        <div class="reply">
                          <p>{reply.content}</p>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <footer>
    <p></p>
  </footer>
</main>

<style>
  
</style>