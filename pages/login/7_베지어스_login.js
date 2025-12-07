const loginForm = document.querySelector('.login_form');
const loginContainer = document.querySelector('.login_container');

let returnUrl = '../../7_베지어스_index.html';

const referrer = document.referrer; 

if (referrer) {
    if (referrer.includes('7_베지어스_register.html') || referrer.includes('7_베지어스_login.html')) {
        returnUrl = '../../7_베지어스_index.html';
    } 
    else {
        returnUrl = referrer;
    }
}

const params = new URLSearchParams(window.location.search);

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;

    localStorage.setItem('currentUser', username);

    loginContainer.innerHTML = `
        <div class="login_success">
            <div class="success_icon">🌱</div>
            <p class="success_text">${username}님, 환영합니다!</p>
            <p class="redirect_text">잠시 후 페이지가 이동합니다...</p>
        </div>
    `;

    setTimeout(() => {
        window.location.href = returnUrl; 
    }, 2500);
});