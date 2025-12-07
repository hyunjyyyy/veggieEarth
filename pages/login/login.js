const loginForm = document.querySelector('.login_form');
const loginContainer = document.querySelector('.login_container');

// 로그인 전에 돌아갈 URL 가져오기 (파라미터 또는 이전 페이지)
const params = new URLSearchParams(window.location.search);
const returnUrl = params.get('returnUrl') || document.referrer || '../../index.html';

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;

    // 로컬스토리지에 로그인 상태 저장
    localStorage.setItem('currentUser', username);

    // 로그인 성공 메시지
    loginContainer.innerHTML = `
        <div class="login_success">
            <div class="success_icon">🌱</div>
            <p class="success_text">${username}님, 환영합니다!</p>
            <p class="redirect_text">잠시 후 이전 페이지로 이동합니다...</p>
        </div>
    `;

    setTimeout(() => {
        // 이전 페이지로 이동
        window.location.href = decodeURIComponent(returnUrl);
    }, 2500);
});
