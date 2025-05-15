import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

function todayDate() {
  let months = [ "January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"]; // array of months
  let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; // array of days
  let today = new Date();
  let dayName = days[today.getDay()];   // built in js functions
  let monthName = months[today.getMonth()]; 
  let dayNum = today.getDate();        
  let year = today.getFullYear();   
  let date = dayName + ", " + monthName + " " + dayNum + ", " + year; // format them
  let dateId = document.querySelector(".date"); // get id
  if (document.querySelector(".date")) dateId.textContent = date;
}
function makeRequest() {
  fetch('https://api.nytimes.com/svc/search/v2/articlesearch.json?q=election&api-key=NLoBQZiM2qmf6XtMkOAJSwE8MAGJ46K2')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response error');  
      }
      return response.json();
    })
    .then(data => {
      console.log('test')
      console.log(data);
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}
window.onload = (event) => { // when page is loaded then display date
  todayDate();
};

export default app
