document.addEventListener("DOMContentLoaded", () => {
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
                <a href="${pathPrefix}/pages/setting/setting.html" id="settingLink">
                    <img src="${pathPrefix}/assets/images/setting_dark.png" alt="설정">
                </a>
            </div>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);

    updateLoginState(pathPrefix);

    const navItems = document.querySelectorAll('.nav_item');

    navItems.forEach(item => {
        if (item.textContent.trim() === 'MYPAGE') {
            item.addEventListener('click', function (e) {
                const currentUser = localStorage.getItem('currentUser');

                if (!currentUser) {
                    e.preventDefault();
                    alert("로그인이 필요한 서비스입니다.");

                    if (confirm("로그인 페이지로 이동하시겠습니까?")) {
                        window.location.href = "../../pages/login/login.html";
                    }
                }
            });
        }
    });

    // 설정(SETTING) 로그인 확인
    const settingLink = document.getElementById('settingLink');
    if (settingLink) {
        settingLink.addEventListener('click', function (e) {
            const currentUser = localStorage.getItem('currentUser');

            if (!currentUser) {
                e.preventDefault();
                alert("로그인이 필요한 서비스입니다.");

                if (confirm("로그인 페이지로 이동하시겠습니까?")) {
                    window.location.href = isRoot ? "./pages/login/login.html" : "../../pages/login/login.html";
                }
            }
        });
    }
});

function updateLoginState(pathPrefix) {
    const currentUser = localStorage.getItem('currentUser');
    const loginLink = document.getElementById('loginLink');

    if (currentUser && loginLink) {
        loginLink.href = "#";

        loginLink.innerHTML = `
            <span style="font-weight:bold; color:#688F4E; margin-right:5px;">${currentUser}님</span>
            <img id="btnLogout" src="${pathPrefix}/assets/images/logout.png" alt="로그아웃" style="cursor:pointer; vertical-align:middle;">
        `;

        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (confirm("로그아웃 하시겠습니까?")) {
                    localStorage.removeItem('currentUser');
                    location.reload();
                }
            });
        }
    }
}