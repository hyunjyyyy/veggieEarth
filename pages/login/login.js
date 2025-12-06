const loginForm = document.querySelector('.login_form');
const loginContainer = document.querySelector('.login_container');

loginForm.addEventListener('submit', function (event) {

    event.preventDefault();

    const username = document.getElementById('username').value;

    // 로컬스토리지에 로그인 상태 저장
    localStorage.setItem('currentUser', username);

    loginContainer.innerHTML = `
        <div class="login_success">
            <div class="success_icon">🌱</div>
            <p class="success_text">${username}님, 환영합니다!</p>
            <p class="redirect_text">잠시 후 메인 페이지로 이동합니다...</p>
        </div>
    `;

    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 2500);
});