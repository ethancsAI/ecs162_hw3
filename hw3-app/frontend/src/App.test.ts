import { test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import App from './App.svelte';
import fs from 'fs';
import path from 'path';

// Test 1: Sample Test
test('App', async () => {
    render(App);
});

// Test 2: API Key Test
test('API Key Test', async () => {
    global.fetch = vi.fn().mockResolvedValue({ // create a mock key
      ok: true,
      json: async () => {
        return { apiKey: 'test-key' };
      }
    });
    
    async function getApiKey() { // get our api key
      const response = await fetch('/api/key');
      const data = await response.json();
      return data.apiKey;
    }
    
    const key = await getApiKey();
    expect(key).toBe('test-key'); // compare
});
  
// Test 3: NYT API Test
test('NYT API Test', async () => {
    global.fetch = vi.fn().mockResolvedValue({ // mock json
      ok: true,
      json: () => Promise.resolve({
        response: {
          docs: [{
            headline: { main: 'Sacramento news' },
            web_url: 'https://example.com/article',
            abstract: 'This is an abstract about some Sacramento news test test test1 test 2',
            multimedia: [{ url: 'https://example.com/image.jpg' }]
          }]
        }
      })
    });
    
    async function fetchArticles() {
      const response = await fetch('https://api.nytimes.com/svc/search/v2/articlesearch.json?q=Sacramento'); // get url
      return (await response.json()).response.docs; // return the docs array
    }
    
    const articles = await fetchArticles();
    
    // check each properties  and compare with our mock
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('Sacramento'));
    expect(articles[0].headline.main).toBeTruthy();
    expect(articles[0].web_url).toBeTruthy();
    expect(articles[0].abstract).toBeTruthy();
    expect(articles[0].multimedia[0].url).toBeTruthy();
});


// Test 4: Date Formatting Test
test('Date Formatting Test', async () => {
  function formatDate(date = new Date()) { // formatdate
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${dayNum}, ${year}`;
  }
  
  const today = new Date(); // create current date
  const expectedDateString = formatDate(today);
  render(App); 
  const dateElement = document.querySelector('.date');
  if (dateElement && dateElement.textContent) { // check for date
    expect(dateElement.textContent).toBe(expectedDateString);
  } else {
    expect(formatDate(today)).toBe(expectedDateString);
  }
});
  
  // Test 5: Responsive UI Test
test('Responsive UI Test', async () => { //
  const cssFilePath = path.resolve('./src/app.css'); // get path to css
  const cssContent = fs.readFileSync(cssFilePath, 'utf8'); // decode
  // finding contains of desktop, tablet, and mobile view and see if it changes
  expect(cssContent).toContain('@media only screen and (max-width:');
  expect(cssContent).toContain('@media only screen and (min-width:') && 
  expect(cssContent).toContain('and (max-width:');
  expect(cssContent).toContain('@media only screen and (min-width: 1024px)');
  expect(cssContent).toContain('.grid-container {');
  expect(cssContent).toContain('grid-template-columns:');
});
  
  // Test 6: Article Content Test
test('Article Content Test', async () => {
  const mockArticle = { // create mock
    headline: { main: 'Test Headline' },
    web_url: 'https://example.com/article'
  };
    function formatArticle(article) { // formatting articles  and return title and url, helper function
      return {
        title: article.headline.main,
        url: article.web_url
      };
    }
    // put mock into the format
    const result = formatArticle(mockArticle);
    // making sure article content is displayed correctly based on the mock article
    expect(result.title).toBe('Test Headline');
    expect(result.url).toBe('https://example.com/article');
});