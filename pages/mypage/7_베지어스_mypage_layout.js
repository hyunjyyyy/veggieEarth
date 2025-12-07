document.addEventListener("DOMContentLoaded", () => {
    // 현재 페이지 확인 (활성화할 메뉴 찾기)
    const pathname = window.location.pathname;
    let activePage = 'home';
    if (pathname.includes('myrecipe')) activePage = 'recipe';
    else if (pathname.includes('mycommunity')) activePage = 'community';

    const pathPrefix = "../../";

    const sidebarHTML = `
    <aside class="mypage_sidebar">
        <a href="7_베지어스_mypage.html" class="mypage_sidebar_item ${activePage === 'home' ? 'active' : ''}" title="홈">
            <img src="${pathPrefix}assets/images/7_home.png" alt="Home" />
        </a>
        <a href="7_베지어스_mypage_myrecipe.html" class="mypage_sidebar_item ${activePage === 'recipe' ? 'active' : ''}" title="나의 레시피">
            <img src="${pathPrefix}assets/images/7_myrecipe.png" alt="Myrecipe" />
        </a>
        <a href="7_베지어스_mypage_mycommunity.html" class="mypage_sidebar_item ${activePage === 'community' ? 'active' : ''}" title="커뮤니티 활동">
            <img src="${pathPrefix}assets/images/7_community.png" alt="Mycommunity" />
        </a>
    </aside>
    `;

    const profileHTML = `
    <section class="mypage_profile_section">
        <div class="mypage_avatar_container">
            <img src="${pathPrefix}assets/images/7_Profile3.png" alt="avatar image" id="profileAvatar" />
            <input type="file" id="profileImageInput" accept="image/*" style="display: none;" />
        </div>

        <div class="mypage_profile_info">
            <div class="mypage_profile_row">
                <div class="mypage_profile_label">name</div>
                <div class="mypage_profile_value">
                    <span class="mypage_tag" id="profileName">-</span>
                </div>
            </div>
            <div class="mypage_profile_row">
                <div class="mypage_profile_label">vegan types</div>
                <div class="mypage_profile_value">
                    <span class="mypage_tag" id="profileType">-</span>
                </div>
            </div>
            <div class="mypage_profile_row">
                <div class="mypage_profile_label">badge</div>
                <div class="mypage_profile_value" style="display: flex; align-items: center; gap: 10px;">
                    <span class="mypage_tag" id="profileBadge">Loading...</span>
                    <button id="btnBadgeGuide" class="mypage_btn mypage_badge_btn_small">?</button>
                </div>
            </div>
            <div class="mypage_action_buttons">
                <button id="btnEditProfile" class="mypage_btn">Edit</button>
            </div>
        </div>
    </section>
    `;

    const modalHTML = `
    <div id="mypage_badgeGuideModal" class="mypage_badge_modal">
        <div class="mypage_badge_modal_overlay"></div>
        <div class="mypage_badge_modal_content">
            <button class="mypage_badge_modal_close">&times;</button>
            <h2 class="mypage_badge_modal_title">🌱 비건 뱃지 가이드</h2>
            <p class="mypage_badge_modal_subtitle">활동하면서 뱃지를 업그레이드 해보세요!</p>
            <div class="mypage_badge_list"></div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    const contentWrapper = document.querySelector('.mypage_content_wrapper');
    if (contentWrapper) {
        contentWrapper.insertAdjacentHTML('afterbegin', profileHTML);
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
});