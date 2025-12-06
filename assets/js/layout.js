// /assets/js/layout.js

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
                <a href="${pathPrefix}/pages/login/login.html">
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
});