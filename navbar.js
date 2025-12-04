// navbar 공통 사용

document.addEventListener('DOMContentLoaded', function () {
    const loginIconLink = document.querySelector('.navbar_icons a:first-child');
    if (!loginIconLink) return;

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || '';

    if (isLoggedIn) {

        loginIconLink.insertAdjacentHTML('afterbegin', `<span class="user_greeting">${username} 님</span>`);

        loginIconLink.addEventListener('click', function (event) {
            event.preventDefault();

            const confirmLogout = confirm("로그아웃 하시겠습니까?");

            if (confirmLogout) {
                // 예 : 스토리지 비우고 새로고침
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('username');
                alert("로그아웃 되었습니다.");

                // 메인 페이지로 이동 
                window.location.href = './index.html';
            } else {
                // 아니오 : 변경 없음
            }
        });

    } else {
        loginIconLink.href = 'pages/login/login.html';
    }
});