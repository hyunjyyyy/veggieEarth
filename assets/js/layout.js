document.addEventListener("DOMContentLoaded", () => {
    // 1. 경로 계산
    const isRoot = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/");
    const pathPrefix = isRoot ? "." : "../.."; 

    const headerHTML = `
    <nav class="navbar">
        <div class="navbar_container">
            <a href="${pathPrefix}/index.html" class="navbar_logo">
                <img src="${pathPrefix}/assets/images/logo.png" alt="로고">
            </a>
            <ul class="navbar_menu">
                <li><a href="${pathPrefix}/index.html" class="nav_item">HOME</a></li>
                <li><a href="${pathPrefix}/pages/recipe/recipe_main.html" class="nav_item">RECIPE</a></li>
                <li><a href="${pathPrefix}/pages/map/map.html" class="nav_item">MAP</a></li>
                <li><a href="${pathPrefix}/pages/community/community.html" class="nav_item">COMMUNITY</a></li>
                <li><a href="${pathPrefix}/pages/mypage/mypage.html" class="nav_item">MYPAGE</a></li>
            </ul>
            <div class="navbar_icons">
                <a href="${pathPrefix}/pages/login/login.html" id="loginLink">
                    <img src="${pathPrefix}/assets/images/login_dark.png" alt="로그인">
                </a>
                <a href="#">
                    <img src="${pathPrefix}/assets/images/setting_dark.png" alt="설정">
                </a>
            </div>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);

    // ★ 수정 1: 함수를 호출할 때 pathPrefix를 괄호 안에 넣어 전달합니다.
    updateLoginState(pathPrefix);
});

// ★ 수정 2: 함수가 pathPrefix를 받을 수 있게 괄호 안에 변수명을 적어줍니다.
function updateLoginState(pathPrefix) {
    const currentUser = localStorage.getItem('currentUser');
    const loginLink = document.getElementById('loginLink');

    if (currentUser && loginLink) {
        loginLink.href = "#"; 
        
        // 이제 여기서 pathPrefix를 정상적으로 사용할 수 있습니다.
        loginLink.innerHTML = `
            <span style="font-weight:bold; color:#688F4E; margin-right:5px;">${currentUser}님</span>
            <img id="btnLogout" src="${pathPrefix}/assets/images/logout.png" alt="로그아웃" style="cursor:pointer; vertical-align:middle;">
        `;

        // 로그아웃 클릭 이벤트
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault(); // a태그 이동 막기
                e.stopPropagation(); // 이벤트 버블링 막기 (안전장치)
                
                if(confirm("로그아웃 하시겠습니까?")) {
                    localStorage.removeItem('currentUser');
                    location.reload();
                }
            });
        }
    }
}