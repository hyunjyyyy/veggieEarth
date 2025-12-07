document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById('registerForm');
    const registerContainer = document.querySelector('.register_container');
    const pwInput = document.getElementById('reg_password');
    const pwConfirmInput = document.getElementById('reg_password_confirm');
    const errorMsg = document.getElementById('pw_error_msg');

    function checkPasswordMatch() {
        if (pwConfirmInput.value === '') {
            errorMsg.textContent = '';
            return;
        }
        if (pwInput.value !== pwConfirmInput.value) {
            errorMsg.textContent = '비밀번호가 일치하지 않습니다.';
            pwConfirmInput.style.borderColor = '#e74c3c';
        } else {
            errorMsg.textContent = '';
            pwConfirmInput.style.borderColor = '#688F4E';
        }
    }

    pwInput.addEventListener('input', checkPasswordMatch);
    pwConfirmInput.addEventListener('input', checkPasswordMatch);


    registerForm.addEventListener('submit', function (event) {
        event.preventDefault();

        if (pwInput.value !== pwConfirmInput.value) {
            alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
            pwConfirmInput.focus();
            return;
        }

        const username = document.getElementById('reg_username').value;

        registerContainer.innerHTML = `
            <div class="register_success">
                <div class="success_icon">🎉</div>
                <p class="success_text">${username}님, 환영합니다!</p>
                <p class="redirect_text">회원가입이 완료되었습니다.</p>
                <p class="redirect_text" style="font-size:14px; margin-top:5px;">로그인 페이지로 이동합니다...</p>
            </div>
        `;

        setTimeout(() => {
            window.location.href = '7_베지어스_login.html';
        }, 2000);
    });
});