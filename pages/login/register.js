document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById('registerForm');
    const registerContainer = document.querySelector('.register_container');
    const pwInput = document.getElementById('reg_password');
    const pwConfirmInput = document.getElementById('reg_password_confirm');
    const errorMsg = document.getElementById('pw_error_msg');

    // 비밀번호 실시간 확인 로직
    function checkPasswordMatch() {
        if (pwConfirmInput.value === '') {
            errorMsg.textContent = '';
            return;
        }
        if (pwInput.value !== pwConfirmInput.value) {
            errorMsg.textContent = '비밀번호가 일치하지 않습니다.';
            pwConfirmInput.style.borderColor = '#e74c3c'; // 빨간색 경고
        } else {
            errorMsg.textContent = '';
            pwConfirmInput.style.borderColor = '#688F4E'; // 초록색 성공
        }
    }

    pwInput.addEventListener('input', checkPasswordMatch);
    pwConfirmInput.addEventListener('input', checkPasswordMatch);


    // 폼 제출 시 실행
    registerForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // 최종 비밀번호 확인
        if (pwInput.value !== pwConfirmInput.value) {
            alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
            pwConfirmInput.focus();
            return;
        }

        const username = document.getElementById('reg_username').value;

        /* (선택사항) 여기에 localStorage 저장 로직 추가 가능
           예: const newUser = { id: username, name: name ... };
           localStorage.setItem('users', JSON.stringify(newUser));
        */

        // 성공 화면 렌더링 (login.js 스타일 유지)
        registerContainer.innerHTML = `
            <div class="register_success">
                <div class="success_icon">🎉</div>
                <p class="success_text">${username}님, 환영합니다!</p>
                <p class="redirect_text">회원가입이 완료되었습니다.</p>
                <p class="redirect_text" style="font-size:14px; margin-top:5px;">로그인 페이지로 이동합니다...</p>
            </div>
        `;

        // 2초 뒤 로그인 페이지로 이동
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });
});